import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Mail, CheckCircle2, RefreshCw, ExternalLink } from 'lucide-react';
import { auth } from '@/lib/firebase';

interface EmailVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  email: string;
  firebaseUid?: string;
  onVerified?: () => void;
  userPassword?: string; // Optional password for resending when signed out
}

export default function EmailVerificationModal({ isOpen, onClose, email, firebaseUid, onVerified, userPassword }: EmailVerificationModalProps) {
  const { resendVerificationEmail, resendVerificationEmailByCredentials } = useAuth();
  const { toast } = useToast();
  const [isResending, setIsResending] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [checkingVerification, setCheckingVerification] = useState(false);

  useEffect(() => {
    console.log('[EmailVerificationModal] Modal state changed - isOpen:', isOpen, 'email:', email, 'firebaseUid:', firebaseUid);
    if (isOpen && email) {
      console.log('[EmailVerificationModal] ✅ Modal opened for email:', email);
      // Reset verification status when modal opens
      setIsVerified(false);
    } else if (isOpen && !email) {
      console.warn('[EmailVerificationModal] ⚠️ Modal is open but email is empty!');
    }
  }, [isOpen, email, firebaseUid]);

  // Countdown timer for resend
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  // Check if email is verified
  const checkEmailVerification = async () => {
    if (!firebaseUid) {
      console.warn('[EmailVerificationModal] No firebaseUid provided, cannot check verification');
      toast({
        title: 'Unable to check verification',
        description: 'Please try logging in to verify your email status.',
        variant: 'default',
      });
      return;
    }
    
    setCheckingVerification(true);
    try {
      // Try to get the user from auth (they might be signed in)
      let user = auth.currentUser;
      
      // If user is not signed in, we can't check verification status directly
      // In this case, we'll just show a message that they should try logging in
      if (!user) {
        console.log('[EmailVerificationModal] User not signed in, cannot check verification status');
        toast({
          title: 'Please try logging in',
          description: 'After clicking the verification link, try logging in. If verification was successful, you\'ll be able to log in.',
          variant: 'default',
        });
        return;
      }

      // Reload the user to get latest emailVerified status
      await user.reload();
      console.log('[EmailVerificationModal] User reloaded, emailVerified:', user.emailVerified);
      
      if (user.emailVerified) {
        console.log('[EmailVerificationModal] ✅ Email verified!');
        setIsVerified(true);
        
        // Update Firestore user document
        const { doc, updateDoc, collection, query, where, getDocs } = await import('firebase/firestore');
        const { db } = await import('@/lib/firebase');
        const usersRef = collection(db, 'users');
        const userQuery = query(usersRef, where('firebaseUid', '==', user.uid));
        const userSnapshot = await getDocs(userQuery);
        
        if (!userSnapshot.empty) {
          const userDoc = userSnapshot.docs[0];
          await updateDoc(doc(db, 'users', userDoc.id), { emailVerified: true });
          console.log('[EmailVerificationModal] ✅ Firestore user document updated');
        }
        
        toast({
          title: 'Email verified successfully!',
          description: 'Your email has been verified. You can now log in.',
        });
        setTimeout(() => {
          onVerified?.();
          handleClose();
        }, 2000);
      } else {
        toast({
          title: 'Not verified yet',
          description: 'Please click the verification link in your email.',
          variant: 'default',
        });
      }
    } catch (error: any) {
      console.error('[EmailVerificationModal] Error checking verification:', error);
      toast({
        title: 'Error checking verification',
        description: error.message || 'Please try logging in to verify your email status.',
        variant: 'default',
      });
    } finally {
      setCheckingVerification(false);
    }
  };

  const handleResend = async () => {
    if (countdown > 0) return;
    
    setIsResending(true);
    try {
      // Get the current Firebase user
      const user = auth.currentUser;
      
      if (user) {
        // User is signed in - use normal resend
        console.log('[EmailVerificationModal] Resending verification email (user signed in)...');
        await resendVerificationEmail(user);
      } else if (userPassword) {
        // User is signed out but we have password - sign in temporarily
        console.log('[EmailVerificationModal] Resending verification email (user signed out, using credentials)...');
        await resendVerificationEmailByCredentials(email, userPassword);
      } else {
        // User is signed out and we don't have password
        console.warn('[EmailVerificationModal] User not signed in and no password provided, cannot resend email');
        toast({
          title: 'Unable to resend',
          description: 'Please try signing in again, or check your email for the original verification link.',
          variant: 'default',
        });
        return;
      }
      
      setCountdown(60); // 60 second cooldown
      toast({
        title: 'Verification email resent',
        description: 'A new verification email has been sent. Please check your inbox.',
      });
      console.log('[EmailVerificationModal] ✅ Verification email resent successfully');
    } catch (error: any) {
      console.error('[EmailVerification] Error resending email:', error);
      toast({
        title: 'Failed to resend email',
        description: error.message || 'Please try again later.',
        variant: 'destructive',
      });
    } finally {
      setIsResending(false);
    }
  };

  const handleClose = () => {
    setIsVerified(false);
    setCountdown(0);
    onClose();
  };

  // Don't render if email is not provided
  if (!email) {
    return null;
  }

  return (
    <Dialog open={isOpen && !!email} onOpenChange={(open) => { if (!open && !isVerified) handleClose(); }}>
      <DialogContent className="w-[95vw] sm:max-w-md bg-card border-border p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="text-lg sm:text-xl text-card-foreground">Verify Your Email</DialogTitle>
          <DialogDescription className="text-sm sm:text-base text-muted-foreground">
            {isVerified
              ? 'Your email has been verified successfully!'
              : `We've sent a verification email to ${email}. Please click the link in the email to verify your account.`}
          </DialogDescription>
        </DialogHeader>

        {isVerified ? (
          <div className="flex flex-col items-center justify-center py-6 sm:py-8 space-y-3 sm:space-y-4">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
              <CheckCircle2 className="w-7 h-7 sm:w-8 sm:h-8 text-green-600 dark:text-green-400" />
            </div>
            <div className="text-center space-y-2">
              <p className="text-sm sm:text-base font-medium text-card-foreground">
                Email Verified Successfully!
              </p>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Redirecting to login...
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex flex-col items-center justify-center py-4 space-y-3">
              <div className="w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
                <Mail className="w-8 h-8 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="text-center space-y-2">
                <p className="text-sm sm:text-base text-card-foreground">
                  Check your email inbox
                </p>
                     <p className="text-xs sm:text-base text-muted-foreground">
                       We sent a verification link to <strong>{email}</strong>
                     </p>
                     <p className="text-xs sm:text-sm text-muted-foreground mt-2 px-2">
                       📧 <strong>Check your inbox</strong> (and spam folder) for an email from Firebase.
                     </p>
                     <p className="text-xs sm:text-sm text-muted-foreground mt-1 px-2">
                       🔗 <strong>Click the verification link</strong> in the email. It will automatically verify your account and redirect you back to the login page.
                     </p>
                     <p className="text-xs text-muted-foreground mt-2 px-2 italic">
                       Once verified, you can log in with your credentials.
                     </p>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <Button
                onClick={checkEmailVerification}
                disabled={checkingVerification}
                className="w-full"
                variant="outline"
              >
                {checkingVerification ? 'Checking...' : 'I\'ve Verified My Email'}
              </Button>

              <div className="flex items-center justify-between text-sm">
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={isResending || countdown > 0}
                  className="text-primary hover:text-primary/80 disabled:text-muted-foreground disabled:cursor-not-allowed flex items-center gap-1"
                >
                  <RefreshCw className={`w-3 h-3 ${isResending ? 'animate-spin' : ''}`} />
                  {countdown > 0 ? `Resend in ${countdown}s` : isResending ? 'Sending...' : 'Resend Email'}
                </button>
              </div>

              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                className="w-full"
              >
                Close
              </Button>
            </div>

            <div className="text-xs text-muted-foreground text-center space-y-1 pt-2 border-t">
              <p>💡 <strong>Tip:</strong> Check your spam folder if you don't see the email.</p>
              <p>The verification link expires after a few hours.</p>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
