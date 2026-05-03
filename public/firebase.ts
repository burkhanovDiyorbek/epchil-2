// @ts-nocheck
// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBqqrMq-lzaanhfnVbJ-rx5Nm4qjUT7mik",
  authDomain: "teztop-8d9c1.firebaseapp.com",
  projectId: "teztop-8d9c1",
  storageBucket: "teztop-8d9c1.firebasestorage.app",
  messagingSenderId: "578498433407",
  appId: "1:578498433407:web:0447dc1184e18a8d6b8a4a",
  measurementId: "G-0DZ35HT87P"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = typeof window !== "undefined" ? getAnalytics(app) : null;

export { app, analytics };