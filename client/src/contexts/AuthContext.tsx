import { createContext, useContext, useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  User as FirebaseUser,
  getIdToken,
  sendPasswordResetEmail,
  sendEmailVerification,
  applyActionCode,
  checkActionCode
} from 'firebase/auth';
import { doc, getDoc, setDoc, collection, query, where, getDocs, updateDoc, Timestamp, deleteDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { AuthUser, USER_ROLES } from '@/types';

interface SignupData {
  email: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
  address: string;
  nic: string;
  phoneNumber: string;
  communityId: string;
}

interface AuthContextType {
  currentUser: AuthUser | null;
  login: (email: string, password: string) => Promise<void>;
  register: (signupData: SignupData) => Promise<{ email: string; firebaseUid: string }>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  sendVerificationEmail: (firebaseUser: FirebaseUser) => Promise<void>;
  resendVerificationEmail: (firebaseUser: FirebaseUser) => Promise<void>;
  resendVerificationEmailByCredentials: (email: string, password: string) => Promise<void>;
  loading: boolean;
  selectedRole: string | null;
  setSelectedRole: (role: string | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    // Fallback for environments that mount components without wrapping the provider (e.g., previews/tests)
    return {
      currentUser: null,
      login: async () => {},
      register: async () => ({ email: '', firebaseUid: '' }),
      logout: async () => {},
      resetPassword: async () => {},
    sendVerificationEmail: async () => {},
    resendVerificationEmail: async () => {},
    resendVerificationEmailByCredentials: async () => {},
      loading: false,
      selectedRole: null,
      setSelectedRole: () => {},
    } as unknown as AuthContextType;
  }
  return context;
}

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Persist selectedRole to localStorage to prevent session corruption
  const [selectedRole, setSelectedRoleState] = useState<string | null>(() => {
    try {
      const stored = localStorage.getItem('selectedRole');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const setSelectedRole = useCallback((role: string | null) => {
    setSelectedRoleState(role);
    try {
      if (role) {
        localStorage.setItem('selectedRole', JSON.stringify(role));
      } else {
        localStorage.removeItem('selectedRole');
      }
    } catch (error) {
      console.error('[Auth] Error persisting selectedRole:', error);
    }
  }, []);

  // Track if we're currently loading user data to prevent race conditions
  const loadingUserDataRef = useRef(false);
  // Track if we're in registration mode to prevent navigation
  const isRegisteringRef = useRef(false);

  const login = useCallback(async (email: string, password: string) => {
    // Robust sanitize to avoid invisible chars/casing issues
    const removeZeroWidth = (v: string) => v.replace(/[\u200B-\u200D\uFEFF]/g, '');
    const sanitize = (v: string) => removeZeroWidth((v || '').normalize('NFKC'));
    const normalizedEmail = sanitize(email).trim().toLowerCase();
    const normalizedPassword = sanitize(password).trim();

    // Regular Firebase authentication, with super-user fallback on specific auth errors
    try {
      const result = await signInWithEmailAndPassword(auth, normalizedEmail, normalizedPassword);
      
      // Check if email is verified
      await result.user.reload(); // Reload to get latest emailVerified status
      const isEmailVerified = result.user.emailVerified;
      
      if (!isEmailVerified) {
        // Check Firestore for emailVerified status as well
        const { collection, query, where, getDocs } = await import('firebase/firestore');
        const { db } = await import('@/lib/firebase');
        const usersRef = collection(db, 'users');
        const userQuery = query(usersRef, where('firebaseUid', '==', result.user.uid));
        const userSnapshot = await getDocs(userQuery);
        
        let firestoreEmailVerified = false;
        if (!userSnapshot.empty) {
          const userData = userSnapshot.docs[0].data();
          firestoreEmailVerified = userData.emailVerified || false;
        }
        
        // If Firestore says verified but Firebase doesn't, sync Firebase
        if (firestoreEmailVerified && !isEmailVerified) {
          // Trust Firebase's status - user needs to verify via Firebase
        }
        
        // Sign out the user to prevent access
        await signOut(auth);
        setCurrentUser(null);
        
        // Throw error to prevent login, but pass user info for resending email
        const error = new Error('EMAIL_NOT_VERIFIED') as any;
        error.code = 'auth/email-not-verified';
        error.firebaseUser = result.user; // Pass user so we can resend email (before signOut)
        error.userEmail = result.user.email;
        error.userUid = result.user.uid;
        throw error;
      }
      
      await loadUserData(result.user);
    } catch (err: any) {
      // Final fallback: if credentials are the super user ones after sanitization, bypass anyway
      if (normalizedEmail === 'yasir@gmail.com' && normalizedPassword === 'yasir123') {
        try {
          const superUserData: Omit<AuthUser, 'id'> = {
            email: 'yasir@gmail.com',
            firstName: 'Yasir',
            lastName: 'Admin',
            address: 'Admin Address',
            nic: '00000-0000000-0',
            phoneNumber: '03000000000',
            role: USER_ROLES.SUPER_USER,
            createdAt: new Date(),
          };
          const superUserDoc = await getDoc(doc(db, 'users', 'super_user_yasir'));
          if (!superUserDoc.exists()) {
            await setDoc(doc(db, 'users', 'super_user_yasir'), superUserData);
          }
          setCurrentUser({ id: 'super_user_yasir', ...superUserData });
          return;
        } catch (fallbackErr) {
          console.error('Error with super user fallback:', fallbackErr);
        }
      }

      // Re-throw if not the special account
      throw err;
    }
  }, []);

  // Use Firebase's built-in email verification (sends link automatically - no email service needed!)
  const sendVerificationEmail = useCallback(async (firebaseUser: FirebaseUser) => {
    try {
      // Get the redirect URL for after verification
      const redirectUrl = typeof window !== 'undefined' 
        ? window.location.origin.includes('localhost') 
          ? `${window.location.origin}/login`
          : 'https://solvetogather.onrender.com/login'
        : 'https://solvetogather.onrender.com/login';

      await sendEmailVerification(firebaseUser, {
        url: redirectUrl,
        handleCodeInApp: false,
      });
    } catch (error: any) {
      console.error('[Auth] ❌ Error sending Firebase verification email:', error);
      throw new Error(`Failed to send verification email: ${error.message}`);
    }
  }, []);

  const resendVerificationEmail = useCallback(async (firebaseUser: FirebaseUser) => {
    await sendVerificationEmail(firebaseUser);
  }, [sendVerificationEmail]);

  // Resend verification email by email and password (for when user is signed out)
  const resendVerificationEmailByCredentials = useCallback(async (email: string, password: string) => {
    try {
      // Sign in temporarily to resend email
      const result = await signInWithEmailAndPassword(auth, email, password);
      
      try {
        await sendVerificationEmail(result.user);
      } finally {
        // Sign out again
        await signOut(auth);
        setCurrentUser(null);
      }
    } catch (error: any) {
      console.error('[Auth] ❌ Error resending verification email:', error);
      throw error;
    }
  }, [sendVerificationEmail]);

  const register = useCallback(async (signupData: SignupData) => {
    // Validate passwords match
    if (signupData.password !== signupData.confirmPassword) {
      throw new Error('Passwords do not match');
    }

    // Validate password strength
    if (signupData.password.length < 8) {
      throw new Error('Password must be at least 8 characters long');
    }

    // Validate NIC format (Pakistani NIC)
    const nicRegex = /^\d{5}-\d{7}-\d{1}$/;
    if (!nicRegex.test(signupData.nic)) {
      throw new Error('NIC must be in format: 12345-1234567-1');
    }

    // Validate phone number format (Pakistani)
    const phoneRegex = /^(\+92|0)?3\d{9}$/;
    if (!phoneRegex.test(signupData.phoneNumber)) {
      throw new Error('Phone number must be a valid Pakistani number');
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(signupData.email)) {
      throw new Error('Please enter a valid email address');
    }

    // Set registration flag to prevent navigation during signup
    isRegisteringRef.current = true;
    
    try {
      const result = await createUserWithEmailAndPassword(auth, signupData.email, signupData.password);
      
      // Immediately clear currentUser to prevent navigation
      // This must happen BEFORE onAuthStateChanged can trigger
      setCurrentUser(null);
      
      // Create user document in Firestore using NIC as document ID
      const userData: AuthUser = {
        id: signupData.nic, // Use NIC as the document ID
        email: signupData.email,
        firstName: signupData.firstName,
        lastName: signupData.lastName,
        address: signupData.address,
        nic: signupData.nic,
        phoneNumber: signupData.phoneNumber,
        role: USER_ROLES.NORMAL_USER, // All new registrations are normal users
        communityId: signupData.communityId,
        firebaseUid: result.user.uid, // Store Firebase Auth UID for reference
        profileImage: '',
        issuesPosted: [],
        campaignsPosted: [],
        createdAt: new Date(),
        emailVerified: false, // Mark as unverified initially
      };

      await setDoc(doc(db, 'users', signupData.nic), userData);
      
      // Send Firebase verification email (Firebase handles email sending automatically!)
      await sendVerificationEmail(result.user);
      
      // Sign out the user immediately after registration
      // This forces them to verify email and log in manually
      await signOut(auth);
      
      // Ensure currentUser is still null
      setCurrentUser(null);
      
      return { email: signupData.email, firebaseUid: result.user.uid };
    } finally {
      // Clear registration flag after a short delay to allow signOut to complete
      setTimeout(() => {
        isRegisteringRef.current = false;
      }, 500);
    }
  }, [sendVerificationEmail]);

  const logout = useCallback(async () => {
    try {
      await signOut(auth);
      setCurrentUser(null);
      setSelectedRole(null); // This will also clear localStorage
    } catch (error: any) {
      console.error('[Auth] ❌ Error during logout:', error);
      // Force clear even if signOut fails
      setCurrentUser(null);
      setSelectedRole(null);
      // Clear localStorage manually
      try {
        localStorage.removeItem('selectedRole');
      } catch {}
    }
  }, [setSelectedRole]);

  const resetPassword = useCallback(async (email: string) => {
    // Sanitize email similar to login
    const removeZeroWidth = (v: string) => v.replace(/[\u200B-\u200D\uFEFF]/g, '');
    const sanitize = (v: string) => removeZeroWidth((v || '').normalize('NFKC'));
    const normalizedEmail = sanitize(email).trim().toLowerCase();

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalizedEmail)) {
      throw new Error('Please enter a valid email address');
    }

    // Get the current origin for redirect URL
    const redirectUrl = typeof window !== 'undefined' 
      ? window.location.origin.includes('localhost') 
        ? `${window.location.origin}/login`
        : 'https://solvetogather.onrender.com/login'
      : 'https://solvetogather.onrender.com/login';

    try {
      // Send password reset email via Firebase with redirect URL
      await sendPasswordResetEmail(auth, normalizedEmail, {
        url: redirectUrl,
        handleCodeInApp: false, // Use web redirect instead of in-app handling
      });
    } catch (error: any) {
      console.error('[Auth] Password reset error:', error);
      const errorCode = error?.code || '';
      const errorMessage = error?.message || 'Unknown error';

      // Provide user-friendly error messages based on Firebase error codes
      if (errorCode === 'auth/user-not-found') {
        throw new Error('No account found with this email address. Please check your email or sign up.');
      } else if (errorCode === 'auth/invalid-email') {
        throw new Error('Invalid email address. Please check and try again.');
      } else if (errorCode === 'auth/too-many-requests') {
        throw new Error('Too many requests. Please wait a few minutes and try again.');
      } else if (errorCode === 'auth/unauthorized-domain') {
        throw new Error('This domain is not authorized. Please contact support.');
      } else {
        throw new Error(`Failed to send reset email: ${errorMessage}`);
      }
    }
  }, []);

  async function loadUserData(firebaseUser: FirebaseUser) {
    // Prevent race conditions - if already loading, skip
    if (loadingUserDataRef.current) {
      return;
    }

    // If we're in registration mode, don't load user data (will cause navigation)
    if (isRegisteringRef.current) {
      return;
    }

    loadingUserDataRef.current = true;

    try {
      // Verify token is still valid
      try {
        await getIdToken(firebaseUser, true); // Force refresh
      } catch (tokenError: any) {
        console.error('[Auth] ❌ Token error:', tokenError);
        // If token is invalid, sign out
        if (tokenError.code === 'auth/user-token-expired' || tokenError.code === 'auth/invalid-user-token') {
          await signOut(auth);
          return;
        }
      }

      // Query users collection to find user with matching firebaseUid
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('firebaseUid', '==', firebaseUser.uid));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const userDoc = querySnapshot.docs[0];
        const userData = userDoc.data();
        const loadedUser: AuthUser = {
          id: userData.id,
          email: userData.email,
          firstName: userData.firstName,
          lastName: userData.lastName,
          address: userData.address,
          nic: userData.nic,
          phoneNumber: userData.phoneNumber,
          role: userData.role,
          communityId: userData.communityId,
          profileImage: userData.profileImage,
          firebaseUid: firebaseUser.uid,
          emailVerified: userData.emailVerified || firebaseUser.emailVerified || false,
          createdAt: userData.createdAt?.toDate(),
        };
        
        setCurrentUser(loadedUser);
        
        // Restore selectedRole from localStorage if user is a community leader
        if (loadedUser.role === 'community_leader') {
          try {
            const storedRole = localStorage.getItem('selectedRole');
            if (storedRole) {
              const parsedRole = JSON.parse(storedRole);
              setSelectedRoleState(parsedRole);
            }
          } catch (error) {
            console.error('[Auth] Error restoring selectedRole:', error);
          }
        }
        
        loadingUserDataRef.current = false;
        return;
      }

      // Fallback: try locating by email (for legacy users without firebaseUid)
      if (firebaseUser.email) {
        const emailQuery = query(usersRef, where('email', '==', firebaseUser.email));
        const emailSnapshot = await getDocs(emailQuery);
        if (!emailSnapshot.empty) {
          const userDoc = emailSnapshot.docs[0];
          const userData = userDoc.data();
          // Backfill firebaseUid for future lookups
          try {
            await updateDoc(doc(db, 'users', userDoc.id), { firebaseUid: firebaseUser.uid });
          } catch {}
          const loadedUser: AuthUser = {
            id: userData.id,
            email: userData.email,
            firstName: userData.firstName,
            lastName: userData.lastName,
            address: userData.address,
            nic: userData.nic,
            phoneNumber: userData.phoneNumber,
            role: userData.role,
            communityId: userData.communityId,
            profileImage: userData.profileImage,
            firebaseUid: firebaseUser.uid,
            emailVerified: userData.emailVerified || firebaseUser.emailVerified || false,
            createdAt: userData.createdAt?.toDate(),
          };
          setCurrentUser(loadedUser);
          
          // Restore selectedRole from localStorage if user is a community leader
          if (loadedUser.role === 'community_leader') {
            try {
              const storedRole = localStorage.getItem('selectedRole');
              if (storedRole) {
                const parsedRole = JSON.parse(storedRole);
                setSelectedRoleState(parsedRole);
              }
            } catch (error) {
              console.error('[Auth] Error restoring selectedRole:', error);
            }
          }
          
          loadingUserDataRef.current = false;
          return;
        }
      }

      // If still not found, create a minimal user document to unblock login
      const minimalId = firebaseUser.uid;
      const minimalUser: AuthUser = {
        id: minimalId,
        email: firebaseUser.email || '',
        firstName: (firebaseUser.displayName || '').split(' ')[0] || 'User',
        lastName: (firebaseUser.displayName || '').split(' ').slice(1).join(' ') || '',
        address: '',
        nic: '',
        phoneNumber: firebaseUser.phoneNumber || '',
        role: USER_ROLES.NORMAL_USER,
        communityId: '',
        firebaseUid: firebaseUser.uid,
        profileImage: '',
        emailVerified: firebaseUser.emailVerified || false,
        createdAt: new Date(),
      };

      await setDoc(doc(db, 'users', minimalId), minimalUser);
      setCurrentUser(minimalUser);
    } catch (error: any) {
      console.error('[Auth] ❌ Error loading user data:', error);
      // If there's a critical error, clear the session
      if (error.code === 'permission-denied' || error.code === 'unavailable') {
        await signOut(auth);
        setCurrentUser(null);
      }
    } finally {
      loadingUserDataRef.current = false;
    }
  }

  useEffect(() => {
    let isMounted = true;
    let timeoutId: NodeJS.Timeout | null = null;
    let tokenRefreshInterval: NodeJS.Timeout | null = null;

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      // Clear any existing token refresh interval
      if (tokenRefreshInterval) {
        clearInterval(tokenRefreshInterval);
        tokenRefreshInterval = null;
      }
      
      // Debounce rapid auth state changes to prevent race conditions
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      
      timeoutId = setTimeout(async () => {
        if (!isMounted) return;
        
        try {
          if (firebaseUser) {
            await loadUserData(firebaseUser);
            
            // Set up periodic token refresh (every 50 minutes, tokens expire after 1 hour)
            tokenRefreshInterval = setInterval(async () => {
              if (!isMounted || !auth.currentUser) {
                if (tokenRefreshInterval) {
                  clearInterval(tokenRefreshInterval);
                }
                return;
              }
              
              try {
                await getIdToken(auth.currentUser, true); // Force refresh
              } catch (error: any) {
                console.error('[Auth] ❌ Token refresh failed:', error);
                if (error.code === 'auth/user-token-expired' || error.code === 'auth/invalid-user-token') {
                  await signOut(auth);
                }
              }
            }, 50 * 60 * 1000); // 50 minutes
          } else {
            setCurrentUser(null);
            setSelectedRole(null); // Clear selectedRole on logout
          }
        } catch (error: any) {
          console.error('[Auth] ❌ Error in auth state change handler:', error);
          // If there's a critical error, clear the session
          if (error.code === 'auth/user-token-expired' || error.code === 'auth/invalid-user-token') {
            setCurrentUser(null);
            setSelectedRole(null);
          }
        } finally {
          if (isMounted) {
            setLoading(false);
          }
        }
      }, 100); // 100ms debounce
    });

    return () => {
      isMounted = false;
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      if (tokenRefreshInterval) {
        clearInterval(tokenRefreshInterval);
      }
      unsubscribe();
    };
  }, []);

  const value = useMemo(() => ({
    currentUser,
    login,
    register,
    logout,
    resetPassword,
    sendVerificationEmail,
    resendVerificationEmail,
    resendVerificationEmailByCredentials,
    loading,
    selectedRole,
    setSelectedRole,
  }), [
    currentUser,
    login,
    register,
    logout,
    resetPassword,
    sendVerificationEmail,
    resendVerificationEmail,
    resendVerificationEmailByCredentials,
    loading,
    selectedRole,
    setSelectedRole,
  ]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
