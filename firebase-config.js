
const firebaseConfig = {
  apiKey: "AIzaSyCauAoMLbNCLuyh7_acwVuhVsucP7glKvI",
  authDomain: "iainfo-5ef0b.firebaseapp.com",
  projectId: "iainfo-5ef0b",
  storageBucket: "iainfo-5ef0b.firebasestorage.app",
  messagingSenderId: "874564043787",
  appId: "1:874564043787:web:5409a6a9953d57f71db30e",
};

if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

const auth = firebase.auth();
const db = firebase.firestore();

window.firebaseAuth = auth;
window.firebaseDb = db;
