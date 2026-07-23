import { NextResponse } from 'next/server';
import { addAttendance, getAttendances } from '@/lib/data';
export async function POST(request) {
  try {
    const { studentId, lat, lng, photo, timestamp } = await request.json();
    
    if (!studentId || !photo || !timestamp) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const attendance = {
      id: crypto.randomUUID(),
      studentId,
      lat,
      lng,
      photo,
      timestamp,
      createdAt: new Date().toISOString()
    };

    const newAttendance = await addAttendance(attendance);
    return NextResponse.json(newAttendance);
  } catch (error) {
    console.error('Error saving attendance:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const adminKey = searchParams.get('adminKey');

    // Simple security check (use real env var checking in production)
    if (adminKey !== 'admin2569') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const attendances = await getAttendances();
    // Sort by most recent first
    attendances.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    return NextResponse.json(attendances);
  } catch (error) {
    console.error('Error fetching attendances:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
