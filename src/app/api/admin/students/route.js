import { NextResponse } from 'next/server';
import { getStudents, addStudent, updateStudent, deleteStudent, bulkAddStudents, bulkDeleteStudents } from '@/lib/data';

export async function GET(request) {
  try {
    const students = await getStudents();
    return NextResponse.json({ students });
  } catch (error) {
    return NextResponse.json({ error: 'ไม่สามารถดึงข้อมูลนักเรียนได้' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { action, student, students, adminKey } = body;

    if (adminKey !== 'admin2569') {
      return NextResponse.json({ error: 'ไม่มีสิทธิ์เข้าถึง' }, { status: 403 });
    }

    if (action === 'bulk') {
      if (!Array.isArray(students) || students.length === 0) {
        return NextResponse.json({ error: 'ไม่พบข้อมูลนักเรียนสำหรับเพิ่ม' }, { status: 400 });
      }
      const added = await bulkAddStudents(students);
      return NextResponse.json({ message: `เพิ่มสำเร็จ ${added.length} คน`, added }, { status: 201 });
    } else {
      if (!student || !student.id || !student.name) {
        return NextResponse.json({ error: 'ข้อมูลนักเรียนไม่ครบถ้วน' }, { status: 400 });
      }
      const newStudent = await addStudent(student);
      return NextResponse.json({ student: newStudent }, { status: 201 });
    }
  } catch (error) {
    return NextResponse.json({ error: error.message || 'เกิดข้อผิดพลาดในการเพิ่มนักเรียน' }, { status: 500 });
  }
}

export async function PATCH(request) {
  try {
    const body = await request.json();
    const { id, updates, adminKey } = body;

    if (adminKey !== 'admin2569') {
      return NextResponse.json({ error: 'ไม่มีสิทธิ์เข้าถึง' }, { status: 403 });
    }

    if (!id || !updates) {
      return NextResponse.json({ error: 'ข้อมูลไม่ครบถ้วน' }, { status: 400 });
    }

    const updated = await updateStudent(id, updates);
    if (!updated) {
      return NextResponse.json({ error: 'ไม่พบนักเรียนที่ต้องการแก้ไข' }, { status: 404 });
    }

    return NextResponse.json({ student: updated });
  } catch (error) {
    return NextResponse.json({ error: error.message || 'เกิดข้อผิดพลาดในการแก้ไขนักเรียน' }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const action = searchParams.get('action');
    const adminKey = searchParams.get('adminKey');

    if (adminKey !== 'admin2569') {
      return NextResponse.json({ error: 'ไม่มีสิทธิ์เข้าถึง' }, { status: 403 });
    }

    if (action === 'bulk') {
      const ids = searchParams.get('ids')?.split(',');
      if (!ids || ids.length === 0) {
        return NextResponse.json({ error: 'กรุณาระบุรหัสนักเรียน' }, { status: 400 });
      }
      await bulkDeleteStudents(ids);
      return NextResponse.json({ success: true, message: `ลบ ${ids.length} รายการแล้ว` });
    } else {
      if (!id) {
        return NextResponse.json({ error: 'กรุณาระบุรหัสนักเรียน' }, { status: 400 });
      }

      const success = await deleteStudent(id);
      if (!success) {
        return NextResponse.json({ error: 'ไม่พบนักเรียน' }, { status: 404 });
      }

      return NextResponse.json({ success: true });
    }
  } catch (error) {
    return NextResponse.json({ error: 'เกิดข้อผิดพลาดในการลบนักเรียน' }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
