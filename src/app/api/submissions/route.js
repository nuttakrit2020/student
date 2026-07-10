import { NextResponse } from 'next/server';
import { getSubmissionsByStudent, markSubmission } from '@/lib/data';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('studentId');

    if (!studentId) {
      return NextResponse.json(
        { error: 'กรุณาระบุรหัสนักเรียน' },
        { status: 400 }
      );
    }

    const submissions = await getSubmissionsByStudent(studentId);
    return NextResponse.json({ submissions });
  } catch (error) {
    return NextResponse.json(
      { error: 'ไม่สามารถดึงข้อมูลได้' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { studentId, assignmentId, submitted, score, adminKey } = body;

    if (adminKey !== 'admin2569') {
      return NextResponse.json(
        { error: 'ไม่มีสิทธิ์เข้าถึง' },
        { status: 403 }
      );
    }

    if (!studentId || !assignmentId) {
      return NextResponse.json(
        { error: 'กรุณาระบุรหัสนักเรียนและรหัสงาน' },
        { status: 400 }
      );
    }

    await markSubmission(studentId, assignmentId, submitted, score);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Mark submission error:', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการบันทึกข้อมูล' },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';
