import { PaymentMethod, DonationSummary } from '@/types';

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
];

export const calculateDonationSummary = (amount: number): DonationSummary => {
  const fee = Math.max(amount * 0.02, 50); // 2% fee with minimum 50 PKR
  const total = amount + fee;
  
  return { amount, fee, total };
};

export const processJazzCashPayment = async (amount: number, phoneNumber: string) => {
  // Integration with JazzCash API
  // This would typically involve calling JazzCash's payment gateway
  try {
    // Simulate API call
    const response = await fetch('/api/payment/jazzcash', {
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
    console.error('JazzCash payment error:', error);
    throw error;
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
