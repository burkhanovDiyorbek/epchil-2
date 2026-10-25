import { getApp, getApps, initializeApp } from "firebase/app";
import { getAnalytics, isSupported } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// Web config is public by design (security comes from Firestore/Auth rules).
// Values come from .env.local; the literals are only a fallback so a missing env never breaks the app.
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyDgmjKlTbB8FGJJCUqu8xB_ER7Knny0l4c",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "epchil-5478d.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "epchil-5478d",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "epchil-5478d.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "818752841503",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:818752841503:web:86a9d32ee798ece74cf22a",
  measurementId: "G-4J2QD5BXVJ",
};

// getApps() makes this safe against Next.js hot reloads (no duplicate-app errors).
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

// Analytics only works in supported browsers.
if (typeof window !== "undefined") {
  isSupported()
    .then((ok) => {
      if (ok) getAnalytics(app);
    })
    .catch(() => {});
}

export const db = getFirestore(app);
export const auth = getAuth(app);
