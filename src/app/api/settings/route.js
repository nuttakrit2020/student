import { NextResponse } from 'next/server';
import { getSettings, updateSettings } from '@/lib/data';

export async function GET() {
  try {
    const settings = await getSettings();
    return NextResponse.json({ settings });
  } catch (error) {
    return NextResponse.json(
      { error: 'ไม่สามารถดึงข้อมูลการตั้งค่าได้' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { subjectId, subjectName, className, adminKey, qrCode, adminAvatarUrl, targetLat, targetLng, targetRoomName, classSchedules } = body;

    if (adminKey !== 'admin2569') {
      return NextResponse.json({ error: 'ไม่มีสิทธิ์เข้าถึง' }, { status: 403 });
    }

    const globalUpdates = {};
    if (qrCode !== undefined) globalUpdates.qrCode = qrCode;
    if (adminAvatarUrl !== undefined) globalUpdates.adminAvatarUrl = adminAvatarUrl;
    
    // Always update global settings
    const newSettings = await updateSettings(globalUpdates);

    // Update subject settings if subjectId is provided
    if (subjectId) {
      const { updateSubject } = await import('@/lib/data');
      const subjectUpdates = {};
      if (subjectName !== undefined) subjectUpdates.name = subjectName;
      if (className !== undefined) subjectUpdates.className = className;
      if (targetLat !== undefined) subjectUpdates.targetLat = targetLat;
      if (targetLng !== undefined) subjectUpdates.targetLng = targetLng;
      if (targetRoomName !== undefined) subjectUpdates.targetRoomName = targetRoomName;
      if (classSchedules !== undefined) subjectUpdates.classSchedules = classSchedules;
      if (body.googleSheetUrls !== undefined) subjectUpdates.googleSheetUrls = body.googleSheetUrls;
      
      await updateSubject(subjectId, subjectUpdates);
    }

    return NextResponse.json({ settings: newSettings });
  } catch (error) {
    return NextResponse.json({ error: 'ไม่สามารถบันทึกการตั้งค่าได้' }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
