# ============================================================
# SHB-AgentOS: Embedding Client (Jina AI / OpenAI fallback)
# ============================================================

import requests
from api.config import JINA_API_KEY, JINA_EMBEDDING_MODEL, EMBEDDING_PROVIDER, OPENAI_API_KEY


def embed_texts(texts: list[str]) -> list[list[float]]:
    """Embed a batch of texts using Jina AI or OpenAI fallback."""
    if EMBEDDING_PROVIDER == "jina" and JINA_API_KEY:
        return _embed_jina(texts)
    else:
        return _embed_openai(texts)


def embed_query(query: str) -> list[float]:
    """Embed a single query string."""
    results = embed_texts([query])
    return results[0]


def _embed_jina(texts: list[str]) -> list[list[float]]:
    """Call Jina AI embedding API."""
    response = requests.post(
        "https://api.jina.ai/v1/embeddings",
        headers={
            "Content-Type": "application/json",
            "Authorization": f"Bearer {JINA_API_KEY}",
        },
        json={
            "model": JINA_EMBEDDING_MODEL,
            "task": "text-matching",
            "input": texts,
        },
        timeout=30,
    )
    response.raise_for_status()
    data = response.json()
    return [item["embedding"] for item in data["data"]]


def _embed_openai(texts: list[str]) -> list[list[float]]:
    """Fallback: Use OpenAI text-embedding-3-small."""
    from openai import OpenAI
    client = OpenAI(api_key=OPENAI_API_KEY)
    response = client.embeddings.create(
        model="text-embedding-3-small",
        input=texts,
    )
    return [item.embedding for item in response.data]
