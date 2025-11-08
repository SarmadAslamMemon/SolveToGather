import { onRequest } from 'firebase-functions/v2/https';
import express from 'express';
import { registerRoutes } from '../server/routes';
import { initializeDatabase } from '../server/firebase';
// Create Express app
const app = express();
// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
// CORS configuration for Firebase Hosting
app.use((req, res, next) => {
    const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [
        'https://savetogather-19574.web.app',
        'https://savetogather-19574.firebaseapp.com',
        process.env.VITE_API_URL?.replace('/api', '') || ''
    ].filter(Boolean);
    const origin = req.headers.origin;
    if (origin && allowedOrigins.includes(origin)) {
        res.header('Access-Control-Allow-Origin', origin);
    }
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    res.header('Access-Control-Allow-Credentials', 'true');
    if (req.method === 'OPTIONS') {
        res.sendStatus(200);
    }
    else {
        next();
    }
});
// Initialize database and register routes
let routesInitialized = false;
const initializeApp = async () => {
    if (routesInitialized)
        return;
    try {
        await initializeDatabase();
        // registerRoutes returns a Server, but we don't need it for Firebase Functions
        await registerRoutes(app);
        // Error handler
        app.use((err, _req, res, _next) => {
            const status = err.status || err.statusCode || 500;
            const message = err.message || 'Internal Server Error';
            res.status(status).json({ message });
        });
        routesInitialized = true;
    }
    catch (error) {
        console.error('Failed to initialize Firebase Function:', error);
        throw error;
    }
};
// Export Firebase Function
export const api = onRequest({
    cors: true,
    memory: '512MiB',
    timeoutSeconds: 60,
}, async (req, res) => {
    // Initialize routes on first request
    await initializeApp();
    // Handle the request
    app(req, res);
});
//# sourceMappingURL=index.js.map