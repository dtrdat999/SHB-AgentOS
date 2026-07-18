// ============================================================
// SHB-AgentOS: Health Check API
// GET /api/health
// ============================================================

import { NextResponse } from 'next/server';
import { getServerClient } from '@/lib/db/supabase';

export async function GET() {
  const checks: Record<string, string> = {
    api: 'ok',
    database: 'unchecked',
    openai: 'unchecked',
  };

  // Check Supabase connection
  try {
    const supabase = getServerClient();
    const { error } = await supabase.from('customers').select('id').limit(1);
    checks.database = error ? `error: ${error.message}` : 'ok';
  } catch (e) {
    checks.database = `error: ${String(e)}`;
  }

  // Check OpenAI key presence
  checks.openai = process.env.OPENAI_API_KEY ? 'configured' : 'missing';

  const allOk = Object.values(checks).every(v => v === 'ok' || v === 'configured');

  return NextResponse.json({
    status: allOk ? 'healthy' : 'degraded',
    checks,
    timestamp: new Date().toISOString(),
    version: '0.1.0',
  }, { status: allOk ? 200 : 503 });
}
