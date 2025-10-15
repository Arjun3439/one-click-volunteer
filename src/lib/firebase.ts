// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDNDDPITR2T7vTzhN5XOuDfxIFP90rClmg",
  authDomain: "one-click-volunteer.firebaseapp.com",
  projectId: "one-click-volunteer",
  storageBucket: "one-click-volunteer.firebasestorage.app",
  messagingSenderId: "273814235427",
  appId: "1:273814235427:web:fd7915563eab1286420496",
  measurementId: "G-57Z26BKMFC"
};

// Initialize Firebase

const app = initializeApp(firebaseConfig);

// Initialize and export Firebase services
export const db = getFirestore(app);
export const storage = getStorage(app);

