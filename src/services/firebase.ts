import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from 'firebase/storage';


const firebaseConfig = {
  apiKey: "AIzaSyBDuU2uCMNJN_XJ88sy5O34--aaM3-zMsk",
  authDomain: "educhat-maab.firebaseapp.com",
  projectId: "educhat-maab",
  storageBucket: "educhat-maab.appspot.com",
  messagingSenderId: "61886100977",
  appId: "1:61886100977:web:a2367d44036380030f8050"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);