import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/AuthContext';
import { PAYMENT_METHODS, calculateDonationSummary, processPayment } from '@/services/payment';
import { useToast } from '@/hooks/use-toast';
import { 
  X, Check, ChevronLeft, ChevronRight, Smartphone, Wallet, Landmark, RefreshCcw, 
  Heart, Share2, Users, TrendingUp, Clock, Shield, Gift, Star, Zap
} from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface DonationModalProps {
  isOpen: boolean;
  onClose: () => void;
  campaign: {
    id: string;
    title: string;
    description: string;
    image?: string;
    images?: string[];
    goal?: number;
    raised?: number;
    paymentMethods?: string[];
  } | null;
}

export default function DonationModal({ isOpen, onClose, campaign }: DonationModalProps) {
  const [amount, setAmount] = useState<string>('');
  const [selectedMethod, setSelectedMethod] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [step, setStep] = useState<'amount' | 'payment' | 'processing' | 'success'>('amount');
  const [imageIndex, setImageIndex] = useState(0);
  const [showShareOptions, setShowShareOptions] = useState(false);
  const [donationImpact, setDonationImpact] = useState<string>('');

  const { currentUser } = useAuth();
  const { toast } = useToast();

  const presetAmounts = [1000, 2500, 5000, 10000, 25000, 50000];

  // Calculate donation impact based on amount
  useEffect(() => {
    if (amount && parseFloat(amount) > 0) {
      const amountNum = parseFloat(amount);
      if (amountNum >= 50000) {
        setDonationImpact('This donation can provide emergency relief for multiple families!');
      } else if (amountNum >= 25000) {
        setDonationImpact('This donation can support a family for a month!');
      } else if (amountNum >= 10000) {
        setDonationImpact('This donation can provide essential supplies for a week!');
      } else if (amountNum >= 5000) {
        setDonationImpact('This donation can help with immediate needs!');
      } else {
        setDonationImpact('Every contribution makes a difference!');
      }
    }
  }, [amount]);

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

      // Process payment using the new payment service
      const result = await processPayment({
        campaignId: campaign.id,
        communityId: campaign.communityId || 'test-community',
        userId: currentUser.id,
        amount: summary.amount,
        paymentMethod: selectedMethod as 'jazzcash' | 'easypaisa' | 'bank' | 'raast',
        phoneNumber: phoneNumber || undefined,
        description: `Donation for ${campaign.title}`,
      });

      if (result.success) {
      setStep('success');
      
      toast({
        title: "Donation successful!",
        description: `Thank you for your donation of ${formatCurrency(summary.total)}`,
      });

      // Reset form after delay
      setTimeout(() => {
        handleClose();
      }, 3000);
      } else {
        throw new Error(result.error || 'Payment processing failed');
      }

    } catch (error) {
      console.error('Payment processing error:', error);
      toast({
        title: "Payment failed",
        description: error instanceof Error ? error.message : "There was an error processing your payment. Please try again.",
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

  const renderMethodIcon = (id: string) => {
    switch (id) {
      case 'jazzcash':
        return <Smartphone className="w-4 h-4" />;
      case 'easypaisa':
        return <Wallet className="w-4 h-4" />;
      case 'bank':
        return <Landmark className="w-4 h-4" />;
      case 'raast':
        return <RefreshCcw className="w-4 h-4" />;
      default:
        return <Wallet className="w-4 h-4" />;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl bg-gradient-to-br from-white to-blue-50 dark:from-slate-900 dark:to-slate-800 border-slate-200 dark:border-slate-700 h-[90vh] max-h-[90vh] overflow-hidden p-0 flex flex-col">
        <DialogHeader className="p-6 pb-4 border-b border-slate-200 dark:border-slate-700 bg-gradient-to-r from-blue-600 to-orange-500 text-white">
          <DialogTitle className="flex items-center justify-between text-white">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <Heart className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Make a Donation</h2>
                <p className="text-sm text-white/80">Support this important cause</p>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={handleClose} className="text-white hover:bg-white/20" data-testid="button-close-modal">
              <X className="w-5 h-5" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto min-h-0">
        <AnimatePresence mode="wait">
          {step === 'amount' && (
            <motion.div
              key="amount"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
                className="p-6 space-y-6"
              >
                {/* Campaign Media & Info */}
                {campaign && (
                  <div className="space-y-6">
                    {/* Campaign Images */}
                    {(campaign.images?.length || campaign.image) && (
                      <div className="relative w-full h-48 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 rounded-xl overflow-hidden shadow-lg">
                        <img
                          src={(campaign.images && campaign.images[imageIndex]) || campaign.image!}
                          alt={campaign.title}
                          className="w-full h-full object-cover"
                        />
                        {campaign.images && campaign.images.length > 1 && (
                          <>
                            <button
                              className="absolute left-3 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-all"
                              onClick={() => setImageIndex((prev) => (prev - 1 + campaign.images!.length) % campaign.images!.length)}
                              aria-label="Previous image"
                            >
                              <ChevronLeft className="w-5 h-5" />
                            </button>
                            <button
                              className="absolute right-3 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-all"
                              onClick={() => setImageIndex((prev) => (prev + 1) % campaign.images!.length)}
                              aria-label="Next image"
                            >
                              <ChevronRight className="w-5 h-5" />
                            </button>
                            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2">
                              {campaign.images.map((_, idx) => (
                                <span key={idx} className={`w-2 h-2 rounded-full transition-all ${idx === imageIndex ? 'bg-white' : 'bg-white/50'}`} />
                              ))}
                            </div>
                          </>
                        )}
                        <div className="absolute top-3 right-3">
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => setShowShareOptions(!showShareOptions)}
                            className="bg-white/90 hover:bg-white text-slate-800"
                          >
                            <Share2 className="w-4 h-4 mr-2" />
                            Share
                          </Button>
                        </div>
                      </div>
                    )}

              {/* Campaign Info */}
                    <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-slate-200 dark:border-slate-700 shadow-lg">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200 mb-2" data-testid="text-campaign-title">
                    {campaign.title}
                  </h3>
                            <p className="text-slate-600 dark:text-slate-300 leading-relaxed" data-testid="text-campaign-description">
                    {campaign.description}
                  </p>
                          </div>
                          <div className="flex items-center space-x-2 ml-4">
                            <div className="flex items-center space-x-1 text-orange-500">
                              <Star className="w-4 h-4 fill-current" />
                              <span className="text-sm font-medium">Verified</span>
                            </div>
                          </div>
                        </div>

                        {/* Progress Section */}
                        {(campaign.goal || campaign.raised) && (
                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-2">
                                <TrendingUp className="w-5 h-5 text-blue-500" />
                                <span className="font-semibold text-slate-800 dark:text-slate-200">Progress</span>
                              </div>
                              <div className="text-right">
                                <div className="text-2xl font-bold text-slate-800 dark:text-slate-200">
                                  {formatCurrency(Number(campaign.raised || 0))}
                                </div>
                                <div className="text-sm text-slate-500 dark:text-slate-400">
                                  of {formatCurrency(Number(campaign.goal || 0))}
                                </div>
                              </div>
                            </div>
                            
                            <div className="relative">
                              <Progress 
                                value={Math.min(100, ((Number(campaign.raised || 0) / Math.max(1, Number(campaign.goal || 1))) * 100))} 
                                className="h-3 bg-slate-200 dark:bg-slate-700" 
                              />
                              <div 
                                className="absolute inset-0 bg-gradient-to-r from-blue-500 to-orange-500 rounded-full transition-all duration-1000 ease-out"
                                style={{ width: `${Math.min(100, ((Number(campaign.raised || 0) / Math.max(1, Number(campaign.goal || 1))) * 100))}%` }}
                              />
                            </div>
                            
                            <div className="flex items-center justify-between text-sm">
                              <div className="flex items-center space-x-4">
                                <div className="flex items-center space-x-1 text-slate-600 dark:text-slate-400">
                                  <Users className="w-4 h-4" />
                                  <span>1,247 supporters</span>
                                </div>
                                <div className="flex items-center space-x-1 text-slate-600 dark:text-slate-400">
                                  <Clock className="w-4 h-4" />
                                  <span>15 days left</span>
                                </div>
                              </div>
                              <div className="text-slate-600 dark:text-slate-400">
                                Remaining: {formatCurrency(Math.max(0, Number(campaign.goal || 0) - Number(campaign.raised || 0)))}
                              </div>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    {/* Payment Methods */}
                    <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-slate-200 dark:border-slate-700 shadow-lg">
                      <CardContent className="p-6">
                        <div className="flex items-center space-x-2 mb-4">
                          <Shield className="w-5 h-5 text-green-500" />
                          <Label className="text-lg font-semibold text-slate-800 dark:text-slate-200">Secure Payment Methods</Label>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          {PAYMENT_METHODS
                            .filter((method) => {
                              if (!campaign?.paymentMethods || campaign.paymentMethods.length === 0) return true;
                              return campaign.paymentMethods.includes(method.id);
                            })
                            .map((method) => (
                              <div key={method.id} className={`flex items-center gap-3 px-4 py-3 rounded-lg border-2 transition-all hover:scale-105 ${method.color} text-white shadow-lg`}>
                                {renderMethodIcon(method.id)}
                                <div>
                                  <span className="text-sm font-semibold">{method.name}</span>
                                  <div className="text-xs opacity-90">
                                    {method.type === 'jazzcash' && 'Mobile Wallet'}
                                    {method.type === 'easypaisa' && 'Digital Wallet'}
                                    {method.type === 'bank' && 'Bank Transfer'}
                                    {method.type === 'raast' && 'Instant Transfer'}
                                  </div>
                                </div>
                              </div>
                            ))}
                        </div>
                      </CardContent>
                    </Card>
                </div>
              )}

              {/* Donation Amount */}
                <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-slate-200 dark:border-slate-700 shadow-lg">
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-2 mb-4">
                      <Gift className="w-5 h-5 text-orange-500" />
                      <Label className="text-lg font-semibold text-slate-800 dark:text-slate-200">Choose Your Donation Amount</Label>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-3 mb-6">
                  {presetAmounts.map((presetAmount) => (
                    <Button
                      key={presetAmount}
                      variant={amount === presetAmount.toString() ? "default" : "outline"}
                      onClick={() => handleAmountSelect(presetAmount)}
                          className={`text-sm font-medium transition-all ${
                            amount === presetAmount.toString() 
                              ? 'bg-gradient-to-r from-blue-500 to-orange-500 text-white shadow-lg' 
                              : 'hover:bg-slate-100 dark:hover:bg-slate-700'
                          }`}
                      data-testid={`button-amount-${presetAmount}`}
                    >
                      {formatCurrency(presetAmount)}
                    </Button>
                  ))}
                </div>
                    
                <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-semibold">₨</span>
                  <Input
                    type="number"
                        placeholder="Enter custom amount (minimum ₨100)"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                        className="pl-10 bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 text-slate-800 dark:text-slate-200 h-12 text-lg font-medium"
                    min="100"
                    data-testid="input-custom-amount"
                  />
                </div>
                    
                    {/* Donation Impact */}
                    {donationImpact && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-4 p-4 bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 rounded-lg border border-green-200 dark:border-green-800"
                      >
                        <div className="flex items-center space-x-2">
                          <Zap className="w-5 h-5 text-green-500" />
                          <span className="text-green-700 dark:text-green-300 font-medium">{donationImpact}</span>
              </div>
                      </motion.div>
                    )}
                  </CardContent>
                </Card>

              {/* Summary */}
              {summary && (
                  <Card className="bg-gradient-to-r from-blue-50 to-orange-50 dark:from-blue-900/20 dark:to-orange-900/20 border-blue-200 dark:border-blue-800 shadow-lg">
                    <CardContent className="p-6">
                      <div className="flex items-center space-x-2 mb-4">
                        <Gift className="w-5 h-5 text-blue-500" />
                        <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200">Donation Summary</h3>
                      </div>
                      
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-slate-600 dark:text-slate-400">Donation Amount:</span>
                          <span className="font-semibold text-slate-800 dark:text-slate-200" data-testid="text-summary-amount">
                      {formatCurrency(summary.amount)}
                    </span>
                  </div>
                        <div className="flex justify-between items-center">
                          <span className="text-slate-600 dark:text-slate-400">Processing Fee:</span>
                          <span className="font-semibold text-slate-800 dark:text-slate-200" data-testid="text-summary-fee">
                      {formatCurrency(summary.fee)}
                    </span>
                  </div>
                        <div className="border-t border-slate-300 dark:border-slate-600 pt-3">
                          <div className="flex justify-between items-center">
                            <span className="text-lg font-bold text-slate-800 dark:text-slate-200">Total:</span>
                            <span className="text-xl font-bold text-blue-600 dark:text-blue-400" data-testid="text-summary-total">
                        {formatCurrency(summary.total)}
                      </span>
                    </div>
                  </div>
                </div>
                    </CardContent>
                  </Card>
              )}

              <Button
                onClick={handleContinue}
                  className="w-full h-14 bg-gradient-to-r from-blue-500 to-orange-500 hover:from-blue-600 hover:to-orange-600 text-white font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-300"
                data-testid="button-continue"
              >
                  <Heart className="w-5 h-5 mr-2" />
                  Continue to Payment
              </Button>
            </motion.div>
          )}

          {step === 'payment' && (
            <motion.div
              key="payment"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="p-6 space-y-6"
            >
              <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-slate-200 dark:border-slate-700 shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-2 mb-6">
                    <Shield className="w-5 h-5 text-green-500" />
                    <Label className="text-lg font-semibold text-slate-800 dark:text-slate-200">Select Payment Method</Label>
                  </div>
                  
                  <div className="space-y-4">
                  {PAYMENT_METHODS
                    .filter((method) => {
                      if (!campaign?.paymentMethods || campaign.paymentMethods.length === 0) return true;
                      return campaign.paymentMethods.includes(method.id);
                    })
                    .map((method) => (
                      <button
                        key={method.id}
                        onClick={() => setSelectedMethod(method.id)}
                          className={`w-full flex items-center justify-between p-4 border-2 rounded-xl transition-all hover:scale-105 ${
                          selectedMethod === method.id
                              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-lg'
                              : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                        }`}
                        data-testid={`button-payment-${method.id}`}
                      >
                          <div className="flex items-center space-x-4">
                            <div className={`w-12 h-12 ${method.color} rounded-xl flex items-center justify-center shadow-lg`}>
                              {renderMethodIcon(method.id)}
                          </div>
                          <div className="text-left">
                              <p className="font-semibold text-slate-800 dark:text-slate-200">{method.name}</p>
                              <p className="text-sm text-slate-600 dark:text-slate-400">
                              {method.type === 'jazzcash' && 'Mobile wallet payment'}
                              {method.type === 'easypaisa' && 'Digital wallet payment'}
                              {method.type === 'bank' && 'Direct bank payment'}
                              {method.type === 'raast' && 'Instant bank transfer (RAAST)'}
                            </p>
                          </div>
                        </div>
                        {selectedMethod === method.id && (
                            <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                              <Check className="w-4 h-4 text-white" />
                            </div>
                        )}
                      </button>
                    ))}
                </div>
                </CardContent>
              </Card>

              {(selectedMethod === 'jazzcash' || selectedMethod === 'easypaisa') && (
                <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-slate-200 dark:border-slate-700 shadow-lg">
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-2 mb-4">
                      <Smartphone className="w-5 h-5 text-blue-500" />
                      <Label className="text-lg font-semibold text-slate-800 dark:text-slate-200">Mobile Wallet Details</Label>
                    </div>
                  <Input
                    type="tel"
                    placeholder="03XXXXXXXXX"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                      className="bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 text-slate-800 dark:text-slate-200 h-12 text-lg"
                    data-testid="input-phone-number"
                  />
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
                      Enter your mobile number for {selectedMethod === 'jazzcash' ? 'JazzCash' : 'EasyPaisa'} wallet
                    </p>
                  </CardContent>
                </Card>
              )}

              <div className="flex space-x-4">
                <Button
                  variant="outline"
                  onClick={() => setStep('amount')}
                  className="flex-1 h-12 border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700"
                  data-testid="button-back"
                >
                  Back
                </Button>
                <Button
                  onClick={handlePaymentSubmit}
                  className="flex-1 h-12 bg-gradient-to-r from-blue-500 to-orange-500 hover:from-blue-600 hover:to-orange-600 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
                  data-testid="button-pay-now"
                >
                  <Heart className="w-5 h-5 mr-2" />
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
              className="p-8 text-center"
            >
              <div className="w-20 h-20 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-6" />
              <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-200 mb-3">Processing Payment</h3>
              <p className="text-slate-600 dark:text-slate-400 mb-4">Please wait while we securely process your donation...</p>
              <div className="flex items-center justify-center space-x-2 text-sm text-slate-500 dark:text-slate-400">
                <Shield className="w-4 h-4" />
                <span>Your payment is encrypted and secure</span>
              </div>
            </motion.div>
          )}

          {step === 'success' && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-8 text-center"
            >
              <motion.div 
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                className="w-20 h-20 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg"
              >
                <Check className="w-10 h-10 text-white" />
              </motion.div>
              <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-200 mb-3">Donation Successful!</h3>
              <p className="text-slate-600 dark:text-slate-400 mb-6 leading-relaxed">
                Thank you for your generous donation. Your contribution will make a real difference in helping those in need.
              </p>
              {summary && (
                <Card className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 border-green-200 dark:border-green-800 shadow-lg">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-center space-x-2 mb-3">
                      <Gift className="w-5 h-5 text-green-500" />
                      <span className="font-semibold text-slate-800 dark:text-slate-200">Donation Details</span>
                    </div>
                    <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                      {formatCurrency(summary.total)}
                    </div>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
                      Transaction ID: txn_{Date.now().toString().slice(-8)}
                    </p>
                  </CardContent>
                </Card>
              )}
              <div className="mt-6 flex space-x-3">
                <Button
                  onClick={() => setShowShareOptions(true)}
                  variant="outline"
                  className="flex-1 border-slate-300 dark:border-slate-600"
                >
                  <Share2 className="w-4 h-4 mr-2" />
                  Share
                </Button>
                <Button
                  onClick={handleClose}
                  className="flex-1 bg-gradient-to-r from-blue-500 to-orange-500 hover:from-blue-600 hover:to-orange-600 text-white"
                >
                  Done
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        </div>
      </DialogContent>
    </Dialog>
  );
}
