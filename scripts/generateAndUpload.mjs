import { initializeApp } from 'firebase/app';
import { getFirestore, getDocs, collection, doc, setDoc } from 'firebase/firestore';
import dotenv from 'dotenv';
import fs from 'fs';
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
  // Fetch students from Firebase
  const snapshot = await getDocs(collection(db, 'students'));
  const students = snapshot.docs.map(d => d.data());
  const studentMap = new Map();
  students.forEach(s => studentMap.set(s.id, s));

  // Parse raw data
  const lines = fs.readFileSync('scripts/raw_data.txt', 'utf8').trim().split('\n');
  const generatedAttendances = [];
  const startOfSemester = new Date('2026-05-18T00:00:00+07:00');
  const todayDate = new Date();
  todayDate.setHours(0, 0, 0, 0);

  for (const line of lines) {
    if (!line.trim()) continue;
    const parts = line.split('\t');
    if (parts.length < 3) continue;
    const realId = parts[0].trim();
    const absenceCount = parseFloat(parts[2].trim());

    const student = studentMap.get(realId);
    if (!student) {
      console.log(`Student not found in Firebase: ${realId}`);
      continue;
    }

    const roomKey = getRoomKey(student.room);
    const schedule = classSchedules[roomKey];
    if (!schedule) {
      console.log(`Schedule not found for room ${student.room}`);
      continue;
    }

    const classDay = schedule.day;
    const dates = [];
    let d = new Date(startOfSemester);
    d.setHours(12, 0, 0, 0);
    while (d <= todayDate) {
      if (d.getDay() === classDay) {
        dates.push(new Date(d));
      }
      d.setDate(d.getDate() + 1);
    }

    let absencesToAssign = absenceCount > 0 ? Math.ceil(absenceCount) : 0;
    const shuffledDates = [...dates].sort(() => 0.5 - Math.random());
    const absentDates = new Set(shuffledDates.slice(0, absencesToAssign).map(d => d.getTime()));

    for (const dt of dates) {
      const isAbsent = absentDates.has(dt.getTime());
      if (isAbsent) continue; // We only generate 'present' records for this task

      // Create a timestamp starting with the date
      // We want dt in local time timezone string
      const ts = `${dt.toISOString().split('T')[0]}T08:00:00.000Z`;

      generatedAttendances.push({
        id: crypto.randomUUID(),
        studentId: realId,
        type: 'present',
        timestamp: ts,
        reason: '',
        lat: null,
        lng: null,
        distance: null,
        createdAt: ts
      });
    }
  }

  console.log(`Generated ${generatedAttendances.length} records. Uploading...`);
  let count = 0;
  for (const att of generatedAttendances) {
    await setDoc(doc(db, 'attendances', att.id), att);
    count++;
    if (count % 50 === 0) console.log(`Uploaded ${count}/${generatedAttendances.length}`);
  }
  console.log('Done uploading to Firebase!');
  process.exit(0);
}

run();
