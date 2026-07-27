import { NextResponse } from 'next/server';
import { getSubmissionSummary, getSettings, getSubjects } from '@/lib/data';

export async function POST(request) {
  try {
    const { adminKey, subjectId } = await request.json();

    if (adminKey !== 'admin2569') {
      return NextResponse.json(
        { error: 'รหัสผ่านไม่ถูกต้อง' },
        { status: 403 }
      );
    }

    const summary = await getSubmissionSummary(subjectId);
    const settings = await getSettings();
    const subjects = await getSubjects();
    return NextResponse.json({ ...summary, settings, subjects });
  } catch (error) {
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาด' },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';
