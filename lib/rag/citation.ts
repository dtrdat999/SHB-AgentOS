// ============================================================
// SHB-AgentOS: RAG Citation Formatter
// Formats retrieved policy chunks into LLM-friendly context strings
// ============================================================

import type { PolicyCitation } from '@/lib/core/types';
import type { RetrievalResult } from './retrieval';

// ============================================================
// Format Context for Prompt Injection
// ============================================================
export function formatRetrievalContext(results: RetrievalResult[]): string {
  if (!results || results.length === 0) {
    return 'Không tìm thấy chính sách liên quan trong cơ sở dữ liệu.';
  }

  let contextString = 'Dưới đây là các trích đoạn từ chính sách ngân hàng liên quan:\n\n';

  results.forEach((r, index) => {
    contextString += `--- CHÍNH SÁCH ${index + 1} ---\n`;
    contextString += `Tài liệu: ${r.title} (Version: ${r.version})\n`;
    contextString += `Ngày hiệu lực: ${r.effective_date}\n`;
    contextString += `Mục: ${r.section_title}\n`;
    contextString += `Nội dung:\n${r.content}\n\n`;
  });

  return contextString.trim();
}

// ============================================================
// Extract Citations for Audit Log / Final Decision
// ============================================================
export function extractCitations(results: RetrievalResult[]): PolicyCitation[] {
  return results.map(r => ({
    doc_title: r.title,
    version: r.version,
    effective_date: r.effective_date,
    section: r.section_title,
    chunk_id: r.id,
    relevance_score: Math.round(r.similarity * 100) / 100, // Round to 2 decimal places
  }));
}
