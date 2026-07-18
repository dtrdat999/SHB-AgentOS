// ============================================================
// SHB-AgentOS: RAG Ingestion API Route
// POST /api/rag/ingest
// Triggers the markdown parsing and pgvector embedding pipeline
// ============================================================

import { NextResponse } from 'next/server';
import { runIngestionPipeline } from '@/lib/rag/ingestion';

// Allow this route to run for up to 60 seconds (set in vercel.json)
// Also force dynamic so it doesn't get cached
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    // Basic auth check (in production, use a proper secret)
    const authHeader = req.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`) {
      // For local hackathon dev, we might bypass this or just use the service role key
      console.warn('Unauthorized ingestion attempt, but allowing for local dev hackathon.');
      // return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('API: Starting RAG ingestion pipeline...');
    const result = await runIngestionPipeline();
    
    return NextResponse.json({
      message: 'Ingestion pipeline completed successfully',
      ...result
    });

  } catch (error) {
    console.error('API Ingestion Error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error during ingestion', details: String(error) }, 
      { status: 500 }
    );
  }
}

// Support GET for easy local testing from browser
export async function GET(req: Request) {
  return POST(req);
}
