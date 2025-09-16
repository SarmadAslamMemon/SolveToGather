import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check, X, AlertCircle, Loader2, ArrowLeft, Home } from 'lucide-react';
import { verifyJazzCashResponse, formatJazzCashError } from '@/services/jazzcash';
import { updatePaymentStatus, getPaymentById } from '@/services/firebase';
import { useToast } from '@/hooks/use-toast';

interface JazzCashResponse {
  pp_Version: string;
  pp_TxnType: string;
  pp_MerchantID: string;
  pp_Password: string;
  pp_TxnRefNo: string;
  pp_Amount: string;
  pp_TxnCurrency: string;
  pp_BillReference: string;
  pp_Description: string;
  pp_TxnDateTime: string;
  pp_SecureHash: string;
  pp_ResponseCode: string;
  pp_ResponseMessage: string;
  pp_AuthCode: string;
  pp_RetreivalReferenceNo: string;
  pp_SettlementExpiry: string;
}

export default function PaymentCallback() {
  const location = useLocation();
  const { toast } = useToast();
  
  const [status, setStatus] = useState<'loading' | 'success' | 'failed' | 'error'>('loading');
  const [paymentData, setPaymentData] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(true);

  useEffect(() => {
    handlePaymentCallback();
  }, []);

  const handlePaymentCallback = async () => {
    try {
      // Parse URL parameters
      const urlParams = new URLSearchParams(location.search);
      
      // Extract JazzCash response parameters
      const jazzCashResponse: JazzCashResponse = {
        pp_Version: urlParams.get('pp_Version') || '',
        pp_TxnType: urlParams.get('pp_TxnType') || '',
        pp_MerchantID: urlParams.get('pp_MerchantID') || '',
        pp_Password: urlParams.get('pp_Password') || '',
        pp_TxnRefNo: urlParams.get('pp_TxnRefNo') || '',
        pp_Amount: urlParams.get('pp_Amount') || '',
        pp_TxnCurrency: urlParams.get('pp_TxnCurrency') || '',
        pp_BillReference: urlParams.get('pp_BillReference') || '',
        pp_Description: urlParams.get('pp_Description') || '',
        pp_TxnDateTime: urlParams.get('pp_TxnDateTime') || '',
        pp_SecureHash: urlParams.get('pp_SecureHash') || '',
        pp_ResponseCode: urlParams.get('pp_ResponseCode') || '',
        pp_ResponseMessage: urlParams.get('pp_ResponseMessage') || '',
        pp_AuthCode: urlParams.get('pp_AuthCode') || '',
        pp_RetreivalReferenceNo: urlParams.get('pp_RetreivalReferenceNo') || '',
        pp_SettlementExpiry: urlParams.get('pp_SettlementExpiry') || '',
      };

      console.log('JazzCash Response:', jazzCashResponse);

      // Verify the response authenticity
      const isVerified = verifyJazzCashResponse(jazzCashResponse);
      
      if (!isVerified) {
        throw new Error('Invalid payment response - security verification failed');
      }

      // Extract payment ID from bill reference
      const campaignId = jazzCashResponse.pp_BillReference.replace('CAMP_', '');
      
      // Check response code
      if (jazzCashResponse.pp_ResponseCode === '000') {
        // Payment successful
        setStatus('success');
        setPaymentData({
          transactionId: jazzCashResponse.pp_RetreivalReferenceNo,
          amount: jazzCashResponse.pp_Amount,
          currency: jazzCashResponse.pp_TxnCurrency,
          campaignId: campaignId,
          description: jazzCashResponse.pp_Description,
          authCode: jazzCashResponse.pp_AuthCode,
          txnDateTime: jazzCashResponse.pp_TxnDateTime,
        });

        // Update payment status in database
        try {
          // Find payment by transaction reference
          const paymentId = jazzCashResponse.pp_TxnRefNo;
          await updatePaymentStatus(paymentId, 'completed', jazzCashResponse.pp_RetreivalReferenceNo);
          
          toast({
            title: "Payment Successful!",
            description: `Your donation of ₨${jazzCashResponse.pp_Amount} has been processed successfully.`,
          });
        } catch (dbError) {
          console.error('Database update error:', dbError);
          // Payment was successful but database update failed
          toast({
            title: "Payment Successful",
            description: "Your payment was processed, but there was an issue updating our records. Please contact support.",
            variant: "destructive",
          });
        }

      } else {
        // Payment failed
        setStatus('failed');
        const errorMsg = formatJazzCashError(jazzCashResponse.pp_ResponseCode);
        setErrorMessage(errorMsg);

        // Update payment status in database
        try {
          const paymentId = jazzCashResponse.pp_TxnRefNo;
          await updatePaymentStatus(paymentId, 'failed', undefined, errorMsg);
        } catch (dbError) {
          console.error('Database update error:', dbError);
        }

        toast({
          title: "Payment Failed",
          description: errorMsg,
          variant: "destructive",
        });
      }

    } catch (error) {
      console.error('Payment callback error:', error);
      setStatus('error');
      setErrorMessage(error instanceof Error ? error.message : 'An unexpected error occurred');
      
      toast({
        title: "Payment Error",
        description: "There was an error processing your payment response. Please contact support.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const formatCurrency = (amount: string) => {
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(parseFloat(amount));
  };

  const formatDateTime = (dateTime: string) => {
    try {
      return new Date(dateTime).toLocaleString('en-PK', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
    } catch {
      return dateTime;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-orange-50 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-slate-200 dark:border-slate-700 shadow-xl">
          <CardContent className="p-8 text-center">
            {isProcessing && (
              <div className="space-y-6">
                <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
                <div>
                  <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200 mb-2">
                    Processing Payment
                  </h2>
                  <p className="text-slate-600 dark:text-slate-400">
                    Please wait while we verify your payment...
                  </p>
                </div>
              </div>
            )}

            {!isProcessing && status === 'success' && paymentData && (
              <div className="space-y-6">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                  className="w-16 h-16 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center mx-auto"
                >
                  <Check className="w-8 h-8 text-white" />
                </motion.div>
                
                <div>
                  <h2 className="text-2xl font-bold text-green-600 dark:text-green-400 mb-2">
                    Payment Successful!
                  </h2>
                  <p className="text-slate-600 dark:text-slate-400 mb-6">
                    Thank you for your generous donation. Your contribution will make a real difference.
                  </p>
                </div>

                <Card className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 border-green-200 dark:border-green-800">
                  <CardContent className="p-6">
                    <div className="space-y-3 text-left">
                      <div className="flex justify-between">
                        <span className="text-slate-600 dark:text-slate-400">Amount:</span>
                        <span className="font-semibold text-slate-800 dark:text-slate-200">
                          {formatCurrency(paymentData.amount)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600 dark:text-slate-400">Transaction ID:</span>
                        <span className="font-mono text-sm text-slate-800 dark:text-slate-200">
                          {paymentData.transactionId}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600 dark:text-slate-400">Auth Code:</span>
                        <span className="font-mono text-sm text-slate-800 dark:text-slate-200">
                          {paymentData.authCode}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600 dark:text-slate-400">Date & Time:</span>
                        <span className="text-sm text-slate-800 dark:text-slate-200">
                          {formatDateTime(paymentData.txnDateTime)}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <div className="flex space-x-3">
                  <Button
                    onClick={() => window.location.href = '/'}
                    className="flex-1 bg-gradient-to-r from-blue-500 to-orange-500 hover:from-blue-600 hover:to-orange-600 text-white"
                  >
                    <Home className="w-4 h-4 mr-2" />
                    Go to Dashboard
                  </Button>
                </div>
              </div>
            )}

            {!isProcessing && status === 'failed' && (
              <div className="space-y-6">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                  className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center mx-auto"
                >
                  <X className="w-8 h-8 text-white" />
                </motion.div>
                
                <div>
                  <h2 className="text-2xl font-bold text-red-600 dark:text-red-400 mb-2">
                    Payment Failed
                  </h2>
                  <p className="text-slate-600 dark:text-slate-400 mb-6">
                    {errorMessage || 'Your payment could not be processed. Please try again.'}
                  </p>
                </div>

                <div className="flex space-x-3">
                  <Button
                    onClick={() => window.location.href = '/'}
                    variant="outline"
                    className="flex-1 border-slate-300 dark:border-slate-600"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Try Again
                  </Button>
                  <Button
                    onClick={() => window.location.href = '/'}
                    className="flex-1 bg-gradient-to-r from-blue-500 to-orange-500 hover:from-blue-600 hover:to-orange-600 text-white"
                  >
                    <Home className="w-4 h-4 mr-2" />
                    Dashboard
                  </Button>
                </div>
              </div>
            )}

            {!isProcessing && status === 'error' && (
              <div className="space-y-6">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                  className="w-16 h-16 bg-orange-500 rounded-full flex items-center justify-center mx-auto"
                >
                  <AlertCircle className="w-8 h-8 text-white" />
                </motion.div>
                
                <div>
                  <h2 className="text-2xl font-bold text-orange-600 dark:text-orange-400 mb-2">
                    Payment Error
                  </h2>
                  <p className="text-slate-600 dark:text-slate-400 mb-6">
                    {errorMessage || 'An unexpected error occurred while processing your payment.'}
                  </p>
                </div>

                <div className="flex space-x-3">
                  <Button
                    onClick={() => window.location.href = '/'}
                    variant="outline"
                    className="flex-1 border-slate-300 dark:border-slate-600"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Campaigns
                  </Button>
                  <Button
                    onClick={() => window.location.href = '/'}
                    className="flex-1 bg-gradient-to-r from-blue-500 to-orange-500 hover:from-blue-600 hover:to-orange-600 text-white"
                  >
                    <Home className="w-4 h-4 mr-2" />
                    Dashboard
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

