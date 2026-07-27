import { NextResponse } from 'next/server';
import { addAttendance, getAttendances, deleteAttendance, updateAttendance, getSettings, getSubjectById } from '@/lib/data';

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
    const data = await request.json();
    const { studentId, subjectId, lat, lng, photo, timestamp, type, reason, adminKey } = data;
    
    // Admin can create manual records
    if (adminKey === 'admin2569') {
      const attendance = {
        id: crypto.randomUUID(),
        studentId,
        subjectId,
        type: type || 'present',
        reason: reason || '',
        lat: lat || null,
        lng: lng || null,
        distance: null,
        isOk: type === 'leave' ? null : true, // manual present is always ok
        status: 'approved', // Admin creates are auto-approved
        photo: photo || '',
        timestamp: timestamp || new Date().toISOString(),
        createdAt: timestamp || new Date().toISOString()
      };
      const newAttendance = await addAttendance(attendance);
      return NextResponse.json(newAttendance);
    }
    
    if (!studentId || !timestamp || !subjectId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const isLeave = type === 'leave';

    if (!isLeave && !photo) {
      return NextResponse.json({ error: 'Missing photo for check-in' }, { status: 400 });
    }

    let distance = null;
    let isOk = null;

    if (!isLeave) {
      // Calculate distance if target is set
      const subject = await getSubjectById(subjectId);
      if (subject && subject.targetLat && subject.targetLng && lat && lng) {
        distance = calculateDistance(subject.targetLat, subject.targetLng, lat, lng);
        if (distance !== null) {
          isOk = distance <= 8;
        }
      }
    }

    const attendance = {
      id: crypto.randomUUID(),
      studentId,
      subjectId,
      type: type || 'present', // 'present' or 'leave'
      reason: reason || '',
      lat: lat || null,
      lng: lng || null,
      distance,
      isOk,
      status: isLeave ? 'pending' : 'approved',
      photo: photo || '',
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
    const studentId = searchParams.get('studentId');
    const subjectId = searchParams.get('subjectId');

    // Simple security check (use real env var checking in production)
    if (!studentId && adminKey !== 'admin2569') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const attendances = await getAttendances(subjectId);
    
    if (studentId) {
      const studentAtt = attendances.filter(a => a.studentId === studentId);
      return NextResponse.json(studentAtt);
    }
    
    return NextResponse.json(attendances);
  } catch (error) {
    console.error('Error fetching attendances:', error);
    return NextResponse.json({ error: 'Failed to fetch attendance' }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const adminKey = searchParams.get('adminKey');

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
    return NextResponse.json({ error: 'Failed to delete attendance' }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const data = await request.json();
    const { adminKey, id, updates } = data;

    if (adminKey !== 'admin2569') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    if (!id || !updates) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const updated = await updateAttendance(id, updates);
    if (!updated) {
      return NextResponse.json({ error: 'Attendance record not found' }, { status: 404 });
    }
    
    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating attendance:', error);
    return NextResponse.json({ error: 'Failed to update attendance' }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
