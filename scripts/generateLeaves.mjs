import { initializeApp } from 'firebase/app';
import { getFirestore, getDocs, collection, doc, setDoc } from 'firebase/firestore';
import dotenv from 'dotenv';
import crypto from 'crypto';

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

const classSchedules = {
  '3/1': { day: 4, start: '13:30', end: '14:20' },
  '3/2': { day: 5, start: '11:50', end: '12:40' },
  '3/3': { day: 5, start: '08:30', end: '09:20' },
  '3/4': { day: 5, start: '12:40', end: '13:30' },
  '3/5': { day: 1, start: '13:30', end: '14:20' },
  '3/6': { day: 3, start: '08:30', end: '09:20' },
  '3/7': { day: 1, start: '14:20', end: '15:10' },
  '3/8': { day: 5, start: '10:10', end: '11:00' },
};

function getRoomKey(r) {
  if (!r) return '';
  return '3/' + r.replace(/^ม\.?\s*/, '').replace(/^3\//, '').trim();
}

async function run() {
  console.log('Fetching students and attendances...');
  const [studentsSnap, attendancesSnap] = await Promise.all([
    getDocs(collection(db, 'students')),
    getDocs(collection(db, 'attendances'))
  ]);

  const students = studentsSnap.docs.map(d => d.data());
  const attendances = attendancesSnap.docs.map(d => d.data());

  const attMap = new Map();
  attendances.forEach(a => {
    if (!attMap.has(a.studentId)) attMap.set(a.studentId, []);
    attMap.get(a.studentId).push(a);
  });

  const startOfSemester = new Date('2026-05-18T00:00:00+07:00');
  const todayDate = new Date();
  todayDate.setHours(0, 0, 0, 0);

  const generatedLeaves = [];

  for (const student of students) {
    const roomKey = getRoomKey(student.room);
    const schedule = classSchedules[roomKey];
    if (!schedule) continue;

    const studentAtts = attMap.get(student.id) || [];
    const attDateStrings = new Set(studentAtts.map(a => {
      const d = new Date(a.timestamp);
      return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    }));

    const classDay = schedule.day;
    const absentDates = [];

    let d = new Date(startOfSemester);
    d.setHours(12, 0, 0, 0);
    while (d <= todayDate) {
      if (d.getDay() === classDay) {
        const dateStr = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
        if (!attDateStrings.has(dateStr)) {
          absentDates.push(new Date(d));
        }
      }
      d.setDate(d.getDate() + 1);
    }

    // Only for some students, pick an absent date and make it a leave
    if (absentDates.length > 0 && Math.random() < 0.3) {
      const randomAbsentDate = absentDates[Math.floor(Math.random() * absentDates.length)];
      
      const ts = `${randomAbsentDate.toISOString().split('T')[0]}T08:00:00.000Z`;
      
      generatedLeaves.push({
        id: crypto.randomUUID(),
        studentId: student.id,
        type: 'leave',
        status: 'approved',
        reason: 'ลากิจ / ลาป่วย (สุ่ม)',
        timestamp: ts,
        createdAt: ts
      });
    }
  }

  console.log(`Generated ${generatedLeaves.length} leave records. Uploading...`);
  let count = 0;
  for (const att of generatedLeaves) {
    await setDoc(doc(db, 'attendances', att.id), att);
    count++;
    if (count % 10 === 0) console.log(`Uploaded ${count}/${generatedLeaves.length}`);
  }
  console.log('Done uploading leaves!');
  process.exit(0);
}

run();
