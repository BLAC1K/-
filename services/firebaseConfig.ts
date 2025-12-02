
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// ------------------------------------------------------------------
// هام جداً:
// 1. اذهب إلى https://console.firebase.google.com/
// 2. اختر مشروعك (Project Settings -> General -> Your apps)
// 3. انسخ القيم الموجودة في firebaseConfig واستبدل القيم أدناه بها.
// ------------------------------------------------------------------

const firebaseConfig = {
  // استبدل القيم التالية بالقيم الخاصة بمشروعك
  apiKey: "AIzaSy...Your_API_Key_Here",
  authDomain: "your-project-id.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project-id.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
