# JazzCash Environment Variables Setup

## 🔧 **Fixed the Process Error!**

The error was caused by using `process.env` in the browser environment. In Vite, environment variables are accessed through `import.meta.env`.

## ✅ **What I Fixed:**

**Before (causing error):**
```typescript
merchantId: process.env.REACT_APP_JAZZCASH_MERCHANT_ID || 'MC12345',
```

**After (working):**
```typescript
merchantId: import.meta.env.VITE_JAZZCASH_MERCHANT_ID || 'MC12345',
```

## 📝 **Environment Variables Setup**

### **1. Create `.env` file in your project root:**

```bash
# Copy from env.example and add JazzCash variables
cp env.example .env
```

### **2. Add these JazzCash variables to your `.env` file:**

```env
# JazzCash Configuration (Sandbox/Test Credentials)
VITE_JAZZCASH_MERCHANT_ID=MC12345
VITE_JAZZCASH_PASSWORD=password123
VITE_JAZZCASH_HASH_KEY=hashkey123
VITE_JAZZCASH_ENVIRONMENT=sandbox
```

### **3. For Production (when you get real credentials):**

```env
# JazzCash Configuration (Production Credentials)
VITE_JAZZCASH_MERCHANT_ID=your_real_merchant_id
VITE_JAZZCASH_PASSWORD=your_real_password
VITE_JAZZCASH_HASH_KEY=your_real_hash_key
VITE_JAZZCASH_ENVIRONMENT=live
```

## 🔑 **Vite Environment Variable Rules:**

### **Naming Convention:**
- Must start with `VITE_` prefix
- Access via `import.meta.env.VITE_VARIABLE_NAME`
- Available in browser (client-side)

### **Security Note:**
- Variables starting with `VITE_` are exposed to the browser
- Only put non-sensitive data in `VITE_` variables
- For sensitive server data, use server-side environment variables

## 🧪 **Testing the Fix:**

1. **Create `.env` file** with the variables above
2. **Restart your development server:**
   ```bash
   npm run dev
   ```
3. **Check browser console** - no more `process is not defined` errors
4. **Test payment flow** - should work with sandbox credentials

## 📋 **Complete `.env` Template:**

```env
# Firebase Configuration
VITE_FIREBASE_API_KEY=AIzaSyDhQZhmelEU5SeV4trChALR_ei0TyCkpFo
VITE_FIREBASE_PROJECT_ID=savetogather-19574
VITE_FIREBASE_APP_ID=1:986993003813:web:7b4dc10bffb0d8e26ddecc
VITE_FIREBASE_AUTH_DOMAIN=savetogather-19574.firebaseapp.com
VITE_FIREBASE_STORAGE_BUCKET=savetogather-19574.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=986993003813
VITE_FIREBASE_MEASUREMENT_ID=G-WM7FRZ6XC4

# API Configuration
VITE_API_URL=http://localhost:5000

# JazzCash Configuration (Sandbox/Test Credentials)
VITE_JAZZCASH_MERCHANT_ID=MC12345
VITE_JAZZCASH_PASSWORD=password123
VITE_JAZZCASH_HASH_KEY=hashkey123
VITE_JAZZCASH_ENVIRONMENT=sandbox

# Server Configuration (not VITE_ prefixed - server-side only)
PORT=5000
NODE_ENV=development
SESSION_SECRET=your_session_secret_here
```

## 🚨 **Important Notes:**

1. **Restart Required**: After adding environment variables, restart your dev server
2. **File Location**: `.env` file goes in project root (same level as `package.json`)
3. **Git Ignore**: Make sure `.env` is in your `.gitignore` file
4. **Production**: Use different credentials for production environment

## 🔍 **Troubleshooting:**

### **Still getting errors?**
1. Check `.env` file is in project root
2. Verify variable names start with `VITE_`
3. Restart development server
4. Check browser console for other errors

### **Variables not loading?**
1. Ensure `.env` file exists and is properly formatted
2. Check for typos in variable names
3. Verify no spaces around `=` signs
4. Restart the development server

---

**Your JazzCash integration should now work without the `process is not defined` error!** 🎉
