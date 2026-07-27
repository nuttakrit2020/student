async function clean() {
  try {
    const res = await fetch('http://localhost:3000/api/subjects');
    const subjects = await res.json();
    for (const s of subjects) {
      if (!s.name && !s.className) {
        console.log('Deleting bad subject:', s.id);
        await fetch(`http://localhost:3000/api/subjects?id=${s.id}&adminKey=admin2569`, { method: 'DELETE' });
      }
    }
    console.log('Done cleaning bad subjects');
  } catch (err) {
    console.error(err);
  }
}
clean();
