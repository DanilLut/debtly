import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBetEjUuFZsCmLXSq10pndvSo5g_lscNHU",
  authDomain: "debtly-95799.firebaseapp.com",
  projectId: "debtly-95799",
  storageBucket: "debtly-95799.firebasestorage.app",
  messagingSenderId: "164662497880",
  appId: "1:164662497880:web:1e6718da80df154505702d"
};


const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);