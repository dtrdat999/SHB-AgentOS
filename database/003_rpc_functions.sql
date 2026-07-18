-- ============================================================
-- 11. VECTOR SIMILARITY SEARCH (RPC FUNCTION)
-- ============================================================

-- Function to match policy documents based on embedding
CREATE OR REPLACE FUNCTION match_policy_documents (
  query_embedding vector(1024),
  match_threshold float,
  match_count int,
  filter_category text DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  title text,
  content text,
  category text,
  version text,
  effective_date date,
  section_title text,
  source_file text,
  similarity float
)
LANGUAGE sql STABLE
AS $$
  SELECT
    policy_documents.id,
    policy_documents.title,
    policy_documents.content,
    policy_documents.category,
    policy_documents.version,
    policy_documents.effective_date,
    policy_documents.section_title,
    policy_documents.source_file,
    1 - (policy_documents.embedding <=> query_embedding) AS similarity
  FROM policy_documents
  WHERE 
    1 - (policy_documents.embedding <=> query_embedding) > match_threshold
    AND (filter_category IS NULL OR policy_documents.category = filter_category)
  ORDER BY policy_documents.embedding <=> query_embedding
  LIMIT match_count;
$$;
