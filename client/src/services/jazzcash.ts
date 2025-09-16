import { JazzCashCredentials, Payment } from '@/types';

// JazzCash Configuration
const JAZZCASH_CONFIG: JazzCashCredentials = {
  merchantId: import.meta.env.VITE_JAZZCASH_MERCHANT_ID || 'MC12345',
  password: import.meta.env.VITE_JAZZCASH_PASSWORD || 'password123',
  hashKey: import.meta.env.VITE_JAZZCASH_HASH_KEY || 'hashkey123',
  environment: (import.meta.env.VITE_JAZZCASH_ENVIRONMENT as 'sandbox' | 'live') || 'sandbox'
};

export interface JazzCashPaymentData {
  pp_Version: string;
  pp_Amount: string;
  pp_TxnCurrency: string;
  pp_BillReference: string;
  pp_Description: string;
  pp_DiscountedAmount?: string;
  pp_DiscountBank?: string;
  pp_MerchantID: string;
  pp_Password: string;
  pp_TxnRefNo: string;
  pp_ReturnURL: string;
  pp_SecureHash: string;
}

export interface JazzCashResponse {
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
  pp_TxnRefNo: string;
}

/**
 * Generate JazzCash Secure Hash
 * Based on the algorithm provided in JazzCash documentation
 */
export const generateJazzCashHash = (data: Partial<JazzCashPaymentData>): string => {
  const crypto = require('crypto');
  
  // Create string for hash generation
  const hashString = [
    data.pp_Version,
    data.pp_MerchantID,
    data.pp_Password,
    data.pp_TxnRefNo,
    data.pp_Amount,
    data.pp_TxnCurrency,
    data.pp_BillReference,
    data.pp_Description,
    data.pp_ReturnURL,
    JAZZCASH_CONFIG.hashKey
  ].join('&');

  // Generate SHA256 hash
  return crypto.createHash('sha256').update(hashString).digest('hex');
};

/**
 * Create JazzCash Payment Request
 */
export const createJazzCashPayment = async (paymentData: {
  amount: number;
  phoneNumber: string;
  campaignId: string;
  userId: string;
  description: string;
}): Promise<JazzCashPaymentData> => {
  try {
    const txnRefNo = `TXN_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const returnURL = `${window.location.origin}/payment/callback`;
    
    const paymentRequest: Partial<JazzCashPaymentData> = {
      pp_Version: '1.1',
      pp_Amount: paymentData.amount.toString(),
      pp_TxnCurrency: 'PKR',
      pp_BillReference: `CAMP_${paymentData.campaignId}`,
      pp_Description: paymentData.description,
      pp_MerchantID: JAZZCASH_CONFIG.merchantId,
      pp_Password: JAZZCASH_CONFIG.password,
      pp_TxnRefNo: txnRefNo,
      pp_ReturnURL: returnURL,
    };

    // Generate secure hash
    const secureHash = generateJazzCashHash(paymentRequest);
    
    const finalPaymentData: JazzCashPaymentData = {
      ...paymentRequest as JazzCashPaymentData,
      pp_SecureHash: secureHash,
    };

    return finalPaymentData;
  } catch (error) {
    console.error('Error creating JazzCash payment:', error);
    throw new Error('Failed to create JazzCash payment request');
  }
};

/**
 * Verify JazzCash Payment Response
 */
export const verifyJazzCashResponse = (response: JazzCashResponse): boolean => {
  try {
    const crypto = require('crypto');
    
    // Create verification string
    const verificationString = [
      response.pp_Version,
      response.pp_TxnType,
      response.pp_MerchantID,
      response.pp_Password,
      response.pp_TxnRefNo,
      response.pp_Amount,
      response.pp_TxnCurrency,
      response.pp_BillReference,
      response.pp_Description,
      response.pp_TxnDateTime,
      response.pp_ResponseCode,
      response.pp_ResponseMessage,
      response.pp_AuthCode,
      response.pp_RetreivalReferenceNo,
      response.pp_SettlementExpiry,
      JAZZCASH_CONFIG.hashKey
    ].join('&');

    // Generate hash for verification
    const generatedHash = crypto.createHash('sha256').update(verificationString).digest('hex');
    
    return generatedHash === response.pp_SecureHash;
  } catch (error) {
    console.error('Error verifying JazzCash response:', error);
    return false;
  }
};

/**
 * Process JazzCash Payment
 */
export const processJazzCashPayment = async (paymentData: {
  amount: number;
  phoneNumber: string;
  campaignId: string;
  userId: string;
  description: string;
}): Promise<{ success: boolean; transactionId?: string; error?: string }> => {
  try {
    // Create payment request
    const jazzCashPayment = await createJazzCashPayment(paymentData);
    
    // In a real implementation, you would:
    // 1. Send this data to JazzCash API
    // 2. Handle the response
    // 3. Process the payment
    
    // For now, we'll simulate the payment process
    console.log('JazzCash Payment Request:', jazzCashPayment);
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Simulate successful payment
    const transactionId = `JC_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    return {
      success: true,
      transactionId: transactionId
    };
    
  } catch (error) {
    console.error('JazzCash payment processing error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Payment processing failed'
    };
  }
};

/**
 * Get JazzCash Payment Status
 */
export const getJazzCashPaymentStatus = async (transactionId: string): Promise<{
  status: 'pending' | 'completed' | 'failed';
  details?: any;
}> => {
  try {
    // In a real implementation, you would query JazzCash API for status
    // For now, we'll simulate status checking
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Simulate status check
    return {
      status: 'completed',
      details: {
        transactionId,
        amount: '1000',
        currency: 'PKR',
        status: 'completed',
        timestamp: new Date().toISOString()
      }
    };
  } catch (error) {
    console.error('Error checking JazzCash payment status:', error);
    return {
      status: 'failed'
    };
  }
};

/**
 * Format JazzCash Error Messages
 */
export const formatJazzCashError = (errorCode: string): string => {
  const errorMessages: { [key: string]: string } = {
    '000': 'Transaction successful',
    '001': 'Transaction failed - Invalid amount',
    '002': 'Transaction failed - Invalid merchant',
    '003': 'Transaction failed - Invalid transaction reference',
    '004': 'Transaction failed - Insufficient funds',
    '005': 'Transaction failed - Account blocked',
    '006': 'Transaction failed - Invalid phone number',
    '007': 'Transaction failed - Network error',
    '008': 'Transaction failed - Timeout',
    '009': 'Transaction failed - Duplicate transaction',
    '010': 'Transaction failed - System error'
  };
  
  return errorMessages[errorCode] || 'Unknown error occurred';
};

export default {
  createJazzCashPayment,
  verifyJazzCashResponse,
  processJazzCashPayment,
  getJazzCashPaymentStatus,
  formatJazzCashError,
  JAZZCASH_CONFIG
};

