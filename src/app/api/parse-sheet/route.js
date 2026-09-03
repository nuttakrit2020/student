import { NextResponse } from 'next/server';
import Papa from 'papaparse';

export async function POST(request) {
  try {
    const { sheetUrl } = await request.json();
    if (!sheetUrl) return NextResponse.json({ error: 'Missing sheetUrl' }, { status: 400 });

    const match = sheetUrl.match(/\/d\/([a-zA-Z0-9-_]+)/);
    if (!match || !match[1]) return NextResponse.json({ error: 'Invalid URL' }, { status: 400 });

    const sheetId = match[1];
    const gidMatch = sheetUrl.match(/[#&]gid=([0-9]+)/);
    const gid = gidMatch ? gidMatch[1] : '0';

    const csvUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=${gid}`;
    let csvData = '';

    try {
      const response = await fetch(csvUrl, { headers: { 'User-Agent': 'Mozilla/5.0' }, signal: AbortSignal.timeout(5000) });
      if (response.ok) {
        csvData = await response.text();
      } else {
        const tqUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&gid=${gid}`;
        const tqRes = await fetch(tqUrl, { signal: AbortSignal.timeout(5000) });
        if (tqRes.ok) csvData = await tqRes.text();
      }
    } catch (e) {
      return NextResponse.json({ error: e.message }, { status: 500 });
    }

    if (!csvData || csvData.trim().startsWith('<!DOCTYPE html>') || csvData.trim().startsWith('<html')) {
      return NextResponse.json({ error: 'Failed to fetch CSV' }, { status: 400 });
    }

    const parsed = Papa.parse(csvData, { header: true, skipEmptyLines: true });
    return NextResponse.json({ data: parsed.data });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
