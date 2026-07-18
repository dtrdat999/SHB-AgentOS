# ============================================================
# SHB-AgentOS: RAG Retrieval (Python)
# Vector similarity search via Supabase RPC
# ============================================================

from api.db import get_supabase
from api.embedding import embed_query


def retrieve_policies(
    query: str,
    category: str | None = None,
    match_count: int = 3,
    similarity_threshold: float = 0.5,
) -> list[dict]:
    """
    Perform vector similarity search against policy_documents table.
    Returns list of matching policy chunks with similarity scores.
    """
    print(f'[RAG Retrieval] Query: "{query}" | Category: {category or "all"}')

    # 1. Embed the search query
    query_embedding = embed_query(query)

    # 2. Call Supabase RPC function
    supabase = get_supabase()
    result = supabase.rpc(
        "match_policy_documents",
        {
            "query_embedding": query_embedding,
            "match_threshold": similarity_threshold,
            "match_count": match_count,
            "filter_category": category,
        },
    ).execute()

    if not result.data:
        print("[RAG Retrieval] No results found.")
        return []

    print(f"[RAG Retrieval] Found {len(result.data)} relevant chunks.")
    return result.data


def format_retrieval_context(results: list[dict]) -> str:
    """Format RAG results into a readable context string for LLM."""
    if not results:
        return "Không tìm thấy quy định liên quan trong cơ sở dữ liệu chính sách."

    sections = []
    for i, r in enumerate(results, 1):
        sections.append(
            f"--- Quy định #{i} (Độ liên quan: {r.get('similarity', 0):.2f}) ---\n"
            f"Tiêu đề: {r.get('title', 'N/A')}\n"
            f"Mục: {r.get('section_title', 'N/A')}\n"
            f"Phiên bản: {r.get('version', 'N/A')} | Hiệu lực: {r.get('effective_date', 'N/A')}\n"
            f"Nội dung:\n{r.get('content', 'N/A')}"
        )
    return "\n\n".join(sections)


def extract_citations(results: list[dict]) -> list[dict]:
    """Extract structured citations from RAG results."""
    return [
        {
            "doc_title": r.get("title", ""),
            "version": r.get("version", ""),
            "effective_date": r.get("effective_date", ""),
            "section": r.get("section_title", ""),
            "chunk_id": r.get("id", ""),
            "relevance_score": r.get("similarity", 0),
        }
        for r in results
    ]
