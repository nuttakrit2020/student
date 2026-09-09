import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, writeBatch } from 'firebase/firestore';

export async function POST(request) {
  try {
    const { adminKey, toSave, toDeleteIds } = await request.json();
    if (adminKey !== 'admin2569') return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

    const batchPromises = [];

    // Delete absent doc IDs
    if (toDeleteIds && toDeleteIds.length > 0) {
      for (let i = 0; i < toDeleteIds.length; i += 100) {
        const chunk = toDeleteIds.slice(i, i + 100);
        const b = writeBatch(db);
        chunk.forEach(id => b.delete(doc(db, 'attendances', id)));
        batchPromises.push(b.commit());
      }
    }

    // Save present/leave records
    if (toSave && toSave.length > 0) {
      for (let i = 0; i < toSave.length; i += 100) {
        const chunk = toSave.slice(i, i + 100);
        const b = writeBatch(db);
        chunk.forEach(item => b.set(doc(db, 'attendances', item.id), item));
        batchPromises.push(b.commit());
      }
    }

    await Promise.all(batchPromises);

    return NextResponse.json({ success: true, saved: (toSave || []).length, deleted: (toDeleteIds || []).length });
  } catch (err) {
    console.error('write-fake-batch error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
