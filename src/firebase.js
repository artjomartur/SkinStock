import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// ⚠️ ERSETZE DIESE WERTE mit denen aus deiner Firebase-Konsole
const firebaseConfig = {
  apiKey: "AIzaSyApqQ4NeMZliyqUU2jnCnCZgsy3h7drMt0",
  authDomain: "skinstock-e6d08.firebaseapp.com",
  projectId: "skinstock-e6d08",
  storageBucket: "skinstock-e6d08.firebasestorage.app",
  messagingSenderId: "318819777231",
  appId: "1:318819777231:web:a4734d4b5c721074a915ba",
  measurementId: "G-JDHDNXYX31"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db };
