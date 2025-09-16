# Payment Callback URL Setup

## 🎯 **Your JazzCash Return URL**

For JazzCash integration, use this URL as your return URL:

```
https://yourdomain.com/payment/callback
```

**For local development:**
```
http://localhost:3000/payment/callback
```

## 🔧 **How It Works**

### 1. **Payment Flow**
1. User initiates payment in DonationModal
2. JazzCash redirects to your return URL with payment response
3. PaymentCallback page processes the response
4. User sees success/failure message

### 2. **Response Parameters**
JazzCash sends these parameters to your callback URL:

```
/payment/callback?
pp_Version=1.1&
pp_TxnType=MWALLET&
pp_MerchantID=MC12345&
pp_Password=password&
pp_TxnRefNo=TXN_123456&
pp_Amount=1000&
pp_TxnCurrency=PKR&
pp_BillReference=CAMP_campaign123&
pp_Description=Donation for Campaign&
pp_TxnDateTime=2025-01-07 15:30:00&
pp_SecureHash=abc123...&
pp_ResponseCode=000&
pp_ResponseMessage=Success&
pp_AuthCode=AUTH123&
pp_RetreivalReferenceNo=REF123&
pp_SettlementExpiry=2025-01-08
```

### 3. **Response Codes**
- **000**: Success
- **001**: Invalid amount
- **002**: Invalid merchant
- **003**: Invalid transaction reference
- **004**: Insufficient funds
- **005**: Account blocked
- **006**: Invalid phone number
- **007**: Network error
- **008**: Timeout
- **009**: Duplicate transaction
- **010**: System error

## 🛡️ **Security Features**

### 1. **Hash Verification**
- Verifies JazzCash response authenticity
- Uses SHA256 hash validation
- Prevents response tampering

### 2. **Database Updates**
- Updates payment status automatically
- Increments campaign raised amount
- Logs transaction details

### 3. **Error Handling**
- Comprehensive error messages
- User-friendly error display
- Fallback navigation options

## 📱 **User Experience**

### **Success Page**
- ✅ Green checkmark animation
- 💰 Payment details display
- 🏠 Navigation to dashboard
- 📧 Success notification

### **Failure Page**
- ❌ Red X animation
- ⚠️ Error message display
- 🔄 Retry option
- 🏠 Dashboard navigation

### **Error Page**
- ⚠️ Orange warning animation
- 🔧 Technical error details
- 📞 Support contact info
- 🏠 Safe navigation

## 🚀 **Testing**

### **Local Testing**
1. Start your development server
2. Use return URL: `http://localhost:3000/payment/callback`
3. Test with JazzCash sandbox
4. Verify response handling

### **Production Testing**
1. Deploy your application
2. Use return URL: `https://yourdomain.com/payment/callback`
3. Test with small amounts
4. Verify database updates

## 📋 **JazzCash Configuration**

When setting up JazzCash merchant account, provide:

**Return URL:**
```
https://yourdomain.com/payment/callback
```

**Cancel URL (optional):**
```
https://yourdomain.com/campaigns
```

**Notify URL (optional):**
```
https://yourdomain.com/api/payment/notify
```

## 🔍 **Troubleshooting**

### **Common Issues**

1. **URL Not Found (404)**
   - Check route configuration
   - Verify domain deployment
   - Test URL accessibility

2. **Response Not Processing**
   - Check parameter parsing
   - Verify hash validation
   - Check console errors

3. **Database Updates Failing**
   - Check Firebase connection
   - Verify payment ID format
   - Check error logs

### **Debug Steps**

1. **Check URL Parameters**
   ```javascript
   console.log('URL Params:', new URLSearchParams(window.location.search));
   ```

2. **Verify Hash**
   ```javascript
   console.log('Hash Verification:', verifyJazzCashResponse(response));
   ```

3. **Check Database**
   ```javascript
   console.log('Payment Status:', await getPaymentById(paymentId));
   ```

## 📞 **Support**

If you encounter issues:
1. Check browser console for errors
2. Verify JazzCash response parameters
3. Test with sandbox environment
4. Contact JazzCash support if needed

---

**Your return URL is ready to use!** 🎉

