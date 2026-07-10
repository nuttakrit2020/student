import { NextResponse } from 'next/server';
import { getAssignments, addAssignment, deleteAssignment, updateAssignment } from '@/lib/data';

export async function GET() {
  try {
    const assignments = await getAssignments();
    return NextResponse.json({ assignments });
  } catch (error) {
    return NextResponse.json(
      { error: 'ไม่สามารถดึงข้อมูลงานได้' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { title, description, deadline, maxScore, worksheetUrl, adminKey } = body;

    if (adminKey !== 'admin2569') {
      return NextResponse.json(
        { error: 'ไม่มีสิทธิ์เข้าถึง' },
        { status: 403 }
      );
    }

    if (!title) {
      return NextResponse.json(
        { error: 'กรุณาระบุชื่องาน' },
        { status: 400 }
      );
    }

    const newAssignment = await addAssignment({
      title,
      description: description || '',
      deadline: deadline || '',
      maxScore: maxScore || 10,
      worksheetUrl: worksheetUrl || '',
    });

    return NextResponse.json({ assignment: newAssignment }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: 'ไม่สามารถเพิ่มงานได้' },
      { status: 500 }
    );
  }
}

export async function PATCH(request) {
  try {
    const body = await request.json();
    const { id, title, description, deadline, maxScore, worksheetUrl, adminKey } = body;

    if (adminKey !== 'admin2569') {
      return NextResponse.json(
        { error: 'ไม่มีสิทธิ์เข้าถึง' },
        { status: 403 }
      );
    }

    if (!id) {
      return NextResponse.json(
        { error: 'กรุณาระบุ ID งาน' },
        { status: 400 }
      );
    }

    const updates = {};
    if (title !== undefined) updates.title = title;
    if (description !== undefined) updates.description = description;
    if (deadline !== undefined) updates.deadline = deadline;
    if (maxScore !== undefined) updates.maxScore = maxScore;
    if (worksheetUrl !== undefined) updates.worksheetUrl = worksheetUrl;

    const updated = await updateAssignment(id, updates);
    if (!updated) {
      return NextResponse.json(
        { error: 'ไม่พบงานนี้' },
        { status: 404 }
      );
    }

    return NextResponse.json({ assignment: updated });
  } catch (error) {
    return NextResponse.json(
      { error: 'ไม่สามารถแก้ไขงานได้' },
      { status: 500 }
    );
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const adminKey = searchParams.get('adminKey');

    if (adminKey !== 'admin2569') {
      return NextResponse.json(
        { error: 'ไม่มีสิทธิ์เข้าถึง' },
        { status: 403 }
      );
    }

    if (!id) {
      return NextResponse.json(
        { error: 'กรุณาระบุ ID งาน' },
        { status: 400 }
      );
    }

    await deleteAssignment(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: 'ไม่สามารถลบงานได้' },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';
