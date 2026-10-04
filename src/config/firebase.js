import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Firebase Configuration for project "foot-pod"
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyBiGNMZe9XRcgQTa2nzcKjwM8EFss2P98o",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "foot-pod.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "foot-pod",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "foot-pod.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "573973351406",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:573973351406:web:a9c66cf7d6867c1d999cff",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-D53N0JQ2R9"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Force Google Account Selection screen every time user clicks Google button
googleProvider.setCustomParameters({ 
  prompt: 'select_account' 
});

export const db = getFirestore(app);

export default app;
