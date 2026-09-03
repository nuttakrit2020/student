import { NextResponse } from 'next/server';
import { getAttendances, deleteAttendancesBatch } from '@/lib/data';

export const maxDuration = 60; // Allow up to 60 seconds

export async function POST(request) {
  try {
    const { adminKey } = await request.json();
    if (adminKey !== 'admin2569') return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

    const allAtt = await getAttendances();
    if (allAtt.length > 0) {
      const allIds = allAtt.map(a => a.id);
      await deleteAttendancesBatch(allIds);
    }
    
    return NextResponse.json({ success: true, message: `Deleted ${allAtt.length} records.` });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
