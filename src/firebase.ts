import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyA7c_b2MD4QgR3kmulqvHD7CD69MfBfaYQ",
  authDomain: "maintainance-store.firebaseapp.com",
  projectId: "maintainance-store",
  storageBucket: "maintainance-store.firebasestorage.app",
  messagingSenderId: "698855054081",
  appId: "1:698855054081:web:052ad64e6914f00b0f1900"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
