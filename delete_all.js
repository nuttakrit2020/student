const fs = require('fs');
async function run() {
    console.log("Fetching all...");
    const res = await fetch('https://student-fawn-nine.vercel.app/api/attendance?adminKey=admin2569');
    const data = await res.json();
    console.log("Total to delete:", data.length);
    
    let deleted = 0;
    const batchSize = 30; // 30 concurrent is fast
    for (let i = 0; i < data.length; i += batchSize) {
        const batch = data.slice(i, i + batchSize);
        await Promise.all(batch.map(async (a) => {
            try {
                await fetch(`https://student-fawn-nine.vercel.app/api/attendance?id=${a.id}&adminKey=admin2569`, { method: 'DELETE' });
                deleted++;
            } catch (e) {
                console.error("Failed", a.id);
            }
        }));
        console.log(`Deleted ${deleted} / ${data.length}`);
    }
    console.log("Done deleting!");
    
    // Now trigger generate-fake
    console.log("Triggering generate-fake...");
    const res2 = await fetch('https://student-fawn-nine.vercel.app/api/generate-fake', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminKey: 'admin2569' })
    });
    console.log(await res2.json());
}
run();
