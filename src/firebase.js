import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
   apiKey: "AIzaSyApY1WOAwdZ3ZknOByh1Op6hJs7xAUN7Zk",
  authDomain: "kjlahsd.firebaseapp.com",
  projectId: "kjlahsd",
  storageBucket: "kjlahsd.firebasestorage.app",
  messagingSenderId: "83825044689",
  appId: "1:83825044689:web:30e0203c403f813541e9f0",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);

export default app;