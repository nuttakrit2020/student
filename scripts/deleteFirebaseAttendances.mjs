import { initializeApp } from 'firebase/app';
import { getFirestore, doc, deleteDoc, getDocs, collection } from 'firebase/firestore';
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

async function deleteAll() {
  const snapshot = await getDocs(collection(db, 'attendances'));
  console.log(`Found ${snapshot.docs.length} records. Deleting...`);
  
  let count = 0;
  for (const docSnapshot of snapshot.docs) {
    await deleteDoc(doc(db, 'attendances', docSnapshot.id));
    count++;
    if (count % 50 === 0) console.log(`Deleted ${count}`);
  }
  console.log('All deleted.');
  process.exit(0);
}

deleteAll();
