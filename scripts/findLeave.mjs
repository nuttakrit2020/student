import { initializeApp } from 'firebase/app';
import { getFirestore, getDocs, collection, query, where, limit } from 'firebase/firestore';
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

async function findLeave() {
  const q = query(collection(db, 'attendances'), where('type', '==', 'leave'), limit(1));
  const snap = await getDocs(q);
  if (!snap.empty) {
    const leave = snap.docs[0].data();
    console.log('Leave Student ID:', leave.studentId);
    console.log('Leave Date:', leave.timestamp);
    
    const studentsSnap = await getDocs(query(collection(db, 'students'), where('id', '==', leave.studentId)));
    if (!studentsSnap.empty) {
      const student = studentsSnap.docs[0].data();
      console.log('Student Name:', student.name);
      console.log('Student Room:', student.room);
    }
  } else {
    console.log('No leave records found.');
  }
  process.exit(0);
}

findLeave();
