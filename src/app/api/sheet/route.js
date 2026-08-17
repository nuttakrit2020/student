import { NextResponse } from 'next/server';
import Papa from 'papaparse';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const sheetUrl = searchParams.get('url');

  if (!sheetUrl) {
    return NextResponse.json({ error: 'Missing url parameter' }, { status: 400 });
  }

  // Extract Google Sheet ID from URL
  // Example: https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit
  const match = sheetUrl.match(/\/d\/([a-zA-Z0-9-_]+)/);
  if (!match || !match[1]) {
    return NextResponse.json({ error: 'Invalid Google Sheet URL' }, { status: 400 });
  }
  
  const sheetId = match[1];

  // We can optionally check for gid to support multiple sheets in one document
  const gidMatch = sheetUrl.match(/[#&]gid=([0-9]+)/);
  const gid = gidMatch ? gidMatch[1] : '0';

  const csvUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=${gid}`;

  try {
    const response = await fetch(csvUrl, {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' // Some endpoints block automated tools
        }
    });
    
    if (!response.ok) {
        // Fallback to visualization endpoint if export fails (sometimes visualization works better)
        const tqUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&gid=${gid}`;
        const tqResponse = await fetch(tqUrl);
        if (!tqResponse.ok) {
            return NextResponse.json({ error: 'Failed to fetch CSV data. Make sure the sheet is shared as "Anyone with the link can view".' }, { status: 400 });
        }
        const csvData = await tqResponse.text();
        const parsed = Papa.parse(csvData, { header: true, skipEmptyLines: true });
        return NextResponse.json({ data: parsed.data, meta: parsed.meta });
    }

    const csvData = await response.text();
    
    // Check if the response is actually an HTML page (like a Google login page)
    if (csvData.trim().startsWith('<!DOCTYPE html>') || csvData.trim().startsWith('<html')) {
        return NextResponse.json({ error: 'Received HTML instead of CSV. Please make sure the sheet is shared as "Anyone with the link can view".' }, { status: 403 });
    }

    // Parse the CSV
    const parsed = Papa.parse(csvData, { 
        header: true, // First row is header
        skipEmptyLines: true 
    });

    return NextResponse.json({ 
        data: parsed.data,
        meta: parsed.meta 
    });
  } catch (error) {
    console.error('Error fetching sheet data:', error);
    return NextResponse.json({ error: 'Failed to process sheet' }, { status: 500 });
  }
}
