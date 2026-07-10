import { NextResponse } from 'next/server';
import { getSubmissionSummary, getSettings } from '@/lib/data';

export async function POST(request) {
  try {
    const { adminKey } = await request.json();

    if (adminKey !== 'admin2569') {
      return NextResponse.json(
        { error: 'รหัสผ่านไม่ถูกต้อง' },
        { status: 403 }
      );
    }

    const summary = await getSubmissionSummary();
    const settings = await getSettings();
    return NextResponse.json({ ...summary, settings });
  } catch (error) {
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาด' },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';
