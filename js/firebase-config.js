// firebase-config.js — Firebase Initialization (Compat v8)
const firebaseConfig = {
  apiKey: "AIzaSyBscbRQN5soWaRV2t6S76y3LrKHoL6BLYk",
  authDomain: "my-business-59e50.firebaseapp.com",
  projectId: "my-business-59e50",
  storageBucket: "my-business-59e50.firebasestorage.app",
  messagingSenderId: "957596217188",
  appId: "1:957596217188:web:ad797ae1030331b1ea1471",
  measurementId: "G-WBTRXKTHV4"
};

// Initialize Firebase
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

const auth = firebase.auth();
const analytics = firebase.analytics();