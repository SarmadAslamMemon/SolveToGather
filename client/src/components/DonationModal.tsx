import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { createDonation, updateDonationStatus } from '@/services/firebase';
import { PAYMENT_METHODS, calculateDonationSummary } from '@/services/payment';
import { useToast } from '@/hooks/use-toast';
import { X, Check } from 'lucide-react';

interface DonationModalProps {
  isOpen: boolean;
  onClose: () => void;
  campaign: {
    id: string;
    title: string;
    description: string;
  } | null;
}

export default function DonationModal({ isOpen, onClose, campaign }: DonationModalProps) {
  const [amount, setAmount] = useState<string>('');
  const [selectedMethod, setSelectedMethod] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [step, setStep] = useState<'amount' | 'payment' | 'processing' | 'success'>('amount');

  const { currentUser } = useAuth();
  const { toast } = useToast();

  const presetAmounts = [1000, 2500, 5000, 10000];

  const handleAmountSelect = (presetAmount: number) => {
    setAmount(presetAmount.toString());
  };

  const handleContinue = () => {
    if (!amount || parseFloat(amount) < 100) {
      toast({
        title: "Invalid amount",
        description: "Please enter an amount of at least ₨100",
        variant: "destructive",
      });
      return;
    }
    setStep('payment');
  };

  const handlePaymentSubmit = async () => {
    if (!selectedMethod) {
      toast({
        title: "Payment method required",
        description: "Please select a payment method",
        variant: "destructive",
      });
      return;
    }

    if (!currentUser || !campaign) return;

    setIsProcessing(true);
    setStep('processing');

    try {
      const donationAmount = parseFloat(amount);
      const summary = calculateDonationSummary(donationAmount);

      // Create donation record
      const donationId = await createDonation({
        campaignId: campaign.id,
        donorId: currentUser.id,
        amount: summary.total,
        paymentMethod: selectedMethod,
      });

      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Update donation status to completed
      await updateDonationStatus(donationId, 'completed', `txn_${Date.now()}`);

      setStep('success');
      
      toast({
        title: "Donation successful!",
        description: `Thank you for your donation of ${formatCurrency(summary.total)}`,
      });

      // Reset form after delay
      setTimeout(() => {
        handleClose();
      }, 3000);

    } catch (error) {
      console.error('Payment processing error:', error);
      toast({
        title: "Payment failed",
        description: "There was an error processing your payment. Please try again.",
        variant: "destructive",
      });
      setStep('payment');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    setAmount('');
    setSelectedMethod('');
    setPhoneNumber('');
    setStep('amount');
    setIsProcessing(false);
    onClose();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const summary = amount ? calculateDonationSummary(parseFloat(amount)) : null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md bg-card border-border">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between text-card-foreground">
            Make a Donation
            <Button variant="ghost" size="sm" onClick={handleClose} data-testid="button-close-modal">
              <X className="w-4 h-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        <AnimatePresence mode="wait">
          {step === 'amount' && (
            <motion.div
              key="amount"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              {/* Campaign Info */}
              {campaign && (
                <div className="p-4 bg-muted rounded-lg">
                  <h3 className="font-medium text-card-foreground mb-1" data-testid="text-campaign-title">
                    {campaign.title}
                  </h3>
                  <p className="text-sm text-muted-foreground" data-testid="text-campaign-description">
                    {campaign.description}
                  </p>
                </div>
              )}

              {/* Donation Amount */}
              <div>
                <Label className="block text-sm font-medium text-card-foreground mb-3">
                  Donation Amount
                </Label>
                <div className="grid grid-cols-2 gap-2 mb-4">
                  {presetAmounts.map((presetAmount) => (
                    <Button
                      key={presetAmount}
                      variant={amount === presetAmount.toString() ? "default" : "outline"}
                      onClick={() => handleAmountSelect(presetAmount)}
                      className="text-sm"
                      data-testid={`button-amount-${presetAmount}`}
                    >
                      {formatCurrency(presetAmount)}
                    </Button>
                  ))}
                </div>
                <div className="relative">
                  <span className="absolute left-3 top-3 text-muted-foreground">₨</span>
                  <Input
                    type="number"
                    placeholder="Enter custom amount"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="pl-8 bg-input border-border text-card-foreground"
                    min="100"
                    data-testid="input-custom-amount"
                  />
                </div>
              </div>

              {/* Summary */}
              {summary && (
                <div className="p-4 bg-muted rounded-lg">
                  <div className="flex justify-between mb-2">
                    <span className="text-muted-foreground">Donation Amount:</span>
                    <span className="font-medium text-card-foreground" data-testid="text-summary-amount">
                      {formatCurrency(summary.amount)}
                    </span>
                  </div>
                  <div className="flex justify-between mb-2">
                    <span className="text-muted-foreground">Processing Fee:</span>
                    <span className="font-medium text-card-foreground" data-testid="text-summary-fee">
                      {formatCurrency(summary.fee)}
                    </span>
                  </div>
                  <div className="border-t border-border pt-2 mt-2">
                    <div className="flex justify-between">
                      <span className="font-medium text-card-foreground">Total:</span>
                      <span className="font-bold text-card-foreground" data-testid="text-summary-total">
                        {formatCurrency(summary.total)}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              <Button
                onClick={handleContinue}
                className="w-full bg-primary text-primary-foreground"
                data-testid="button-continue"
              >
                Continue
              </Button>
            </motion.div>
          )}

          {step === 'payment' && (
            <motion.div
              key="payment"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div>
                <Label className="block text-sm font-medium text-card-foreground mb-3">
                  Payment Method
                </Label>
                <div className="space-y-3">
                  {PAYMENT_METHODS.map((method) => (
                    <button
                      key={method.id}
                      onClick={() => setSelectedMethod(method.id)}
                      className={`w-full flex items-center justify-between p-4 border rounded-lg transition-colors ${
                        selectedMethod === method.id
                          ? 'border-primary bg-accent'
                          : 'border-border hover:bg-accent'
                      }`}
                      data-testid={`button-payment-${method.id}`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`w-10 h-10 ${method.color} rounded-lg flex items-center justify-center`}>
                          <i className={`${method.icon} text-white`} />
                        </div>
                        <div className="text-left">
                          <p className="font-medium text-card-foreground">{method.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {method.type === 'jazzcash' && 'Mobile wallet payment'}
                            {method.type === 'easypaisa' && 'Digital wallet payment'}
                            {method.type === 'bank' && 'Direct bank payment'}
                          </p>
                        </div>
                      </div>
                      {selectedMethod === method.id && (
                        <Check className="w-5 h-5 text-primary" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {(selectedMethod === 'jazzcash' || selectedMethod === 'easypaisa') && (
                <div>
                  <Label className="block text-sm font-medium text-card-foreground mb-2">
                    Phone Number
                  </Label>
                  <Input
                    type="tel"
                    placeholder="03XXXXXXXXX"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="bg-input border-border text-card-foreground"
                    data-testid="input-phone-number"
                  />
                </div>
              )}

              <div className="flex space-x-3">
                <Button
                  variant="outline"
                  onClick={() => setStep('amount')}
                  className="flex-1"
                  data-testid="button-back"
                >
                  Back
                </Button>
                <Button
                  onClick={handlePaymentSubmit}
                  className="flex-1 bg-primary text-primary-foreground"
                  data-testid="button-pay-now"
                >
                  Pay Now
                </Button>
              </div>
            </motion.div>
          )}

          {step === 'processing' && (
            <motion.div
              key="processing"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-8"
            >
              <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <h3 className="text-lg font-medium text-card-foreground mb-2">Processing Payment</h3>
              <p className="text-muted-foreground">Please wait while we process your donation...</p>
            </motion.div>
          )}

          {step === 'success' && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-8"
            >
              <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-lg font-medium text-card-foreground mb-2">Donation Successful!</h3>
              <p className="text-muted-foreground mb-4">
                Thank you for your generous donation. Your contribution will make a real difference.
              </p>
              {summary && (
                <p className="text-sm text-muted-foreground">
                  Amount donated: <span className="font-medium">{formatCurrency(summary.total)}</span>
                </p>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
