# Firebase Deployment Guide

This guide will help you deploy CommunityConnect to Firebase Hosting (frontend) and Firebase Cloud Functions (backend).

## 📋 Prerequisites

1. **Firebase CLI**: Install Firebase CLI globally
   ```bash
   npm install -g firebase-tools
   ```

2. **Firebase Login**: Login to Firebase
   ```bash
   firebase login
   ```

3. **Firebase Project**: Ensure you have access to the Firebase project `savetogather-19574`

## 🚀 Quick Deployment

### Step 1: Build the Frontend
```bash
npm run build:firebase
```

This will:
- Build the React frontend to `dist/public/`
- Install dependencies in `functions/`
- Build the TypeScript functions

### Step 2: Deploy Everything
```bash
npm run deploy:firebase
```

Or deploy separately:
```bash
# Deploy only hosting (frontend)
npm run deploy:firebase:hosting

# Deploy only functions (backend)
npm run deploy:firebase:functions
```

## 🔧 Configuration

### Environment Variables

Firebase Functions environment variables need to be set using Firebase CLI:

```bash
# Set Firebase configuration (these are already in your Firebase project)
firebase functions:config:set \
  firebase.api_key="your_api_key" \
  firebase.project_id="savetogather-19574" \
  firebase.app_id="your_app_id"

# Set other environment variables
firebase functions:config:set \
  app.env="production" \
  app.session_secret="your_random_secret"
```

**For Firebase Functions v2**, use `firebase functions:secrets:set` instead:

```bash
# Set secrets (for sensitive data)
firebase functions:secrets:set FIREBASE_SERVICE_ACCOUNT_JSON
# Paste your service account JSON when prompted

# Set regular environment variables
firebase functions:config:set \
  VITE_FIREBASE_API_KEY="your_key" \
  VITE_FIREBASE_PROJECT_ID="savetogather-19574" \
  VITE_FIREBASE_APP_ID="your_app_id" \
  VITE_FIREBASE_AUTH_DOMAIN="savetogather-19574.firebaseapp.com" \
  VITE_FIREBASE_STORAGE_BUCKET="savetogather-19574.firebasestorage.app" \
  VITE_FIREBASE_MESSAGING_SENDER_ID="986993003813" \
  VITE_FIREBASE_MEASUREMENT_ID="G-WM7FRZ6XC4" \
  VITE_API_URL="https://savetogather-19574.web.app" \
  SESSION_SECRET="your_random_secret" \
  ALLOWED_ORIGINS="https://savetogather-19574.web.app,https://savetogather-19574.firebaseapp.com"
```

### Firebase Service Account

For Firebase Admin SDK to work in Cloud Functions, you have two options:

1. **Automatic (Recommended)**: Firebase Functions automatically have access to your Firebase project. The Admin SDK will use Application Default Credentials.

2. **Manual**: If you need a specific service account, set it as a secret:
   ```bash
   firebase functions:secrets:set FIREBASE_SERVICE_ACCOUNT_JSON
   # Paste your service account JSON
   ```

## 📁 Project Structure

```
.
├── .firebaserc          # Firebase project configuration
├── firebase.json        # Firebase deployment configuration
├── functions/          # Firebase Cloud Functions
│   ├── index.ts        # Function entry point
│   ├── package.json    # Function dependencies
│   └── tsconfig.json   # TypeScript config
├── client/             # React frontend
└── server/             # Express backend (used by functions)
```

## 🔍 How It Works

1. **Frontend (Firebase Hosting)**:
   - Built React app is served from `dist/public/`
   - All routes except `/api/**` serve the React app
   - API routes are proxied to Cloud Functions

2. **Backend (Firebase Cloud Functions)**:
   - Express app wrapped in Firebase Function
   - Handles all `/api/**` routes
   - Uses Firebase Admin SDK for database access

## 🧪 Testing Locally

### Test Functions Locally
```bash
cd functions
npm run serve
```

This starts the Firebase emulator. Visit `http://localhost:5001` to test.

### Test Full Stack Locally
```bash
# Terminal 1: Start Firebase emulators
firebase emulators:start

# Terminal 2: Start frontend dev server
npm run dev:frontend
```

## 📝 Deployment Checklist

- [ ] Firebase CLI installed and logged in
- [ ] Environment variables set in Firebase
- [ ] Service account configured (if needed)
- [ ] Frontend built successfully (`dist/public/` exists)
- [ ] Functions built successfully (`functions/lib/` exists)
- [ ] Test locally with emulators
- [ ] Deploy to Firebase
- [ ] Verify frontend loads at `https://savetogather-19574.web.app`
- [ ] Test API endpoints at `https://savetogather-19574.web.app/api/health`
- [ ] Update `VITE_API_URL` in frontend environment if needed

## 🐛 Troubleshooting

### Functions Not Deploying

1. **Check Node.js version**: Functions require Node.js 18
   ```bash
   node --version  # Should be 18.x
   ```

2. **Check TypeScript compilation**:
   ```bash
   cd functions
   npm run build
   ```

3. **Check Firebase CLI version**:
   ```bash
   firebase --version
   # Update if needed: npm install -g firebase-tools@latest
   ```

### CORS Errors

If you see CORS errors, ensure:
- `ALLOWED_ORIGINS` includes your Firebase Hosting URL
- CORS is enabled in function configuration (`cors: true`)

### Environment Variables Not Working

Firebase Functions v2 uses different methods:
- Use `firebase functions:config:set` for regular env vars
- Use `firebase functions:secrets:set` for sensitive data
- Access via `process.env.VARIABLE_NAME` in code

### Frontend Can't Connect to API

1. Check `VITE_API_URL` is set correctly
2. Verify API routes are proxied in `firebase.json`
3. Check browser console for errors
4. Verify function is deployed and accessible

## 🔄 Continuous Deployment

To set up automatic deployments on Git push:

1. **GitHub Actions** (recommended):
   Create `.github/workflows/firebase-deploy.yml`:
   ```yaml
   name: Deploy to Firebase
   on:
     push:
       branches: [main]
   jobs:
     deploy:
       runs-on: ubuntu-latest
       steps:
         - uses: actions/checkout@v3
         - uses: actions/setup-node@v3
           with:
             node-version: '18'
         - run: npm ci
         - run: npm run build:firebase
         - uses: FirebaseExtended/action-hosting-deploy@v0
           with:
             repoToken: '${{ secrets.GITHUB_TOKEN }}'
             firebaseServiceAccount: '${{ secrets.FIREBASE_SERVICE_ACCOUNT }}'
             channelId: live
             projectId: savetogather-19574
   ```

2. **Firebase GitHub Integration**:
   - Go to Firebase Console > Hosting
   - Connect your GitHub repository
   - Enable automatic deployments

## 📊 Monitoring

- **Function Logs**: `firebase functions:log`
- **Hosting Analytics**: Firebase Console > Hosting
- **Function Metrics**: Firebase Console > Functions

## 🔗 URLs After Deployment

- **Frontend**: `https://savetogather-19574.web.app`
- **API Health**: `https://savetogather-19574.web.app/api/health`
- **API Base**: `https://savetogather-19574.web.app/api`

## 💡 Tips

1. **Cost Optimization**: Firebase Functions have a free tier (2 million invocations/month)
2. **Performance**: Use Firebase CDN for static assets
3. **Security**: Always use secrets for sensitive data
4. **Testing**: Test with emulators before deploying
5. **Rollback**: Use `firebase hosting:rollback` if needed

## 🆘 Need Help?

- Firebase Documentation: https://firebase.google.com/docs
- Firebase Functions Docs: https://firebase.google.com/docs/functions
- Firebase Hosting Docs: https://firebase.google.com/docs/hosting







