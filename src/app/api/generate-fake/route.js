import { NextResponse } from 'next/server';
import { getSubjects, addAttendancesBatch, deleteAttendancesBatch, getSettings, getAttendances } from '@/lib/data';
import Papa from 'papaparse';

export const maxDuration = 60;

export async function POST(request) {
  try {
    const { adminKey, targetRoomKey } = await request.json();
    if (adminKey !== 'admin2569') return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

    const subjects = await getSubjects();
    if (!subjects.length) return NextResponse.json({ error: 'No subjects found' });

    let totalCreated = 0;

    const settings = await getSettings();
    const holidays = settings?.holidays || [];

    const today = new Date();
    today.setHours(0,0,0,0);
    const startDate = new Date('2026-05-18T00:00:00+07:00');

    // Fetch existing attendances once
    const allAtt = await getAttendances();

    for (const subject of subjects) {
        if (!subject.googleSheetUrls) continue;

        for (const [roomKey, sheetUrl] of Object.entries(subject.googleSheetUrls)) {
            const cleanedRoomKey = roomKey.replace(/^ม\.?\s*/, '').trim();
            if (targetRoomKey) {
                const cleanedTarget = targetRoomKey.replace(/^ม\.?\s*/, '').trim();
                if (cleanedRoomKey !== cleanedTarget) continue;
            }

            // Find class days specific to this room
            const roomDays = [];
            if (subject.classSchedules) {
                subject.classSchedules.forEach(sched => {
                   const cleanedSchedRoom = (sched.room || '').replace(/^ม\.?\s*/, '').trim();
                   if (cleanedRoomKey === cleanedSchedRoom || sched.room === roomKey) {
                       roomDays.push(sched.day);
                   }
                });
            }

            // Generate a list of all past valid class dates FOR THIS ROOM
            const validDates = [];
            let currDate = new Date(startDate);
            while (currDate < today) {
                const dateStrIso = `${currDate.getFullYear()}-${String(currDate.getMonth() + 1).padStart(2, '0')}-${String(currDate.getDate()).padStart(2, '0')}`;
                if (roomDays.length === 0 || roomDays.includes(currDate.getDay())) {
                    if (!holidays.includes(dateStrIso)) {
                        validDates.push(dateStrIso);
                    }
                }
                currDate.setDate(currDate.getDate() + 1);
            }
            
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

            const roomStudentIds = new Set();
            const toSave = [];
            const toDeleteDocIds = [];

            for (const row of sheetData) {
                const studentIdVal = Object.values(row).find(v => v && String(v).length >= 4 && !isNaN(parseInt(v)));
                if (!studentIdVal) continue;
                const studentId = String(studentIdVal).trim();
                roomStudentIds.add(studentId);

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

                let idx = 0;
                
                // 1. Absent dates (delete deterministic doc)
                for (let i = 0; i < numKhad && idx < studentDates.length; i++) {
                    const dateIso = studentDates[idx];
                    const docId = `fake_${subject.id}_${studentId}_${dateIso}`;
                    toDeleteDocIds.push(docId);
                    idx++;
                }

                // 2. Leave dates
                for (let i = 0; i < numLa && idx < studentDates.length; i++) {
                    const dateIso = studentDates[idx];
                    const docId = `fake_${subject.id}_${studentId}_${dateIso}`;
                    const timestamp = `${dateIso}T08:00:00+07:00`;
                    toSave.push({
                        id: docId,
                        studentId,
                        subjectId: subject.id,
                        type: 'leave',
                        reason: 'ลากิจ/ลาป่วย',
                        lat: null, lng: null, distance: null,
                        isOk: null,
                        status: 'approved',
                        photo: '',
                        timestamp,
                        createdAt: timestamp
                    });
                    totalCreated++;
                    idx++;
                }

                // 3. Present dates
                while (idx < studentDates.length) {
                    const dateIso = studentDates[idx];
                    const docId = `fake_${subject.id}_${studentId}_${dateIso}`;
                    const timestamp = `${dateIso}T08:00:00+07:00`;
                    toSave.push({
                        id: docId,
                        studentId,
                        subjectId: subject.id,
                        type: 'present',
                        reason: '',
                        lat: null, lng: null, distance: null,
                        isOk: true,
                        status: 'approved',
                        photo: '',
                        timestamp,
                        createdAt: timestamp
                    });
                    totalCreated++;
                    idx++;
                }
            }

            // Also delete any existing old non-deterministic attendances for these students
            const oldRoomAttIds = allAtt.filter(a => roomStudentIds.has(a.studentId) && !a.id.startsWith('fake_')).map(a => a.id);
            const allDeleteIds = [...oldRoomAttIds, ...toDeleteDocIds];

            if (allDeleteIds.length > 0) {
                await deleteAttendancesBatch(allDeleteIds);
            }

            if (toSave.length > 0) {
                await addAttendancesBatch(toSave);
            }
        }
    }

    return NextResponse.json({ success: true, message: `Created ${totalCreated} fake attendance records!` });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
