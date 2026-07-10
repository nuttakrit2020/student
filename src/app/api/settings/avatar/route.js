import { NextResponse } from 'next/server';
import { updateSettings } from '@/lib/data';
import fs from 'fs';
import path from 'path';

export async function POST(request) {
  try {
    const formData = await request.formData();
    const adminKey = formData.get('adminKey');
    const file = formData.get('avatar');

    if (adminKey !== 'admin2569') {
      return NextResponse.json({ error: 'ไม่มีสิทธิ์เข้าถึง' }, { status: 403 });
    }

    if (!file || !file.name) {
      return NextResponse.json({ error: 'ไม่พบไฟล์รูปภาพ' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    const uploadDir = path.join(process.cwd(), 'public', 'avatars');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const ext = file.name.split('.').pop() || 'jpg';
    const fileName = `admin-${Date.now()}.${ext}`;
    const filePath = path.join(uploadDir, fileName);

    fs.writeFileSync(filePath, buffer);
    const avatarUrl = `/avatars/${fileName}`;

    const updatedSettings = await updateSettings({ adminAvatarUrl: avatarUrl });
    
    return NextResponse.json({ settings: updatedSettings });
  } catch (error) {
    console.error('Error updating admin avatar:', error);
    return NextResponse.json(
      { error: 'ไม่สามารถอัปเดตข้อมูลได้' },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';
