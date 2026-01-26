import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyB59ttHallHAhl7TvI4aBpIlCoMm_V3Scs",
  authDomain: "the-cozy-cup-f8e20.firebaseapp.com",
  projectId: "the-cozy-cup-f8e20",
  storageBucket: "the-cozy-cup-f8e20.firebasestorage.app",
  messagingSenderId: "636118188851",
  appId: "1:636118188851:web:b7b511ea0a1a6fe877b446",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
