import { NextResponse } from 'next/server';
import { getStudentById, updateStudent } from '@/lib/data';
import fs from 'fs';
import path from 'path';

export async function POST(request) {
  try {
    const formData = await request.formData();
    const studentId = formData.get('studentId');
    const nickname = formData.get('nickname');
    const file = formData.get('avatar');

    if (!studentId) {
      return NextResponse.json({ error: 'กรุณาระบุรหัสนักเรียน' }, { status: 400 });
    }

    const student = await getStudentById(studentId);
    if (!student) {
      return NextResponse.json({ error: 'ไม่พบนักเรียน' }, { status: 404 });
    }

    const updates = {};
    if (nickname) {
      updates.nickname = nickname;
    }

    if (file && file.name) {
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      
      const uploadDir = path.join(process.cwd(), 'public', 'avatars');
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      // file extension
      const ext = file.name.split('.').pop() || 'jpg';
      const fileName = `${studentId}-${Date.now()}.${ext}`;
      const filePath = path.join(uploadDir, fileName);

      fs.writeFileSync(filePath, buffer);
      updates.avatarUrl = `/avatars/${fileName}`;
    }

    const updatedStudent = await updateStudent(studentId, updates);
    return NextResponse.json({ student: updatedStudent });

  } catch (error) {
    console.error('Error updating student:', error);
    return NextResponse.json(
      { error: 'ไม่สามารถอัปเดตข้อมูลได้' },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';
