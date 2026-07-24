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
    const { subjectName, className, adminKey, qrCode, adminAvatarUrl, targetLat, targetLng } = body;

    if (adminKey !== 'admin2569') {
      return NextResponse.json({ error: 'ไม่มีสิทธิ์เข้าถึง' }, { status: 403 });
    }

    const updates = {};
    if (subjectName !== undefined) updates.subjectName = subjectName;
    if (className !== undefined) updates.className = className;
    if (qrCode !== undefined) updates.qrCode = qrCode;
    if (adminAvatarUrl !== undefined) updates.adminAvatarUrl = adminAvatarUrl;
    if (targetLat !== undefined) updates.targetLat = targetLat;
    if (targetLng !== undefined) updates.targetLng = targetLng;
    if (body.classSchedules !== undefined) updates.classSchedules = body.classSchedules;

    const newSettings = await updateSettings(updates);
    return NextResponse.json({ settings: newSettings });
  } catch (error) {
    return NextResponse.json({ error: 'ไม่สามารถบันทึกการตั้งค่าได้' }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
