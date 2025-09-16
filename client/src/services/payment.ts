import { PaymentMethod, DonationSummary, Payment } from '@/types';
import { processJazzCashPayment, formatJazzCashError } from './jazzcash';
import { createPayment, updatePaymentStatus } from './firebase';

export const PAYMENT_METHODS: PaymentMethod[] = [
  {
    id: 'jazzcash',
    name: 'JazzCash',
    icon: 'fas fa-mobile-alt',
    color: 'bg-red-500',
    type: 'jazzcash',
  },
  {
    id: 'easypaisa',
    name: 'EasyPaisa',
    icon: 'fas fa-wallet',
    color: 'bg-green-500',
    type: 'easypaisa',
  },
  {
    id: 'bank',
    name: 'Bank Transfer',
    icon: 'fas fa-university',
    color: 'bg-blue-500',
    type: 'bank',
  },
  {
    id: 'raast',
    name: 'RAAST',
    icon: 'fas fa-exchange-alt',
    color: 'bg-purple-500',
    type: 'raast',
  },
];

export const calculateDonationSummary = (amount: number): DonationSummary => {
  const fee = Math.max(amount * 0.02, 50); // 2% fee with minimum 50 PKR
  const total = amount + fee;
  
  return { amount, fee, total };
};

export const processPayment = async (paymentData: {
  campaignId: string;
  communityId: string;
  userId: string;
  amount: number;
  paymentMethod: 'jazzcash' | 'easypaisa' | 'bank' | 'raast';
  phoneNumber?: string;
  description: string;
}): Promise<{ success: boolean; paymentId?: string; transactionId?: string; error?: string }> => {
  try {
    // Calculate fees
    const summary = calculateDonationSummary(paymentData.amount);
    
    // Create payment record in database
    const paymentRecord = {
      campaignId: paymentData.campaignId,
      communityId: paymentData.communityId,
      userId: paymentData.userId,
      amount: summary.amount,
      fee: summary.fee,
      total: summary.total,
      paymentMethod: paymentData.paymentMethod,
      phoneNumber: paymentData.phoneNumber,
      userTransactionId: `USER_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      status: 'pending' as const,
    };
    
    const paymentId = await createPayment(paymentRecord);
    
    // Process payment based on method
    let result;
    switch (paymentData.paymentMethod) {
      case 'jazzcash':
        result = await processJazzCashPayment({
          amount: summary.total,
          phoneNumber: paymentData.phoneNumber || '',
          campaignId: paymentData.campaignId,
          userId: paymentData.userId,
          description: paymentData.description,
        });
        break;
      case 'easypaisa':
        result = await processEasyPaisaPayment(summary.total, paymentData.phoneNumber || '');
        break;
      case 'bank':
        result = await processBankTransfer(summary.total, {});
        break;
      case 'raast':
        // Implement RAAST integration
        result = { success: true, transactionId: `RAST_${Date.now()}` };
        break;
      default:
        throw new Error('Unsupported payment method');
    }
    
    if (result.success) {
      // Update payment status to completed
      await updatePaymentStatus(paymentId, 'completed', result.transactionId);
      
      return {
        success: true,
        paymentId,
        transactionId: result.transactionId
      };
    } else {
      // Update payment status to failed
      await updatePaymentStatus(paymentId, 'failed', undefined, result.error);
      
      return {
        success: false,
        paymentId,
        error: result.error || 'Payment processing failed'
      };
    }
    
  } catch (error) {
    console.error('Payment processing error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Payment processing failed'
    };
  }
};

export const processEasyPaisaPayment = async (amount: number, phoneNumber: string) => {
  // Integration with EasyPaisa API
  try {
    const response = await fetch('/api/payment/easypaisa', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount, phoneNumber }),
    });
    
    if (!response.ok) {
      throw new Error('Payment processing failed');
    }
    
    const result = await response.json();
    return result;
  } catch (error) {
    console.error('EasyPaisa payment error:', error);
    throw error;
  }
};

export const processBankTransfer = async (amount: number, bankDetails: any) => {
  // Integration with bank transfer system
  try {
    const response = await fetch('/api/payment/bank', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount, bankDetails }),
    });
    
    if (!response.ok) {
      throw new Error('Payment processing failed');
    }
    
    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Bank transfer error:', error);
    throw error;
  }
};
