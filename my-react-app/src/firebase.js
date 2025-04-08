// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCHOA75lhNNXAH-LqQwvg4nRna8Bvkp1MU",
  authDomain: "dnd-tracker-app.firebaseapp.com",
  projectId: "dnd-tracker-app",
  storageBucket: "dnd-tracker-app.firebasestorage.app",
  messagingSenderId: "176499347617",
  appId: "1:176499347617:web:971f8ed8644ce984fae0e0",
  measurementId: "G-P1VK9LPMPJ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);