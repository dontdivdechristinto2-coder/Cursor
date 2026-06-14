import { FirebaseApp, getApps, initializeApp } from "firebase/app";
import { Auth, getAuth, GoogleAuthProvider } from "firebase/auth";
import { Firestore, getFirestore } from "firebase/firestore";
import { FirebaseStorage, getStorage } from "firebase/storage";

type FirebaseServices = {
  app: FirebaseApp;
  auth: Auth;
  db: Firestore;
  storage: FirebaseStorage;
  googleProvider: GoogleAuthProvider;
};

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

const hasFirebaseConfig = Object.values(firebaseConfig).every((value) => typeof value === "string" && value.length > 0);

export const firebaseServices: FirebaseServices | null = hasFirebaseConfig
  ? (() => {
      const app = getApps().length > 0 ? getApps()[0] : initializeApp(firebaseConfig);
      const googleProvider = new GoogleAuthProvider();
      googleProvider.setCustomParameters({
        prompt: "select_account"
      });

      return {
        app,
        auth: getAuth(app),
        db: getFirestore(app),
        storage: getStorage(app),
        googleProvider
      };
    })()
  : null;

export function requireFirebaseServices(): FirebaseServices {
  if (!firebaseServices) {
    throw new Error("Firebase environment variables are required to run CopticCloud.");
  }

  return firebaseServices;
}

export const isFirebaseConfigured = Boolean(firebaseServices);
