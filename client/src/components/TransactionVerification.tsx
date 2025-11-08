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
      <div className="ml-64 p-6">
        <LoadingSkeleton type="dashboard" />
      </div>
    );
  }

  return (
    <div className="ml-64 p-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="mb-8"
      >
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gradient mb-2">
              Transaction Verification
            </h1>
            <p className="text-muted-foreground">
              Review and verify pending transactions for your community
            </p>
          </div>
          <Badge variant="secondary" className="text-lg px-4 py-2">
            {transactions.length} Pending
          </Badge>
        </div>
      </motion.div>

      {transactions.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="text-center py-12"
        >
          <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="w-10 h-10 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-semibold text-card-foreground mb-2">No Pending Transactions</h3>
          <p className="text-muted-foreground">All transactions have been reviewed.</p>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {transactions.map((transaction, index) => (
            <motion.div
              key={transaction.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
            >
              <Card className="bg-card border-border hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg mb-2">
                        Transaction #{transaction.id.slice(0, 8)}
                      </CardTitle>
                      <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                        <div className="flex items-center space-x-1">
                          <Clock className="w-4 h-4" />
                          <span>{formatDate(transaction.createdAt)}</span>
                        </div>
                        <Badge variant="outline">Pending</Badge>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {transaction.details && (
                      <>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label className="text-sm font-medium text-muted-foreground">Sender</Label>
                            <p className="text-base font-semibold">{transaction.details.senderName}</p>
                          </div>
                          <div>
                            <Label className="text-sm font-medium text-muted-foreground">Payment Method</Label>
                            <p className="text-base font-semibold">
                              {getPaymentMethodName(transaction.details.paymentMethod)}
                            </p>
                          </div>
                          <div>
                            <Label className="text-sm font-medium text-muted-foreground">Amount</Label>
                            <p className="text-xl font-bold text-green-600">
                              {formatCurrency(transaction.totalAmount)}
                            </p>
                          </div>
                          <div>
                            <Label className="text-sm font-medium text-muted-foreground">Required Amount</Label>
                            <p className="text-base font-semibold">
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

                    <div className="flex space-x-3 pt-4 border-t">
                      <Button
                        onClick={() => handleVerify(transaction)}
                        disabled={isVerifying}
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                      >
                        <Check className="w-4 h-4 mr-2" />
                        Verify
                      </Button>
                      <Button
                        onClick={() => openRejectDialog(transaction)}
                        disabled={isVerifying}
                        variant="destructive"
                        className="flex-1"
                      >
                        <X className="w-4 h-4 mr-2" />
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
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Reject Transaction</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this transaction. This will help the donor understand why their payment was not accepted.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="rejection-reason">Rejection Reason</Label>
              <Textarea
                id="rejection-reason"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="e.g., Receipt image is unclear, Amount mismatch, Invalid payment method..."
                rows={4}
                className="mt-1"
              />
            </div>
            <div className="flex justify-end space-x-3">
              <Button
                variant="outline"
                onClick={() => {
                  setIsDialogOpen(false);
                  setRejectionReason('');
                  setSelectedTransaction(null);
                }}
                disabled={isVerifying}
              >
                Cancel
              </Button>
              <Button
                onClick={handleReject}
                disabled={!rejectionReason.trim() || isVerifying}
                variant="destructive"
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

