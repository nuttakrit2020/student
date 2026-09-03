// Script to fix all attendance data
// Step 1: Delete all existing attendance records (via REST API in parallel batches)
// Step 2: Call generate-fake per room

const BASE = 'https://student-fawn-nine.vercel.app';

async function run() {
    console.log('=== STEP 1: DELETE ALL EXISTING ATTENDANCE RECORDS ===');
    
    const allRes = await fetch(`${BASE}/api/attendance?adminKey=admin2569`);
    const allData = await allRes.json();
    console.log(`Found ${allData.length} records to delete`);
    
    // Delete in parallel batches of 50
    for (let i = 0; i < allData.length; i += 50) {
        const batch = allData.slice(i, i + 50);
        await Promise.all(batch.map(a => 
            fetch(`${BASE}/api/attendance?id=${a.id}&adminKey=admin2569`, { method: 'DELETE' })
        ));
        console.log(`Deleted ${Math.min(i + 50, allData.length)} / ${allData.length}`);
    }
    
    console.log('All records deleted!');
    
    // Verify
    const verifyRes = await fetch(`${BASE}/api/attendance?adminKey=admin2569`);
    const verifyData = await verifyRes.json();
    console.log(`Verification: ${verifyData.length} records remaining`);
    
    console.log('\n=== STEP 2: GENERATE FAKE DATA PER ROOM ===');
    
    const rooms = ['3/1', '3/2', '3/3', '3/4', '3/5', '3/6', '3/7', '3/8'];
    
    for (const room of rooms) {
        console.log(`Generating for room ${room}...`);
        const start = Date.now();
        try {
            const res = await fetch(`${BASE}/api/generate-fake`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ adminKey: 'admin2569', targetRoomKey: room })
            });
            const data = await res.json();
            console.log(`  Room ${room}: ${JSON.stringify(data)} (${Date.now() - start}ms)`);
        } catch (err) {
            console.error(`  Room ${room} ERROR: ${err.message}`);
        }
    }
    
    // Final verification
    console.log('\n=== STEP 3: VERIFY ===');
    const finalRes = await fetch(`${BASE}/api/attendance?adminKey=admin2569`);
    const finalData = await finalRes.json();
    console.log(`Total records: ${finalData.length}`);
    
    // Check a few students from room 3/4
    const checkIds = ['15296', '15298', '15299', '15300', '15301', '15302', '15303'];
    for (const sid of checkIds) {
        const recs = finalData.filter(r => r.studentId === sid);
        const present = recs.filter(r => r.type === 'present').length;
        const leave = recs.filter(r => r.type === 'leave').length;
        const absent = 15 - present - leave; // 15 Fridays for room 3/4
        console.log(`  Student ${sid}: ${recs.length} records, present=${present}, leave=${leave}`);
    }
    
    console.log('\nDONE!');
}

run();
