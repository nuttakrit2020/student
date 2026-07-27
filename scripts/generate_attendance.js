const fs = require('fs');
const crypto = require('crypto');

const inputData = `
15194	0.5
15195	0
15196	2
15197	0.5
15198	0
15199	0
15200	1
15201	0.5
15202	0
15203	1
15204	0
15206	0
15208	0
15209	0
15210	0
15211	0
15212	0.5
15213	0.5
15214	0
15215	0
15216	0
15218	2.5
15221	0.5
15222	1
15223	0
15224	0
15225	0
15226	0
15227	0.5
15228	0
16077	0
15405	0.5
00003	0
`;

// Map wrong user IDs to actual database IDs based on names
const idMap = {
  '16077': '00000', // พชร กลิ่นรื่น
  '15405': '00001', // กฤษณะ เอกญาติ
  '00003': '00002'  // กีรติกานต์ กุลบุตร
};

const studentsData = JSON.parse(fs.readFileSync('data/students.json', 'utf8'));
const settingsData = JSON.parse(fs.readFileSync('data/settings.json', 'utf8'));
let attendances = [];
try {
  attendances = JSON.parse(fs.readFileSync('data/attendances.json', 'utf8'));
} catch (e) {
  attendances = [];
}

const scores = {};
inputData.trim().split('\n').forEach(line => {
  const parts = line.trim().split(/\s+/);
  if (parts.length >= 2) {
    scores[parts[0]] = parseFloat(parts[parts.length - 1]);
  }
});

const todayDate = new Date();
todayDate.setHours(23, 59, 59, 999);
const startOfSemester = new Date('2026-05-18T00:00:00+07:00');

// Generate all past class dates for each room
const pastDatesByRoom = {};

for (const rawStudentId in scores) {
  const studentId = idMap[rawStudentId] || rawStudentId;
  const score = scores[rawStudentId];
  const absentCount = Math.floor(score);
  const leaveCount = score % 1 === 0.5 ? 1 : 0;
  
  const student = studentsData.find(s => s.id === studentId);
  if (!student) {
    console.log('Student not found:', studentId);
    continue;
  }
  const room = student.room;
  let roomKey = room;
  // match how room is handled in the app
  roomKey = room.replace(/^ม\.?\s*/, '').trim();
  
  // hardcoded from user request
  const roomDays = {
    '1': 4, // Thu
    '2': 5, // Fri
    '3': 5, // Fri
    '4': 5, // Fri
    '5': 1, // Mon
    '6': 3, // Wed
    '7': 1, // Mon
    '8': 5  // Fri
  };
  
  const classDay = roomDays[roomKey];
  
  if (classDay === undefined) {
    console.log('No hardcoded schedule for room:', roomKey);
    continue;
  }
  
  if (!pastDatesByRoom[roomKey]) {
    const dates = [];
    let d = new Date(startOfSemester);
    d.setHours(12, 0, 0, 0); // Set to noon to avoid UTC offset jumping to previous day
    while (d <= todayDate) {
      if (d.getDay() === classDay) {
        dates.push(new Date(d));
      }
      d.setDate(d.getDate() + 1);
    }
    pastDatesByRoom[roomKey] = dates;
  }
  
  const classDates = [...pastDatesByRoom[roomKey]];
  if (classDates.length < absentCount + leaveCount) {
    console.log(`Not enough class dates for student ${studentId}: requested ${absentCount + leaveCount}, available ${classDates.length}`);
    continue;
  }
  
  // Clean existing attendance for this student up to today
  for (let i = attendances.length - 1; i >= 0; i--) {
    if (attendances[i].studentId === studentId) {
      const attDate = new Date(attendances[i].timestamp);
      if (attDate <= todayDate) {
         attendances.splice(i, 1);
      }
    }
  }
  
  // Randomly pick dates for absent and leave
  // Shuffle classDates
  for (let i = classDates.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [classDates[i], classDates[j]] = [classDates[j], classDates[i]];
  }
  
  const absentDates = classDates.slice(0, absentCount);
  const leaveDates = classDates.slice(absentCount, absentCount + leaveCount);
  const presentDates = classDates.slice(absentCount + leaveCount);
  
  // Add leave records
  leaveDates.forEach(d => {
    attendances.push({
      id: crypto.randomUUID(),
      studentId: studentId,
      type: 'leave',
      reason: 'ลา (ใส่ย้อนหลังโดยระบบ)',
      timestamp: `${d.toISOString().split('T')[0]}T08:00:00.000Z`,
      status: 'approved',
      isOk: null,
      createdAt: new Date().toISOString()
    });
  });
  
  // Add present records
  presentDates.forEach(d => {
    attendances.push({
      id: crypto.randomUUID(),
      studentId: studentId,
      type: 'present',
      timestamp: `${d.toISOString().split('T')[0]}T08:00:00.000Z`,
      isOk: true,
      distance: 0,
      createdAt: new Date().toISOString()
    });
  });
}

fs.writeFileSync('data/attendances.json', JSON.stringify(attendances, null, 2));
console.log('Done generating attendances!');
