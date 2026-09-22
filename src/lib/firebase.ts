import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getFirestore, Firestore } from "firebase/firestore";
import { getAnalytics, isSupported } from "firebase/analytics";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyA5LMr3c2LS-Oz0FOAh7bMI0YqEm82yG0c",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "brijbiharidham.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "brijbiharidham",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "brijbiharidham.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "22908875203",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:22908875203:web:9fc91ba57a5ffa98834d76",
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || "G-8WLLB07687",
};

export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey && firebaseConfig.projectId
);

let app: FirebaseApp | undefined;
let db: Firestore | undefined;

if (typeof window !== "undefined" || isFirebaseConfigured) {
  try {
    app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
    db = getFirestore(app);

    // Initialize analytics client-side if supported
    if (typeof window !== "undefined") {
      isSupported().then((supported) => {
        if (supported && app) {
          getAnalytics(app);
        }
      });
    }
  } catch (error) {
    console.warn("Firebase initialization skipped or failed, using local persistence manager:", error);
  }
}

export { app, db };
