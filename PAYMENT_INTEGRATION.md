# JazzCash Payment Integration

This document explains how to integrate JazzCash payment gateway into the CommunityConnect application.

## Setup

### 1. Environment Variables

Add the following environment variables to your `.env` file:

```env
# JazzCash Configuration
REACT_APP_JAZZCASH_MERCHANT_ID=your_merchant_id
REACT_APP_JAZZCASH_PASSWORD=your_password
REACT_APP_JAZZCASH_HASH_KEY=your_hash_key
REACT_APP_JAZZCASH_ENVIRONMENT=sandbox
```

### 2. JazzCash Credentials

To get JazzCash credentials:
1. Register at [JazzCash Merchant Portal](https://merchant.jazzcash.com.pk/)
2. Complete the verification process
3. Get your Merchant ID, Password, and Hash Key
4. Use sandbox environment for testing

## Payment Flow

### 1. Payment Collection Schema

The payment collection in Firestore has the following structure:

```typescript
interface Payment {
  id: string;
  campaignId: string;
  communityId: string;
  userId: string;
  amount: number;
  fee: number;
  total: number;
  paymentMethod: 'jazzcash' | 'easypaisa' | 'bank' | 'raast';
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  userTransactionId?: string;
  jazzcashTransactionId?: string;
  phoneNumber?: string;
  createdAt: Date;
  updatedAt?: Date;
  completedAt?: Date;
  failureReason?: string;
}
```

### 2. Payment Process

1. **User selects amount and payment method**
2. **Payment record created** in Firestore with status 'pending'
3. **JazzCash payment request** generated with secure hash
4. **Payment processed** through JazzCash API
5. **Status updated** to 'completed' or 'failed'
6. **Campaign raised amount** updated automatically

### 3. Security Features

- **Secure Hash Generation**: Uses SHA256 for transaction verification
- **Environment Separation**: Sandbox and live environments
- **Transaction Verification**: Verifies JazzCash responses
- **Error Handling**: Comprehensive error messages

## API Reference

### JazzCash Service Functions

#### `createJazzCashPayment(paymentData)`
Creates a JazzCash payment request with secure hash.

**Parameters:**
- `amount`: Payment amount
- `phoneNumber`: User's phone number
- `campaignId`: Campaign ID
- `userId`: User ID
- `description`: Payment description

**Returns:** JazzCash payment data with secure hash

#### `processJazzCashPayment(paymentData)`
Processes payment through JazzCash API.

**Returns:** 
```typescript
{
  success: boolean;
  transactionId?: string;
  error?: string;
}
```

#### `verifyJazzCashResponse(response)`
Verifies JazzCash payment response authenticity.

**Returns:** boolean

### Payment Service Functions

#### `processPayment(paymentData)`
Main payment processing function that handles all payment methods.

**Parameters:**
```typescript
{
  campaignId: string;
  communityId: string;
  userId: string;
  amount: number;
  paymentMethod: 'jazzcash' | 'easypaisa' | 'bank' | 'raast';
  phoneNumber?: string;
  description: string;
}
```

**Returns:**
```typescript
{
  success: boolean;
  paymentId?: string;
  transactionId?: string;
  error?: string;
}
```

## Testing

### Sandbox Testing
1. Use sandbox environment credentials
2. Test with JazzCash test phone numbers
3. Verify payment flow without real money

### Production Deployment
1. Update environment to 'live'
2. Use production credentials
3. Test with small amounts first

## Error Handling

The system handles various error scenarios:

- **Invalid Amount**: Minimum amount validation
- **Network Errors**: Retry mechanisms
- **Authentication Failures**: Clear error messages
- **Transaction Failures**: Detailed failure reasons

## Integration with Campaigns

When a payment is completed:
1. Payment status updated to 'completed'
2. Campaign `raised` amount incremented
3. User receives confirmation
4. Campaign progress updated in real-time

## Future Enhancements

- **EasyPaisa Integration**: Similar to JazzCash
- **Bank Transfer**: Direct bank integration
- **RAAST Integration**: Pakistan's instant payment system
- **Payment Analytics**: Detailed payment reports
- **Refund System**: Handle payment refunds

