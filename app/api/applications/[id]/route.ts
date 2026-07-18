// GET /api/applications/[id] — Application detail with customer info
import { NextResponse } from 'next/server';
import { getServerClient } from '@/lib/db/supabase';

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const supabase = getServerClient();
    const result = await supabase
      .from("loan_applications")
      .select("*, customers(*)")
      .eq("id", id)
      .single();
    if (!result.data) {
      return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: result.data });
  } catch (e) {
    return NextResponse.json({ success: false, error: String(e) }, { status: 500 });
  }
}
