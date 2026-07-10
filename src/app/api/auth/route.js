import { NextResponse } from 'next/server';
import { getStudentById } from '@/lib/data';

export async function POST(request) {
  try {
    const { studentId } = await request.json();

    if (!studentId || studentId.length !== 5) {
      return NextResponse.json(
        { error: 'กรุณากรอกรหัสนักเรียน 5 หลัก' },
        { status: 400 }
      );
    }

    const student = await getStudentById(studentId);

    if (!student) {
      return NextResponse.json(
        { error: 'ไม่พบรหัสนักเรียนนี้ในระบบ' },
        { status: 404 }
      );
    }

    return NextResponse.json({ student });
  } catch (error) {
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาด กรุณาลองใหม่' },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';
