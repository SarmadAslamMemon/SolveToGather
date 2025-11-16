import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { getPendingTransactions, verifyTransaction } from '@/services/firebase';
import { Check, X, Clock, Eye, AlertCircle } from 'lucide-react';
import LoadingSkeleton from './LoadingSkeleton';

export default function TransactionVerification() {
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTransaction, setSelectedTransaction] = useState<any | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [verificationAction, setVerificationAction] = useState<'verify' | 'reject' | null>(null);

  useEffect(() => {
    const fetchTransactions = async () => {
      if (!currentUser?.communityId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        // Pass leaderId to only show transactions for campaigns created by this leader
        const pending = await getPendingTransactions(currentUser.communityId, currentUser.id);
        setTransactions(pending);
      } catch (error) {
        console.error('Error fetching pending transactions:', error);
        toast({
          title: "Error",
          description: "Failed to load pending transactions.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, [currentUser?.communityId, currentUser?.id, toast]);

  const handleVerify = async (transaction: any) => {
    if (!currentUser) return;

    setIsVerifying(true);
    try {
      await verifyTransaction(transaction.id, currentUser.id, true);
      toast({
        title: "Transaction Verified",
        description: "The transaction has been verified and the campaign amount has been updated.",
      });
      // Remove from list
      setTransactions(prev => prev.filter(t => t.id !== transaction.id));
      setIsDialogOpen(false);
      setSelectedTransaction(null);
    } catch (error) {
      console.error('Error verifying transaction:', error);
      toast({
        title: "Error",
        description: "Failed to verify transaction. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleReject = async () => {
    if (!currentUser || !selectedTransaction) return;

    if (!rejectionReason.trim()) {
      toast({
        title: "Rejection reason required",
        description: "Please provide a reason for rejecting this transaction.",
        variant: "destructive",
      });
      return;
    }

    setIsVerifying(true);
    try {
      await verifyTransaction(selectedTransaction.id, currentUser.id, false, rejectionReason);
      toast({
        title: "Transaction Rejected",
        description: "The transaction has been rejected.",
      });
      // Remove from list
      setTransactions(prev => prev.filter(t => t.id !== selectedTransaction.id));
      setIsDialogOpen(false);
      setSelectedTransaction(null);
      setRejectionReason('');
    } catch (error) {
      console.error('Error rejecting transaction:', error);
      toast({
        title: "Error",
        description: "Failed to reject transaction. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const openRejectDialog = (transaction: any) => {
    setSelectedTransaction(transaction);
    setVerificationAction('reject');
    setIsDialogOpen(true);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'N/A';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleString('en-PK', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getPaymentMethodName = (method: string) => {
    switch (method) {
      case 'jazzcash':
        return 'JazzCash';
      case 'easypaisa':
        return 'EasyPaisa';
      case 'bank':
        return 'Bank Transfer';
      case 'raast':
        return 'RAAST';
      default:
        return method;
    }
  };

  if (loading) {
    return (
      <div className="p-4 sm:p-6">
        <LoadingSkeleton type="dashboard" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="mb-6 sm:mb-8"
      >
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gradient mb-2">
              Transaction Verification
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              Review and verify pending transactions for your community
            </p>
          </div>
          <Badge variant="secondary" className="text-sm sm:text-lg px-3 sm:px-4 py-1.5 sm:py-2">
            {transactions.length} Pending
          </Badge>
        </div>
      </motion.div>

      {transactions.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="text-center py-8 sm:py-12"
        >
          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
            <Check className="w-8 h-8 sm:w-10 sm:h-10 text-muted-foreground" />
          </div>
          <h3 className="text-lg sm:text-xl font-semibold text-card-foreground mb-2">No Pending Transactions</h3>
          <p className="text-sm sm:text-base text-muted-foreground">All transactions have been reviewed.</p>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:gap-6">
          {transactions.map((transaction, index) => (
            <motion.div
              key={transaction.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
            >
              <Card className="bg-card border-border hover:shadow-lg transition-shadow">
                <CardHeader className="p-4 sm:p-6">
                  <div className="flex justify-between items-start">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-base sm:text-lg mb-2 truncate">
                        Transaction #{transaction.id.slice(0, 8)}
                      </CardTitle>
                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 text-xs sm:text-sm text-muted-foreground">
                        <div className="flex items-center space-x-1">
                          <Clock className="w-3 h-3 sm:w-4 sm:h-4" />
                          <span>{formatDate(transaction.createdAt)}</span>
                        </div>
                        <Badge variant="outline" className="text-xs">Pending</Badge>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-4 sm:p-6 pt-0">
                  <div className="space-y-3 sm:space-y-4">
                    {transaction.details && (
                      <>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                          <div>
                            <Label className="text-xs sm:text-sm font-medium text-muted-foreground">Sender</Label>
                            <p className="text-sm sm:text-base font-semibold truncate">{transaction.details.senderName}</p>
                          </div>
                          <div>
                            <Label className="text-xs sm:text-sm font-medium text-muted-foreground">Payment Method</Label>
                            <p className="text-sm sm:text-base font-semibold">
                              {getPaymentMethodName(transaction.details.paymentMethod)}
                            </p>
                          </div>
                          <div>
                            <Label className="text-xs sm:text-sm font-medium text-muted-foreground">Amount</Label>
                            <p className="text-lg sm:text-xl font-bold text-green-600">
                              {formatCurrency(transaction.totalAmount)}
                            </p>
                          </div>
                          <div>
                            <Label className="text-xs sm:text-sm font-medium text-muted-foreground">Required Amount</Label>
                            <p className="text-sm sm:text-base font-semibold">
                              {formatCurrency(transaction.requiredAmount)}
                            </p>
                          </div>
                        </div>

                        {transaction.details.receiptImage && (
                          <div>
                            <Label className="text-sm font-medium text-muted-foreground mb-2 block">
                              Receipt Image
                            </Label>
                            <div className="relative">
                              <img
                                src={transaction.details.receiptImage}
                                alt="Receipt"
                                className="w-full max-w-md h-auto rounded-lg border border-border cursor-pointer hover:opacity-90 transition-opacity"
                                onClick={() => window.open(transaction.details.receiptImage, '_blank')}
                              />
                              <Button
                                variant="ghost"
                                size="sm"
                                className="absolute top-2 right-2 bg-white/90 hover:bg-white"
                                onClick={() => window.open(transaction.details.receiptImage, '_blank')}
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        )}
                      </>
                    )}

                    <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-3 sm:pt-4 border-t">
                      <Button
                        onClick={() => handleVerify(transaction)}
                        disabled={isVerifying}
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white text-sm sm:text-base"
                      >
                        <Check className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                        Verify
                      </Button>
                      <Button
                        onClick={() => openRejectDialog(transaction)}
                        disabled={isVerifying}
                        variant="destructive"
                        className="flex-1 text-sm sm:text-base"
                      >
                        <X className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                        Reject
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* Reject Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="w-[95vw] sm:max-w-[500px] p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">Reject Transaction</DialogTitle>
            <DialogDescription className="text-sm sm:text-base">
              Please provide a reason for rejecting this transaction. This will help the donor understand why their payment was not accepted.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="rejection-reason" className="text-sm sm:text-base">Rejection Reason</Label>
              <Textarea
                id="rejection-reason"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="e.g., Receipt image is unclear, Amount mismatch, Invalid payment method..."
                rows={4}
                className="mt-1 text-sm sm:text-base"
              />
            </div>
            <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setIsDialogOpen(false);
                  setRejectionReason('');
                  setSelectedTransaction(null);
                }}
                disabled={isVerifying}
                className="w-full sm:w-auto text-sm sm:text-base"
              >
                Cancel
              </Button>
              <Button
                onClick={handleReject}
                disabled={!rejectionReason.trim() || isVerifying}
                variant="destructive"
                className="w-full sm:w-auto text-sm sm:text-base"
              >
                {isVerifying ? 'Rejecting...' : 'Reject Transaction'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

