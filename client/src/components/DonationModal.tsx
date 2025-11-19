import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/AuthContext';
import { PAYMENT_METHODS, calculateDonationSummary } from '@/services/payment';
import { getPaymentMethods, createTransaction, uploadReceiptImage, getCampaignSupporterCount } from '@/services/firebase';
import { useToast } from '@/hooks/use-toast';
import { 
  X, Check, ChevronLeft, ChevronRight, Smartphone, Wallet, Landmark, RefreshCcw, 
  Heart, Share2, Users, TrendingUp, Clock, Shield, Gift, Star, Zap, Upload
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
    communityId?: string;
    authorId?: string;
    daysLeft?: number;
    duration?: string;
    createdAt?: any;
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
  const [campaignPaymentMethods, setCampaignPaymentMethods] = useState<any[]>([]);
  const [selectedPaymentMethodDetails, setSelectedPaymentMethodDetails] = useState<any>(null);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);
  const [isUploadingReceipt, setIsUploadingReceipt] = useState(false);
  const [uploadStep, setUploadStep] = useState<'payment' | 'upload' | 'submitted'>('payment');
  const [transactionId, setTransactionId] = useState<string | null>(null);
  const [supporterCount, setSupporterCount] = useState<number>(0);
  const [daysLeft, setDaysLeft] = useState<number>(0);

  const { currentUser } = useAuth();
  const { toast } = useToast();

  const presetAmounts = [1000, 2500, 5000, 10000, 25000, 50000];

  // Fetch payment methods and campaign stats when modal opens or campaign changes
  useEffect(() => {
    const fetchCampaignData = async () => {
      if (isOpen && campaign) {
        // Try to get communityId and authorId from campaign
        const communityId = campaign.communityId;
        const authorId = campaign.authorId;
        
        if (communityId && authorId) {
          try {
            // Fetch payment methods
            const methods = await getPaymentMethods(communityId, authorId);
            // Filter to only show payment methods that were selected for this campaign
            if (campaign.paymentMethods && campaign.paymentMethods.length > 0) {
              const filteredMethods = methods.filter((method: any) => 
                campaign.paymentMethods!.includes(method.type)
              );
              setCampaignPaymentMethods(filteredMethods);
            } else {
              setCampaignPaymentMethods(methods);
            }
          } catch (error) {
            console.error('Error fetching campaign payment methods:', error);
            setCampaignPaymentMethods([]);
          }
        } else {
          // If communityId or authorId are missing, show empty state
          setCampaignPaymentMethods([]);
        }

        // Fetch supporter count
        if (campaign.id) {
          try {
            const count = await getCampaignSupporterCount(campaign.id);
            setSupporterCount(count);
          } catch (error) {
            console.error('Error fetching supporter count:', error);
            setSupporterCount(0);
          }
        }

        // Calculate days left
        const campaignDaysLeft = (campaign as any).daysLeft || (campaign as any).days_left;
        const campaignDuration = (campaign as any).duration;
        
        if (campaignDaysLeft !== undefined && campaignDaysLeft !== null) {
          // If daysLeft is stored as a number, use it directly
          setDaysLeft(Math.max(0, Math.floor(campaignDaysLeft)));
        } else if (campaign.createdAt && campaignDuration) {
          // Calculate from createdAt and duration string (e.g., "30 days")
          const createdAt = campaign.createdAt?.toDate ? campaign.createdAt.toDate() : new Date(campaign.createdAt);
          const now = new Date();
          
          // Parse duration string (e.g., "30 days" -> 30)
          const durationMatch = campaignDuration.toString().match(/(\d+)/);
          const totalDays = durationMatch ? parseInt(durationMatch[1], 10) : 0;
          
          if (totalDays > 0) {
            const elapsedDays = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24));
            const remaining = Math.max(0, totalDays - elapsedDays);
            setDaysLeft(remaining);
          } else {
            setDaysLeft(0);
          }
        } else {
          setDaysLeft(0);
        }
      } else {
        setCampaignPaymentMethods([]);
        setSupporterCount(0);
        setDaysLeft(0);
      }
    };
    fetchCampaignData();
  }, [isOpen, campaign?.id, campaign?.communityId, campaign?.authorId, campaign?.paymentMethods, campaign?.daysLeft, campaign?.createdAt]);

  // Update selected payment method details when selection changes
  useEffect(() => {
    if (selectedMethod && campaignPaymentMethods.length > 0) {
      const methodDetails = campaignPaymentMethods.find((m: any) => m.type === selectedMethod);
      setSelectedPaymentMethodDetails(methodDetails || null);
    } else {
      setSelectedPaymentMethodDetails(null);
    }
  }, [selectedMethod, campaignPaymentMethods]);

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

  const handleReceiptFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setReceiptFile(file);
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setReceiptPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleReceiptUpload = async () => {
    if (!selectedMethod) {
      toast({
        title: "Payment method required",
        description: "Please select a payment method",
        variant: "destructive",
      });
      return;
    }

    if (!receiptFile) {
      toast({
        title: "Receipt required",
        description: "Please upload a receipt image",
        variant: "destructive",
      });
      return;
    }

    if (!currentUser || !campaign || !campaign.communityId) return;

    setIsUploadingReceipt(true);
    setStep('processing');

    try {
      const donationAmount = parseFloat(amount);
      const summary = calculateDonationSummary(donationAmount);

      // Generate a temporary transaction ID for receipt upload path
      const tempTransactionId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Upload receipt image first
      const receiptImageUrl = await uploadReceiptImage(receiptFile, tempTransactionId, campaign.communityId);

      // Create transaction with receipt URL
      const result = await createTransaction({
        campaignId: campaign.id,
        communityId: campaign.communityId,
        senderId: currentUser.id,
        senderName: `${currentUser.firstName} ${currentUser.lastName}`.trim(),
        amount: summary.amount,
        totalAmount: summary.total,
        requiredAmount: campaign.goal || 0,
        paymentMethod: selectedMethod,
        receiptImageUrl: receiptImageUrl,
      });

      // Re-upload receipt with actual transaction ID for better organization
      try {
        const finalReceiptUrl = await uploadReceiptImage(receiptFile, result.transactionHistoryId, campaign.communityId);
        // Update transaction details with final receipt URL if different
        if (finalReceiptUrl !== receiptImageUrl) {
          // Note: We could update the transactionDetails here, but for now we'll keep the first upload
        }
      } catch (error) {
        console.warn('Failed to re-upload receipt with transaction ID:', error);
        // Continue anyway as we already have the receipt URL
      }

      setTransactionId(result.transactionHistoryId);
      setStep('success');
      setUploadStep('submitted');
      
      toast({
        title: "Receipt uploaded successfully!",
        description: `Your transaction has been submitted for verification. Transaction ID: ${result.transactionHistoryId.slice(0, 8)}`,
      });

      // Reset form after delay
      setTimeout(() => {
        handleClose();
      }, 5000);
    } catch (error) {
      console.error('Receipt upload error:', error);
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "There was an error uploading your receipt. Please try again.",
        variant: "destructive",
      });
      setStep('payment');
      setUploadStep('upload');
    } finally {
      setIsUploadingReceipt(false);
    }
  };

  const handleContinueToUpload = () => {
    if (!selectedMethod) {
      toast({
        title: "Payment method required",
        description: "Please select a payment method",
        variant: "destructive",
      });
      return;
    }
    setUploadStep('upload');
  };

  const handleClose = () => {
    setAmount('');
    setSelectedMethod('');
    setPhoneNumber('');
    setReceiptFile(null);
    setReceiptPreview(null);
    setTransactionId(null);
    setStep('amount');
    setUploadStep('payment');
    setIsProcessing(false);
    setIsUploadingReceipt(false);
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
  
  // Check if campaign goal is reached
  const isGoalReached = campaign ? Number(campaign.raised || 0) >= Number(campaign.goal || 0) : false;

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
          <DialogTitle className="flex items-center text-white">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <Heart className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Make a Donation</h2>
                <p className="text-sm text-white/80">Support this important cause</p>
              </div>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto min-h-0">
        <AnimatePresence mode="wait">
          {/* Show goal achieved message if goal is reached */}
          {isGoalReached && campaign && step !== 'processing' && step !== 'success' && (
            <motion.div
              key="goal-achieved"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="p-6 space-y-6"
            >
              <div className="text-center py-12">
                <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Check className="w-10 h-10 text-green-600 dark:text-green-400" />
                </div>
                <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-200 mb-2">
                  Goal Achieved! 🎉
                </h3>
                <p className="text-slate-600 dark:text-slate-300 mb-6">
                  This campaign has successfully reached its fundraising goal of {formatCurrency(Number(campaign.goal || 0))}.
                </p>
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 mb-6">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-600 dark:text-slate-300">Total Raised:</span>
                    <span className="text-lg font-bold text-green-600 dark:text-green-400">
                      {formatCurrency(Number(campaign.raised || 0))}
                    </span>
                  </div>
                </div>
                <Button onClick={handleClose} variant="outline" className="mt-4">
                  Close
                </Button>
              </div>
            </motion.div>
          )}
          {!isGoalReached && step === 'amount' && (
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
                                  <span>{supporterCount.toLocaleString()} {supporterCount === 1 ? 'supporter' : 'supporters'}</span>
                                </div>
                                <div className="flex items-center space-x-1 text-slate-600 dark:text-slate-400">
                                  <Clock className="w-4 h-4" />
                                  <span>{daysLeft} {daysLeft === 1 ? 'day' : 'days'} left</span>
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

          {!isGoalReached && step === 'payment' && (
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
                  
                  {campaignPaymentMethods.length > 0 ? (
                    <div className="space-y-4">
                      {campaignPaymentMethods.map((method: any) => {
                        const methodInfo = PAYMENT_METHODS.find(m => m.id === method.type);
                        return (
                          <button
                            key={method.id}
                            onClick={() => setSelectedMethod(method.type)}
                            className={`w-full flex items-center justify-between p-4 border-2 rounded-xl transition-all hover:scale-105 ${
                              selectedMethod === method.type
                                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-lg'
                                : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                            }`}
                            data-testid={`button-payment-${method.type}`}
                          >
                            <div className="flex items-center space-x-4">
                              <div className={`w-12 h-12 ${methodInfo?.color || 'bg-gray-500'} rounded-xl flex items-center justify-center shadow-lg`}>
                                {renderMethodIcon(method.type)}
                              </div>
                              <div className="text-left">
                                <p className="font-semibold text-slate-800 dark:text-slate-200">
                                  {methodInfo?.name || method.type}
                                </p>
                                <p className="text-sm text-slate-600 dark:text-slate-400">
                                  Account: {method.accountNumber}
                                </p>
                                {method.userName && (
                                  <p className="text-xs text-slate-500 dark:text-slate-500">
                                    Holder: {method.userName}
                                  </p>
                                )}
                              </div>
                            </div>
                            {selectedMethod === method.type && (
                              <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                                <Check className="w-4 h-4 text-white" />
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-slate-600 dark:text-slate-400">
                        No payment methods available for this campaign.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {selectedPaymentMethodDetails && (selectedMethod === 'jazzcash' || selectedMethod === 'easypaisa') && (
                <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-slate-200 dark:border-slate-700 shadow-lg">
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-2 mb-4">
                      <Smartphone className="w-5 h-5 text-blue-500" />
                      <Label className="text-lg font-semibold text-slate-800 dark:text-slate-200">Payment Details</Label>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Account Number:</span>
                          <span className="text-lg font-bold text-slate-800 dark:text-slate-200">{selectedPaymentMethodDetails.accountNumber}</span>
                        </div>
                        {selectedPaymentMethodDetails.userName && (
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Account Holder:</span>
                            <span className="text-base font-semibold text-slate-800 dark:text-slate-200">{selectedPaymentMethodDetails.userName}</span>
                          </div>
                        )}
                      </div>

                      {selectedPaymentMethodDetails.qrImageUrl && (
                        <div className="text-center">
                          <Label className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-2 block">Scan QR Code to Pay</Label>
                          <div className="flex justify-center">
                            <img
                              src={selectedPaymentMethodDetails.qrImageUrl}
                              alt="QR Code"
                              className="w-48 h-48 object-contain border-2 border-slate-200 dark:border-slate-700 rounded-lg p-2 bg-white"
                            />
                          </div>
                        </div>
                      )}

                      <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                        <p className="text-sm text-blue-700 dark:text-blue-300">
                          <strong>Instructions:</strong> Send the donation amount ({formatCurrency(parseFloat(amount || '0'))}) to the account number above or scan the QR code.
                        </p>
                      </div>

                      <Input
                        type="tel"
                        placeholder="03XXXXXXXXX (Your phone number - optional)"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        className="bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 text-slate-800 dark:text-slate-200 h-12 text-lg"
                        data-testid="input-phone-number"
                      />
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        Enter your mobile number (optional) for transaction confirmation
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}

              {uploadStep === 'payment' && (
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
                    onClick={handleContinueToUpload}
                    className="flex-1 h-12 bg-gradient-to-r from-blue-500 to-orange-500 hover:from-blue-600 hover:to-orange-600 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
                    data-testid="button-continue-upload"
                  >
                    Continue to Upload Receipt
                  </Button>
                </div>
              )}

              {uploadStep === 'upload' && (
                <div className="space-y-4">
                  <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-slate-200 dark:border-slate-700 shadow-lg">
                    <CardContent className="p-6">
                      <div className="flex items-center space-x-2 mb-4">
                        <Upload className="w-5 h-5 text-blue-500" />
                        <Label className="text-lg font-semibold text-slate-800 dark:text-slate-200">Upload Receipt</Label>
                      </div>
                      
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="receipt-upload" className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-2 block">
                            Upload your payment receipt
                          </Label>
                          <input
                            type="file"
                            id="receipt-upload"
                            accept="image/*"
                            onChange={handleReceiptFileChange}
                            className="hidden"
                          />
                          <label
                            htmlFor="receipt-upload"
                            className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg cursor-pointer hover:border-blue-500 transition-colors bg-slate-50 dark:bg-slate-900"
                          >
                            {receiptPreview ? (
                              <div className="relative w-full h-full">
                                <img
                                  src={receiptPreview}
                                  alt="Receipt preview"
                                  className="w-full h-full object-contain rounded-lg"
                                />
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setReceiptFile(null);
                                    setReceiptPreview(null);
                                  }}
                                  className="absolute top-2 right-2 bg-white/90 hover:bg-white"
                                >
                                  <X className="w-4 h-4" />
                                </Button>
                              </div>
                            ) : (
                              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                <Upload className="w-10 h-10 mb-3 text-slate-400" />
                                <p className="mb-2 text-sm text-slate-500 dark:text-slate-400">
                                  <span className="font-semibold">Click to upload</span> or drag and drop
                                </p>
                                <p className="text-xs text-slate-500 dark:text-slate-400">PNG, JPG, GIF up to 10MB</p>
                              </div>
                            )}
                          </label>
                        </div>

                        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                          <p className="text-sm text-blue-700 dark:text-blue-300">
                            <strong>Instructions:</strong> After making the payment using the QR code or account number above, upload a screenshot or photo of your payment receipt.
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <div className="flex space-x-4">
                    <Button
                      variant="outline"
                      onClick={() => setUploadStep('payment')}
                      className="flex-1 h-12 border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700"
                      data-testid="button-back-upload"
                    >
                      Back
                    </Button>
                    <Button
                      onClick={handleReceiptUpload}
                      disabled={!receiptFile || isUploadingReceipt}
                      className="flex-1 h-12 bg-gradient-to-r from-blue-500 to-orange-500 hover:from-blue-600 hover:to-orange-600 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50"
                      data-testid="button-upload-receipt"
                    >
                      {isUploadingReceipt ? (
                        <>
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Upload className="w-5 h-5 mr-2" />
                          Upload Receipt
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {step === 'processing' && (
            <motion.div
              key="processing"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-6 sm:p-8 text-center"
            >
              <div className="w-16 h-16 sm:w-20 sm:h-20 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4 sm:mb-6" />
              <h3 className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-slate-200 mb-2 sm:mb-3">Processing Payment</h3>
              <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 mb-3 sm:mb-4">Please wait while we securely process your donation...</p>
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
              className="p-6 sm:p-8 text-center"
            >
              <motion.div 
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6 shadow-lg"
              >
                <Check className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
              </motion.div>
              <h3 className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-slate-200 mb-2 sm:mb-3">Receipt Uploaded Successfully!</h3>
              <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 mb-4 sm:mb-6 leading-relaxed">
                Your receipt has been submitted for verification. Your community leader will review it and verify your donation. You will be notified once it's verified.
              </p>
              {summary && (
                <Card className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 border-green-200 dark:border-green-800 shadow-lg">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-center space-x-2 mb-3">
                      <Gift className="w-5 h-5 text-green-500" />
                      <span className="font-semibold text-slate-800 dark:text-slate-200">Transaction Details</span>
                    </div>
                    <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                      {formatCurrency(summary.total)}
                    </div>
                    {transactionId && (
                      <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
                        Transaction ID: {transactionId.slice(0, 8)}...
                      </p>
                    )}
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                      Status: Pending Verification
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
