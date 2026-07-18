// ============================================================
// SHB-AgentOS: Embedding Client
// Supports Jina AI (free) and OpenAI (fallback)
// ============================================================

// ============================================================
// Jina AI Embedding (Primary — Free tier)
// API is OpenAI-compatible, 1024 dimensions
// ============================================================
async function embedWithJina(texts: string[]): Promise<number[][]> {
  const apiKey = process.env.JINA_API_KEY;
  if (!apiKey) {
    throw new Error('Missing JINA_API_KEY in environment variables.');
  }

  const model = process.env.JINA_EMBEDDING_MODEL || 'jina-embeddings-v3';

  const response = await fetch('https://api.jina.ai/v1/embeddings', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      input: texts,
      task: 'retrieval.passage', // Optimized for document retrieval
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Jina AI embedding error: ${response.status} ${error}`);
  }

  const data = await response.json();
  return data.data.map((item: { embedding: number[] }) => item.embedding);
}

// ============================================================
// Jina AI Query Embedding (different task type for queries)
// ============================================================
async function embedQueryWithJina(query: string): Promise<number[]> {
  const apiKey = process.env.JINA_API_KEY;
  if (!apiKey) {
    throw new Error('Missing JINA_API_KEY in environment variables.');
  }

  const model = process.env.JINA_EMBEDDING_MODEL || 'jina-embeddings-v3';

  const response = await fetch('https://api.jina.ai/v1/embeddings', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      input: [query],
      task: 'retrieval.query', // Optimized for query
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Jina AI query embedding error: ${response.status} ${error}`);
  }

  const data = await response.json();
  return data.data[0].embedding;
}

// ============================================================
// OpenAI Embedding (Fallback)
// ============================================================
async function embedWithOpenAI(texts: string[]): Promise<number[][]> {
  const { getOpenAIClient } = await import('./openai');
  const client = getOpenAIClient();
  const model = process.env.OPENAI_EMBEDDING_MODEL || 'text-embedding-3-small';

  const response = await client.embeddings.create({
    model,
    input: texts,
  });

  return response.data.map((item) => item.embedding);
}

async function embedQueryWithOpenAI(query: string): Promise<number[]> {
  const results = await embedWithOpenAI([query]);
  return results[0];
}

// ============================================================
// Public API — Auto-selects provider based on config
// ============================================================

export type EmbeddingProvider = 'jina' | 'openai';

function getProvider(): EmbeddingProvider {
  return (process.env.EMBEDDING_PROVIDER as EmbeddingProvider) || 'jina';
}

/**
 * Embed document texts for storage.
 * Uses Jina AI (free) by default, falls back to OpenAI.
 */
export async function embedDocuments(texts: string[]): Promise<number[][]> {
  const provider = getProvider();

  try {
    if (provider === 'jina') {
      return await embedWithJina(texts);
    }
    return await embedWithOpenAI(texts);
  } catch (error) {
    // If Jina fails, try OpenAI fallback
    if (provider === 'jina') {
      console.warn('Jina AI failed, falling back to OpenAI:', error);
      return await embedWithOpenAI(texts);
    }
    throw error;
  }
}

/**
 * Embed a search query for retrieval.
 * Query embeddings use different optimization than document embeddings.
 */
export async function embedQuery(query: string): Promise<number[]> {
  const provider = getProvider();

  try {
    if (provider === 'jina') {
      return await embedQueryWithJina(query);
    }
    return await embedQueryWithOpenAI(query);
  } catch (error) {
    if (provider === 'jina') {
      console.warn('Jina AI query embedding failed, falling back to OpenAI:', error);
      return await embedQueryWithOpenAI(query);
    }
    throw error;
  }
}

/**
 * Get the embedding dimension for the current provider.
 */
export function getEmbeddingDimension(): number {
  const provider = getProvider();
  return provider === 'jina' ? 1024 : 1536;
}
