import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// ⚠️ ERSETZE DIESE WERTE mit denen aus deiner Firebase-Konsole
const firebaseConfig = {
  apiKey: "DEINE_API_KEY",
  authDomain: "DEIN_PROJECT.firebaseapp.com",
  projectId: "DEIN_PROJECT",
  storageBucket: "DEIN_PROJECT.firebasestorage.app",
  messagingSenderId: "DEINE_MESSAGING_ID",
  appId: "DEINE_APP_ID"
};

let app, auth, db;

// Um die App nicht abstürzen zu lassen, prüfen wir, ob ein echter API Key da ist
if (firebaseConfig.apiKey !== "DEINE_API_KEY") {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
} else {
  console.warn("⚠️ Firebase ist noch nicht konfiguriert! Bitte füge deine echten Keys in src/firebase.js ein.");
}

export { auth, db };
