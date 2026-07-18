// GET /api/applications — List all loan applications
import { NextResponse } from 'next/server';
import { getServerClient } from '@/lib/db/supabase';

export async function GET() {
  try {
    const supabase = getServerClient();
    const result = await supabase
      .from("loan_applications")
      .select("*, customers(full_name)")
      .order("submitted_at", { ascending: false });
    return NextResponse.json({ success: true, data: result.data || [] });
  } catch (e) {
    return NextResponse.json({ success: false, error: String(e) }, { status: 500 });
  }
}
