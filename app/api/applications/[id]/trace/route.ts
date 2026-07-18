// GET /api/applications/[id]/trace — Agent reasoning trace
import { NextResponse } from 'next/server';
import { getServerClient } from '@/lib/db/supabase';

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const supabase = getServerClient();
    const result = await supabase
      .from("agent_action_log")
      .select("*")
      .eq("application_id", id)
      .order("created_at");
    return NextResponse.json({ success: true, data: result.data || [] });
  } catch (e) {
    return NextResponse.json({ success: false, error: String(e) }, { status: 500 });
  }
}
