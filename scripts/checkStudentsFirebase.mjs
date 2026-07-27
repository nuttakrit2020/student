import { initializeApp } from 'firebase/app';
import { getFirestore, getDocs, collection } from 'firebase/firestore';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function checkStudents() {
  const snapshot = await getDocs(collection(db, 'students'));
  console.log(`Found ${snapshot.docs.length} students in Firebase`);
  snapshot.docs.slice(0, 5).forEach(doc => {
    console.log(doc.data().id, doc.data().name);
  });
  process.exit(0);
}

checkStudents();
