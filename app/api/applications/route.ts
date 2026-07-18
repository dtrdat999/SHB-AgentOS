// ============================================================
// SHB-AgentOS: Applications API
// POST /api/applications — Submit new loan
// GET /api/applications — List all
// ============================================================
// TODO: Implement in Milestone 4

import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    message: 'Applications endpoint — not yet implemented',
    milestone: 'M4',
  }, { status: 501 });
}

export async function POST() {
  return NextResponse.json({
    message: 'Submit application endpoint — not yet implemented',
    milestone: 'M4',
  }, { status: 501 });
}
