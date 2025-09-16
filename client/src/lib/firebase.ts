import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyDhQZhmelEU5SeV4trChALR_ei0TyCkpFo",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "savetogather-19574.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "savetogather-19574",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "savetogather-19574.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "986993003813",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:986993003813:web:7b4dc10bffb0d8e26ddecc",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-WM7FRZ6XC4",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;
