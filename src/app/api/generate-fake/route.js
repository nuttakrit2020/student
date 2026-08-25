import { NextResponse } from 'next/server';
import { getSubjects, addAttendance, getAttendances, deleteAttendance } from '@/lib/data';
import Papa from 'papaparse';

export async function POST(request) {
  try {
    const { adminKey } = await request.json();
    if (adminKey !== 'admin2569') return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

    const subjects = await getSubjects();
    if (!subjects.length) return NextResponse.json({ error: 'No subjects found' });

    let totalCreated = 0;

    // CLEAR ALL EXISTING ATTENDANCES FAST
    const allAtt = await getAttendances();
    // Do it in chunks of 50 to avoid maxing out connections but keep it fast
    for (let i = 0; i < allAtt.length; i += 50) {
        const chunk = allAtt.slice(i, i + 50);
        await Promise.all(chunk.map(a => deleteAttendance(a.id)));
    }

    const today = new Date();
    today.setHours(0,0,0,0);
    const startDate = new Date('2026-05-18T00:00:00+07:00');

    for (const subject of subjects) {
        if (!subject.googleSheetUrls) continue;

        // Determine class days for this subject
        const classDays = [];
        if (subject.classSchedules && subject.classSchedules.length > 0) {
            subject.classSchedules.forEach(sched => {
                if (!classDays.includes(sched.day)) {
                    classDays.push(sched.day);
                }
            });
        }

        // Generate a list of all past valid class dates
        const validDates = [];
        let currDate = new Date(startDate);
        while (currDate < today) {
            if (classDays.length === 0 || classDays.includes(currDate.getDay())) {
                validDates.push(new Date(currDate).toISOString());
            }
            currDate.setDate(currDate.getDate() + 1);
        }

        for (const [roomKey, sheetUrl] of Object.entries(subject.googleSheetUrls)) {
            
            const match = sheetUrl.match(/\/d\/([a-zA-Z0-9-_]+)/);
            if (!match || !match[1]) continue;
            
            const sheetId = match[1];
            const gidMatch = sheetUrl.match(/[#&]gid=([0-9]+)/);
            const gid = gidMatch ? gidMatch[1] : '0';

            const csvUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=${gid}`;
            
            let csvData;
            try {
                const response = await fetch(csvUrl, { headers: { 'User-Agent': 'Mozilla/5.0' }});
                if (!response.ok) {
                    const tqUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&gid=${gid}`;
                    const tqResponse = await fetch(tqUrl);
                    if (!tqResponse.ok) continue;
                    csvData = await tqResponse.text();
                } else {
                    csvData = await response.text();
                }
            } catch (err) {
                continue;
            }

            if (csvData.trim().startsWith('<!DOCTYPE html>') || csvData.trim().startsWith('<html')) continue;

            const parsed = Papa.parse(csvData, { header: true, skipEmptyLines: true });
            const sheetData = parsed.data;

            for (const row of sheetData) {
                const studentIdVal = Object.values(row).find(v => v && String(v).length >= 4 && !isNaN(parseInt(v)));
                if (!studentIdVal) continue;
                const studentId = String(studentIdVal).trim();

                const rawKhad = row['ขาด'] || '0';
                const khadNum = parseFloat(rawKhad);
                
                let numLa = 0;
                let numKhad = 0;

                if (khadNum === 0.5) numLa = 1;
                else if (khadNum > 0 && khadNum % 1 === 0) numKhad = khadNum;
                else if (khadNum > 0) {
                    numKhad = Math.floor(khadNum);
                    numLa = (khadNum - numKhad) === 0.5 ? 1 : 0;
                }

                // Make a copy of valid dates and shuffle
                const studentDates = [...validDates];
                for (let i = studentDates.length - 1; i > 0; i--) {
                    const j = Math.floor(Math.random() * (i + 1));
                    [studentDates[i], studentDates[j]] = [studentDates[j], studentDates[i]];
                }

                let datesIdx = 0;
                
                // Skip numKhad
                datesIdx += numKhad;

                // Create leave records
                const pendingAtts = [];
                for (let i = 0; i < numLa && datesIdx < studentDates.length; i++) {
                    pendingAtts.push(addAttendance({
                        id: crypto.randomUUID(),
                        studentId,
                        subjectId: subject.id,
                        type: 'leave',
                        reason: 'ลากิจ/ลาป่วย',
                        lat: null, lng: null, distance: null,
                        isOk: null,
                        status: 'approved',
                        photo: '',
                        timestamp: studentDates[datesIdx],
                        createdAt: studentDates[datesIdx]
                    }));
                    totalCreated++;
                    datesIdx++;
                }

                // Create present records
                while (datesIdx < studentDates.length) {
                    pendingAtts.push(addAttendance({
                        id: crypto.randomUUID(),
                        studentId,
                        subjectId: subject.id,
                        type: 'present',
                        reason: '',
                        lat: null, lng: null, distance: null,
                        isOk: true, // GREEN
                        status: 'approved',
                        photo: '',
                        timestamp: studentDates[datesIdx],
                        createdAt: studentDates[datesIdx]
                    }));
                    totalCreated++;
                    datesIdx++;
                }

                // Wait for all records of this student to be added before moving to next (avoids overloading)
                await Promise.all(pendingAtts);
            }
        }
    }

    return NextResponse.json({ success: true, message: `Created ${totalCreated} fake attendance records!` });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
