import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyDslJYKbzkVUUgNtbmo1l6Ihk1Q77Gx8AI",
  authDomain: "clinic-queue-87fb6.firebaseapp.com",
  databaseURL: "https://clinic-queue-87fb6-default-rtdb.firebaseio.com",
  projectId: "clinic-queue-87fb6",
  storageBucket: "clinic-queue-87fb6.firebasestorage.app",
  messagingSenderId: "612682347166",
  appId: "1:612682347166:web:fdca55144b4c8acbb5418f"
};

const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);