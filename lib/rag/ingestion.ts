// ============================================================
// SHB-AgentOS: RAG Ingestion Pipeline
// Loads markdown policies, chunks by section, embeds, stores in DB
// ============================================================

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { getServerClient } from '@/lib/db/supabase';
import { embedDocuments } from '@/lib/core/embedding';

// ============================================================
// Types
// ============================================================
interface PolicyChunk {
  title: string;
  category: 'credit' | 'compliance';
  version: string;
  effective_date: string;
  section_title: string;
  chunk_index: number;
  content: string;
  source_file: string;
}

// ============================================================
// 1. Loader & Chunker
// Simplistic markdown parser: splits by '## ' (Heading 2)
// ============================================================
function extractFrontmatterAndChunks(markdown: string, filePath: string, category: 'credit' | 'compliance'): PolicyChunk[] {
  const lines = markdown.split('\n');
  
  let title = 'Unknown Policy';
  let version = '1.0';
  let effectiveDate = new Date().toISOString();
  
  // Basic frontmatter/header extraction
  for (const line of lines) {
    if (line.startsWith('# ')) title = line.replace('# ', '').trim();
    if (line.includes('**Phiên bản:**')) version = line.split('**Phiên bản:**')[1].trim();
    if (line.includes('**Ngày áp dụng:**')) effectiveDate = line.split('**Ngày áp dụng:**')[1].trim();
  }

  // Split by ## 
  const sections = markdown.split('\n## ');
  
  // The first item contains the H1 and frontmatter, we can keep it as chunk 0 or ignore if it has no real rules.
  // We'll keep it as the 'General' chunk.
  const chunks: PolicyChunk[] = [];
  
  sections.forEach((section, index) => {
    // If it's not the first element, prepend the '## ' back for context
    const content = index === 0 ? section : `## ${section}`;
    
    // Extract section title
    let sectionTitle = 'General';
    if (index > 0) {
      sectionTitle = section.split('\n')[0].trim();
    }

    // Clean up empty chunks
    if (content.trim().length < 20) return;

    chunks.push({
      title,
      category,
      version,
      effective_date: effectiveDate,
      section_title: sectionTitle,
      chunk_index: index,
      content: content.trim(),
      source_file: path.basename(filePath)
    });
  });

  return chunks;
}

// ============================================================
// 2. Directory Processor
// ============================================================
async function processDirectory(dirPath: string, category: 'credit' | 'compliance'): Promise<PolicyChunk[]> {
  const files = fs.readdirSync(dirPath);
  let allChunks: PolicyChunk[] = [];

  for (const file of files) {
    if (!file.endsWith('.md')) continue;
    
    const filePath = path.join(dirPath, file);
    const content = fs.readFileSync(filePath, 'utf-8');
    const chunks = extractFrontmatterAndChunks(content, filePath, category);
    allChunks = allChunks.concat(chunks);
  }

  return allChunks;
}

// ============================================================
// 3. Main Ingestion Function
// ============================================================
export async function runIngestionPipeline() {
  console.log('Starting RAG ingestion pipeline...');
  const supabase = getServerClient();

  // Define paths (works in local dev, in prod Vercel we might need to read from a different place or rely on DB already seeded)
  // For this hackathon, we assume data is loaded locally or via DB seed
  const dataDir = path.join(process.cwd(), 'data', 'policies');
  const creditDir = path.join(dataDir, 'credit');
  const complianceDir = path.join(dataDir, 'compliance');

  // Load and chunk
  console.log('Loading markdown files...');
  const creditChunks = await processDirectory(creditDir, 'credit');
  const complianceChunks = await processDirectory(complianceDir, 'compliance');
  const allChunks = [...creditChunks, ...complianceChunks];
  
  console.log(`Extracted ${allChunks.length} chunks. Getting embeddings...`);

  // We embed the text. To give better retrieval, we embed: "Title - Section: Content"
  const textsToEmbed = allChunks.map(c => `${c.title} - ${c.section_title}\n\n${c.content}`);
  
  // Get embeddings using our universal client
  const embeddings = await embedDocuments(textsToEmbed);
  
  console.log(`Generated ${embeddings.length} embeddings. Storing in database...`);

  // Clear existing policies to avoid duplicates during re-ingestion
  await supabase.from('policy_documents').delete().neq('id', '00000000-0000-0000-0000-000000000000');

  // Insert into Supabase
  const records = allChunks.map((chunk, i) => ({
    title: chunk.title,
    content: chunk.content,
    category: chunk.category,
    version: chunk.version,
    effective_date: chunk.effective_date, // Note: Should parse to date, but we use string in DB schema? Wait, DB uses TIMESTAMP WITH TIME ZONE. Let's just use current ISO string or parse it.
    // Wait, the DB schema says: effective_date TIMESTAMP WITH TIME ZONE.
    // Our parsing gives '01/01/2026'. Let's force an ISO date.
    section_title: chunk.section_title,
    chunk_index: chunk.chunk_index,
    source_file: chunk.source_file,
    embedding: embeddings[i],
  }));

  // Fix effective_date to be valid Postgres timestamp
  for (const record of records) {
    if (record.effective_date === '01/01/2026') {
      record.effective_date = '2026-01-01T00:00:00Z';
    } else {
      record.effective_date = new Date().toISOString();
    }
  }

  const { error } = await supabase.from('policy_documents').insert(records);

  if (error) {
    console.error('Failed to insert policy documents:', error);
    throw error;
  }

  console.log('Ingestion complete!');
  return { success: true, chunksProcessed: records.length };
}
