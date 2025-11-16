import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Shield, User, AlertTriangle } from 'lucide-react';

interface UserRoleConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    role: string;
    communityId: string;
  } | null;
  community: {
    id: string;
    name: string;
  } | null;
}

export default function UserRoleConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  user,
  community
}: UserRoleConfirmationModalProps) {
  const [isLoading, setIsLoading] = useState(false);

  if (!user || !community) return null;

  const isCurrentlyLeader = user.role === 'community_leader';
  const isPromoting = !isCurrentlyLeader;
  const isDemoting = isCurrentlyLeader;

  const handleConfirm = async () => {
    setIsLoading(true);
    try {
      await onConfirm();
      onClose();
    } catch (error) {
      console.error('Error updating user role:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] sm:max-w-md p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2 text-lg sm:text-xl">
            <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-amber-500" />
            <span>Confirm Role Change</span>
          </DialogTitle>
          <DialogDescription className="pt-2 text-sm sm:text-base">
            You are about to change the role for this user in the community.
          </DialogDescription>
        </DialogHeader>

        <div className="py-3 sm:py-4">
          {/* User Info */}
          <div className="bg-muted rounded-lg p-3 sm:p-4 mb-3 sm:mb-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0 mb-2">
              <h3 className="text-sm sm:text-base font-medium text-card-foreground truncate flex-1">
                {user.firstName} {user.lastName}
              </h3>
              <Badge variant={isCurrentlyLeader ? 'default' : 'secondary'} className="text-xs">
                {isCurrentlyLeader ? 'Community Leader' : 'Community Member'}
              </Badge>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Community: <span className="font-medium">{community.name}</span>
            </p>
          </div>

          {/* Action Description */}
          <div className="space-y-2 sm:space-y-3">
            {isPromoting && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-start space-x-2 sm:space-x-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800"
              >
                <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <h4 className="text-sm sm:text-base font-medium text-blue-900 dark:text-blue-100">
                    Promote to Community Leader
                  </h4>
                  <p className="text-xs sm:text-sm text-blue-700 dark:text-blue-300 mt-1">
                    This user will gain access to create issues, launch campaigns, and manage community settings.
                  </p>
                </div>
              </motion.div>
            )}

            {isDemoting && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-start space-x-2 sm:space-x-3 p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800"
              >
                <User className="w-4 h-4 sm:w-5 sm:h-5 text-orange-600 dark:text-orange-400 mt-0.5 flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <h4 className="text-sm sm:text-base font-medium text-orange-900 dark:text-orange-100">
                    Demote to Community Member
                  </h4>
                  <p className="text-xs sm:text-sm text-orange-700 dark:text-orange-300 mt-1">
                    This user will lose administrative privileges and become a regular community member.
                  </p>
                </div>
              </motion.div>
            )}
          </div>

          {/* Warning */}
          <div className="mt-3 sm:mt-4 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
            <p className="text-xs sm:text-sm text-amber-800 dark:text-amber-200">
              <strong>Note:</strong> This action will immediately change the user's role and access permissions.
            </p>
          </div>
        </div>

        <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:space-x-2">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
            className="w-full sm:w-auto"
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={isLoading}
            variant={isPromoting ? 'default' : 'destructive'}
            className="w-full sm:w-auto"
          >
            {isLoading ? (
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Updating...</span>
              </div>
            ) : (
              <>
                {isPromoting ? (
                  <>
                    <Shield className="w-4 h-4 mr-2" />
                    Promote to Leader
                  </>
                ) : (
                  <>
                    <User className="w-4 h-4 mr-2" />
                    Demote to Member
                  </>
                )}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
