import { NextResponse } from 'next/server';
import { getSettings } from '@/lib/data';

export async function POST(request) {
  try {
    const body = await request.json();
    const { adminKey, sheetUrl, updates } = body;

    if (adminKey !== 'admin2569') {
      return NextResponse.json({ error: 'ไม่มีสิทธิ์เข้าถึง' }, { status: 403 });
    }
    if (!sheetUrl || !updates) {
      return NextResponse.json({ error: 'Missing sheetUrl or updates' }, { status: 400 });
    }

    const settings = await getSettings();
    const appScriptUrl = settings?.googleAppScriptUrl;
    if (!appScriptUrl) {
      return NextResponse.json({ error: 'ยังไม่ได้ตั้งค่า Google Apps Script URL' }, { status: 400 });
    }

    // Extract sheetId and gid
    const match = sheetUrl.match(/\/d\/([a-zA-Z0-9-_]+)/);
    if (!match) return NextResponse.json({ error: 'Invalid Google Sheet URL format' }, { status: 400 });
    const sheetId = match[1];
    
    const gidMatch = sheetUrl.match(/[#&]gid=([0-9]+)/);
    const gid = gidMatch ? gidMatch[1] : null;

    // Call Apps Script URL
    const payload = {
       sheetId,
       gid,
       updates
    };

    const res = await fetch(appScriptUrl, {
       method: 'POST',
       body: JSON.stringify(payload),
       headers: { 'Content-Type': 'text/plain;charset=utf-8' } // Apps script likes text/plain for cors
    });

    const result = await res.json();
    
    if (result.error) {
       return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true, updated: result.updated });

  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
