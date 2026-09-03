const BASE = 'https://student-fawn-nine.vercel.app';

async function run() {
    console.log('=== STEP 1: DELETE ALL ATTENDANCES VIA API ===');
    const startDel = Date.now();
    try {
        const delRes = await fetch(`${BASE}/api/delete-attendances`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ adminKey: 'admin2569' })
        });
        const delData = await delRes.json();
        console.log('Delete result:', delData, `(${Date.now() - startDel}ms)`);
    } catch (err) {
        console.error('Delete error:', err);
        return;
    }

    console.log('\n=== STEP 2: GENERATE FAKE DATA PER ROOM ===');
    const rooms = ['3/1', '3/2', '3/3', '3/4', '3/5', '3/6', '3/7', '3/8'];
    for (const room of rooms) {
        console.log(`Generating room ${room}...`);
        const startGen = Date.now();
        try {
            const genRes = await fetch(`${BASE}/api/generate-fake`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ adminKey: 'admin2569', targetRoomKey: room })
            });
            const genData = await genRes.json();
            console.log(`Room ${room} result:`, genData, `(${Date.now() - startGen}ms)`);
        } catch (err) {
            console.error(`Room ${room} error:`, err);
        }
    }

    console.log('\n=== STEP 3: VERIFY ATTENDANCES ===');
    const checkRes = await fetch(`${BASE}/api/attendance?adminKey=admin2569`);
    const checkData = await checkRes.json();
    console.log(`Total attendance records now: ${checkData.length}`);

    // Inspect Room 3/4 students
    console.log('\n--- Sample Check Room 3/4 ---');
    const sampleIds = ['15296', '15298', '15299', '15300', '15301', '15302', '15303', '15309'];
    for (const sid of sampleIds) {
        const studentRecords = checkData.filter(r => r.studentId === sid);
        const present = studentRecords.filter(r => r.type === 'present').length;
        const leave = studentRecords.filter(r => r.type === 'leave').length;
        console.log(`Student ${sid}: totalRecords=${studentRecords.length}, present=${present}, leave=${leave}`);
    }
}

run();
