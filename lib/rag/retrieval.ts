// ============================================================
// SHB-AgentOS: RAG Retrieval Engine
// Performs vector similarity search using Jina AI embeddings + pgvector
// ============================================================

import { getServerClient } from '@/lib/db/supabase';
import { embedQuery } from '@/lib/core/embedding';

// ============================================================
// Types
// ============================================================
export interface RetrievalOptions {
  query: string;
  category?: 'credit' | 'compliance';
  matchCount?: number;
  similarityThreshold?: number;
}

export interface RetrievalResult {
  id: string;
  title: string;
  content: string;
  category: 'credit' | 'compliance';
  version: string;
  effective_date: string;
  section_title: string;
  source_file: string;
  similarity: number;
}

// ============================================================
// Main Retrieval Function
// ============================================================
export async function retrievePolicies(options: RetrievalOptions): Promise<RetrievalResult[]> {
  const { 
    query, 
    category = null, 
    matchCount = 3, 
    similarityThreshold = 0.5 
  } = options;

  console.log(`[RAG Retrieval] Query: "${query}" | Category: ${category || 'all'}`);

  // 1. Embed the search query
  const queryEmbedding = await embedQuery(query);

  // 2. Search via Supabase RPC (requires `match_policy_documents` function)
  const supabase = getServerClient();
  
  const { data, error } = await supabase.rpc('match_policy_documents', {
    query_embedding: queryEmbedding,
    match_threshold: similarityThreshold,
    match_count: matchCount,
    filter_category: category,
  });

  if (error) {
    console.error('[RAG Retrieval] Supabase RPC error:', error);
    throw new Error(`Failed to retrieve policies: ${error.message}`);
  }

  // 3. Process and return results
  const results = (data as unknown) as RetrievalResult[];
  console.log(`[RAG Retrieval] Found ${results.length} relevant chunks.`);
  
  return results;
}
