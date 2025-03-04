// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBtVl6BwUKCI-yIJUUHRwcXKK0Tk9eX5PA",
  authDomain: "form-app-9907d.firebaseapp.com",
  projectId: "form-app-9907d",
  storageBucket: "form-app-9907d.firebasestorage.app",
  messagingSenderId: "722465369158",
  appId: "1:722465369158:web:8293ef96b98610280d2e47"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);