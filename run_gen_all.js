// run_gen_all.js - Generate fake attendance for ALL 8 rooms via server APIs
const BASE = 'https://student-fawn-nine.vercel.app';

(async () => {
  console.log('=== FETCHING ADMIN DATA ===');
  const adminRes = await fetch(BASE + '/api/admin', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ adminKey: 'admin2569' })
  });
  const adminData = await adminRes.json();
  const sub = adminData.subjects[0];
  const settings = adminData.settings || {};
  const holidays = settings.holidays || [];
  
  console.log('Subject:', sub.id);
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const startDate = new Date('2026-05-18T00:00:00+07:00');

  const rooms = Object.keys(sub.googleSheetUrls || {});
  console.log('Rooms:', rooms.join(', '));

  for (const roomKey of rooms) {
    const cleanedRoomKey = roomKey.replace(/^ม\.?\s*/, '').trim();
    console.log(`\n--- Processing ${roomKey} (cleaned: ${cleanedRoomKey}) ---`);

    // Find class day for this room
    const roomDays = [];
    if (sub.classSchedules) {
      sub.classSchedules.forEach(sched => {
        const cleanedSchedRoom = (sched.room || '').replace(/^ม\.?\s*/, '').trim();
        if (cleanedRoomKey === cleanedSchedRoom || sched.room === roomKey) {
          roomDays.push(sched.day);
        }
      });
    }
    console.log('Class days:', roomDays);

    // Calculate valid dates
    const validDates = [];
    let currDate = new Date(startDate);
    while (currDate < today) {
      const y = currDate.getFullYear();
      const m = String(currDate.getMonth() + 1).padStart(2, '0');
      const d = String(currDate.getDate()).padStart(2, '0');
      const dateStrIso = `${y}-${m}-${d}`;
      if (roomDays.length === 0 || roomDays.includes(currDate.getDay())) {
        if (!holidays.includes(dateStrIso)) {
          validDates.push(dateStrIso);
        }
      }
      currDate.setDate(currDate.getDate() + 1);
    }
    console.log('Valid dates count:', validDates.length);

    // Parse sheet
    const sheetUrl = sub.googleSheetUrls[roomKey];
    const parseRes = await fetch(BASE + '/api/parse-sheet', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sheetUrl })
    });
    const parseData = await parseRes.json();
    if (!parseData.data) {
      console.log('SKIP: Failed to parse sheet');
      continue;
    }
    console.log('Students in sheet:', parseData.data.length);

    // Generate records
    const toSave = [];
    const toDeleteIds = [];

    for (const row of parseData.data) {
      const studentIdVal = Object.values(row).find(v => v && String(v).length >= 4 && !isNaN(parseInt(v)));
      if (!studentIdVal) continue;
      const studentId = String(studentIdVal).trim();

      const rawKhad = row['ขาด'] || '0';
      const khadNum = parseFloat(rawKhad);

      let numKhad = 0;
      let numLa = 0;
      if (khadNum > 0) {
        numKhad = Math.floor(khadNum);
        numLa = (khadNum % 1 >= 0.5) ? 1 : 0;
      }

      // Shuffle dates
      const studentDates = [...validDates];
      for (let i = studentDates.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [studentDates[i], studentDates[j]] = [studentDates[j], studentDates[i]];
      }

      let idx = 0;
      // Absent dates (delete doc)
      for (let i = 0; i < numKhad && idx < studentDates.length; i++) {
        toDeleteIds.push(`fake_${sub.id}_${studentId}_${studentDates[idx]}`);
        idx++;
      }
      // Leave dates
      for (let i = 0; i < numLa && idx < studentDates.length; i++) {
        const dateIso = studentDates[idx];
        toSave.push({
          id: `fake_${sub.id}_${studentId}_${dateIso}`,
          studentId, subjectId: sub.id,
          type: 'leave', reason: 'ลากิจ/ลาป่วย',
          lat: null, lng: null, distance: null, isOk: null,
          status: 'approved', photo: '',
          timestamp: `${dateIso}T08:00:00+07:00`,
          createdAt: `${dateIso}T08:00:00+07:00`
        });
        idx++;
      }
      // Present dates
      while (idx < studentDates.length) {
        const dateIso = studentDates[idx];
        toSave.push({
          id: `fake_${sub.id}_${studentId}_${dateIso}`,
          studentId, subjectId: sub.id,
          type: 'present', reason: '',
          lat: null, lng: null, distance: null, isOk: true,
          status: 'approved', photo: '',
          timestamp: `${dateIso}T08:00:00+07:00`,
          createdAt: `${dateIso}T08:00:00+07:00`
        });
        idx++;
      }

      // Log summary for this student
      const presentCount = studentDates.length - numKhad - numLa;
      if (['15194', '15200', '15326'].includes(studentId)) {
        console.log(`  Student ${studentId}: sheet=${rawKhad} -> khad=${numKhad} la=${numLa} present=${presentCount} total=${studentDates.length}`);
      }
    }

    console.log(`Records to save: ${toSave.length}, to delete: ${toDeleteIds.length}`);

    // Send in batches of 200
    const BATCH = 200;
    for (let i = 0; i < toSave.length; i += BATCH) {
      const chunk = toSave.slice(i, i + BATCH);
      const res = await fetch(BASE + '/api/write-fake-batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminKey: 'admin2569', toSave: chunk, toDeleteIds: [] })
      });
      const data = await res.json();
      console.log(`  Save batch ${Math.floor(i/BATCH)+1}: status=${res.status}`, JSON.stringify(data));
    }

    for (let i = 0; i < toDeleteIds.length; i += BATCH) {
      const chunk = toDeleteIds.slice(i, i + BATCH);
      const res = await fetch(BASE + '/api/write-fake-batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminKey: 'admin2569', toSave: [], toDeleteIds: chunk })
      });
      const data = await res.json();
      console.log(`  Delete batch ${Math.floor(i/BATCH)+1}: status=${res.status}`, JSON.stringify(data));
    }

    console.log(`✅ ${roomKey} done!`);
  }

  console.log('\n=== ALL ROOMS DONE ===');

  // Verify student 15194
  console.log('\n=== VERIFY STUDENT 15194 ===');
  const attRes = await fetch(BASE + '/api/attendance?subjectId=' + sub.id);
  const attData = await attRes.json();
  const recs = (attData.attendances || []).filter(a => a.studentId === '15194');
  const presentCount = recs.filter(a => a.type === 'present').length;
  const leaveCount = recs.filter(a => a.type === 'leave').length;
  console.log(`Student 15194: total records=${recs.length}, present=${presentCount}, leave=${leaveCount}`);
})().catch(e => console.error('FATAL:', e));
