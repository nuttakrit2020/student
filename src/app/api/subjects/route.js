import { NextResponse } from 'next/server';
import { getSubjects, getSubjectById, addSubject, updateSubject, deleteSubject, ensureDefaultSubject } from '@/lib/data';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  try {
    // Ensure we always have at least one default subject during migration
    await ensureDefaultSubject();

    if (id) {
      const subject = await getSubjectById(id);
      if (!subject) return NextResponse.json({ error: 'ไม่พบรายวิชา' }, { status: 404 });
      return NextResponse.json(subject);
    } else {
      const subjects = await getSubjects();
      return NextResponse.json(subjects);
    }
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch subjects' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const data = await request.json();
    
    // Simple admin auth check
    if (!data.adminKey || data.adminKey !== 'admin2569') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const newSubject = await addSubject(data.subject);
    return NextResponse.json(newSubject);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create subject' }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const data = await request.json();
    
    if (!data.adminKey || data.adminKey !== 'admin2569') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const updated = await updateSubject(data.id, data.updates);
    if (!updated) return NextResponse.json({ error: 'ไม่พบรายวิชา' }, { status: 404 });
    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update subject' }, { status: 500 });
  }
}

export async function DELETE(request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  const adminKey = searchParams.get('adminKey');

  if (!adminKey || adminKey !== 'admin2569') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await deleteSubject(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete subject' }, { status: 500 });
  }
}
