import { NextResponse } from 'next/server';
import { addAttendance, getAttendances, deleteAttendance, getSettings } from '@/lib/data';

// Haversine distance in meters
function calculateDistance(lat1, lon1, lat2, lon2) {
  if (!lat1 || !lon1 || !lat2 || !lon2) return null;
  const R = 6371e3; // metres
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

  return Math.round(R * c);
}
export async function POST(request) {
  try {
    const { studentId, lat, lng, photo, timestamp } = await request.json();
    
    if (!studentId || !photo || !timestamp) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Calculate distance if target is set
    const settings = await getSettings();
    let distance = null;
    let isOk = null;
    if (settings && settings.targetLat && settings.targetLng) {
      distance = calculateDistance(settings.targetLat, settings.targetLng, lat, lng);
      if (distance !== null) {
        isOk = distance <= 50;
      }
    }

    const attendance = {
      id: crypto.randomUUID(),
      studentId,
      lat,
      lng,
      distance,
      isOk,
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

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const adminKey = searchParams.get('adminKey');
    const id = searchParams.get('id');

    if (adminKey !== 'admin2569') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    if (!id) {
      return NextResponse.json({ error: 'Missing attendance ID' }, { status: 400 });
    }

    await deleteAttendance(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting attendance:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
