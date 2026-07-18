-- ============================================================
-- SHB-AgentOS: Database Schema
-- Run this in Supabase SQL Editor
-- ============================================================

-- 1. Enable required extensions
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- 2. CUSTOMERS — Mock bank customers
-- ============================================================
CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  full_name TEXT NOT NULL,
  date_of_birth DATE,
  id_number TEXT UNIQUE,                          -- CMND/CCCD
  phone TEXT,
  email TEXT,
  address TEXT,
  monthly_income DECIMAL(15, 2) NOT NULL,         -- VNĐ
  existing_debt DECIMAL(15, 2) DEFAULT 0,         -- Tổng nợ hiện tại
  credit_score INTEGER CHECK (credit_score BETWEEN 300 AND 900),
  employment_type TEXT CHECK (employment_type IN (
    'full_time', 'part_time', 'self_employed', 'freelance', 'unemployed', 'retired'
  )),
  employer_name TEXT,
  years_employed INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 3. LOAN_APPLICATIONS — Core entity, agents read/write here
-- ============================================================
CREATE TABLE IF NOT EXISTS loan_applications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID NOT NULL REFERENCES customers(id),
  
  -- Request details
  amount_requested DECIMAL(15, 2) NOT NULL,       -- VNĐ
  loan_term_months INTEGER DEFAULT 12,
  purpose TEXT,
  
  -- Agent results (written by agents during processing)
  dti_ratio DECIMAL(5, 4),                        -- e.g., 0.3500 = 35%
  credit_decision TEXT CHECK (credit_decision IN (
    'approve', 'reject', 'flagged', NULL
  )),
  credit_reasoning TEXT,
  
  compliance_decision TEXT CHECK (compliance_decision IN (
    'approve', 'reject', 'flagged', 'not_required', NULL
  )),
  compliance_reasoning TEXT,
  compliance_agent_called BOOLEAN DEFAULT FALSE,  -- Proof of dynamic planning
  
  -- Guardrail & Confidence
  guardrail_flags JSONB DEFAULT '[]'::jsonb,      -- ['amount_exceeds_threshold', ...]
  confidence_level TEXT CHECK (confidence_level IN ('high', 'low', NULL)),
  
  -- Final decision
  final_status TEXT DEFAULT 'processing' CHECK (final_status IN (
    'processing', 'auto_approved', 'auto_rejected', 'pending_manager', 'manager_approved', 'manager_rejected', 'error'
  )),
  
  -- Timestamps
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  decided_at TIMESTAMPTZ
);

-- ============================================================
-- 4. AGENT_ACTION_LOG — Audit trail (most important table)
-- ============================================================
CREATE TABLE IF NOT EXISTS agent_action_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent_name TEXT NOT NULL CHECK (agent_name IN (
    'planner_agent', 'credit_agent', 'compliance_agent', 'system'
  )),
  application_id UUID REFERENCES loan_applications(id),
  
  action_type TEXT NOT NULL,                       -- e.g., 'calculate_dti', 'retrieve_policy', 'check_aml'
  input_payload JSONB,                             -- What was sent to the tool
  output_payload JSONB,                            -- What the tool returned
  reasoning_text TEXT,                             -- Agent's reasoning (human-readable)
  
  duration_ms INTEGER,                             -- Execution time tracking
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 5. TASK_STATES — Planner's work decomposition proof
-- ============================================================
CREATE TABLE IF NOT EXISTS task_states (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  application_id UUID NOT NULL REFERENCES loan_applications(id),
  
  task_description TEXT NOT NULL,                   -- "Assess credit eligibility"
  assigned_agent TEXT NOT NULL CHECK (assigned_agent IN (
    'credit_agent', 'compliance_agent'
  )),
  status TEXT DEFAULT 'pending' CHECK (status IN (
    'pending', 'in_progress', 'completed', 'failed'
  )),
  created_by TEXT DEFAULT 'planner_agent',
  
  result_summary TEXT,                              -- Brief result after completion
  error_message TEXT,                               -- If failed
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 6. MANAGER_APPROVALS — HITL queue
-- ============================================================
CREATE TABLE IF NOT EXISTS manager_approvals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  application_id UUID NOT NULL REFERENCES loan_applications(id) UNIQUE,
  
  reason TEXT NOT NULL,                             -- Why escalated (guardrail, conflict, low confidence)
  escalation_type TEXT CHECK (escalation_type IN (
    'guardrail_trigger', 'agent_conflict', 'low_confidence', 'manual_review'
  )),
  
  -- Agent summaries for manager review
  credit_summary TEXT,
  compliance_summary TEXT,
  planner_recommendation TEXT,
  
  -- Manager decision
  status TEXT DEFAULT 'pending' CHECK (status IN (
    'pending', 'approved', 'rejected'
  )),
  approved_by TEXT,                                 -- Manager name/ID
  manager_notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  decided_at TIMESTAMPTZ
);

-- ============================================================
-- 7. POLICY_DOCUMENTS — RAG source with pgvector
-- ============================================================
CREATE TABLE IF NOT EXISTS policy_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  title TEXT NOT NULL,
  content TEXT NOT NULL,                            -- Full chunk content
  category TEXT NOT NULL CHECK (category IN ('credit', 'compliance')),
  
  -- Versioning
  version TEXT DEFAULT 'v1.0',
  effective_date DATE NOT NULL,
  superseded_by UUID REFERENCES policy_documents(id),
  
  -- Metadata for retrieval
  section_title TEXT,                               -- Section heading within document
  chunk_index INTEGER DEFAULT 0,                    -- Order within document
  source_file TEXT,                                 -- Original filename
  
  -- Vector embedding (Jina AI: 1024 dim)
  embedding vector(1024),
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 8. AML_WATCHLIST — Mock Anti-Money Laundering watchlist
-- ============================================================
CREATE TABLE IF NOT EXISTS aml_watchlist (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  entity_name TEXT NOT NULL,
  entity_type TEXT DEFAULT 'individual' CHECK (entity_type IN (
    'individual', 'organization'
  )),
  id_number TEXT,                                   -- CMND/CCCD for matching
  risk_level TEXT DEFAULT 'high' CHECK (risk_level IN (
    'high', 'medium', 'low'
  )),
  reason TEXT,
  source TEXT,                                      -- e.g., 'State Bank blacklist'
  
  added_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ
);

-- ============================================================
-- 9. INDEXES for performance
-- ============================================================

-- Loan applications: lookup by customer, filter by status
CREATE INDEX IF NOT EXISTS idx_loan_applications_customer 
  ON loan_applications(customer_id);
CREATE INDEX IF NOT EXISTS idx_loan_applications_status 
  ON loan_applications(final_status);
CREATE INDEX IF NOT EXISTS idx_loan_applications_submitted 
  ON loan_applications(submitted_at DESC);

-- Audit log: lookup by application, filter by agent
CREATE INDEX IF NOT EXISTS idx_agent_action_log_application 
  ON agent_action_log(application_id);
CREATE INDEX IF NOT EXISTS idx_agent_action_log_agent 
  ON agent_action_log(agent_name);
CREATE INDEX IF NOT EXISTS idx_agent_action_log_created 
  ON agent_action_log(created_at DESC);

-- Task states: lookup by application
CREATE INDEX IF NOT EXISTS idx_task_states_application 
  ON task_states(application_id);

-- Manager approvals: filter pending
CREATE INDEX IF NOT EXISTS idx_manager_approvals_status 
  ON manager_approvals(status);

-- Policy documents: RAG queries - category + effective date + vector
CREATE INDEX IF NOT EXISTS idx_policy_documents_category 
  ON policy_documents(category);
CREATE INDEX IF NOT EXISTS idx_policy_documents_effective 
  ON policy_documents(effective_date DESC);

-- AML watchlist: name search
CREATE INDEX IF NOT EXISTS idx_aml_watchlist_name 
  ON aml_watchlist(entity_name);
CREATE INDEX IF NOT EXISTS idx_aml_watchlist_id_number 
  ON aml_watchlist(id_number);

-- pgvector index for similarity search (IVFFlat - good for small datasets)
-- Note: Run AFTER inserting data for optimal index building
-- CREATE INDEX IF NOT EXISTS idx_policy_embedding 
--   ON policy_documents USING ivfflat (embedding vector_cosine_ops) WITH (lists = 5);

-- ============================================================
-- 10. ROW LEVEL SECURITY (basic setup)
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE loan_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_action_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_states ENABLE ROW LEVEL SECURITY;
ALTER TABLE manager_approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE policy_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE aml_watchlist ENABLE ROW LEVEL SECURITY;

-- Allow service role full access (API routes use service_role key)
CREATE POLICY "Service role full access" ON customers FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON loan_applications FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON agent_action_log FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON task_states FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON manager_approvals FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON policy_documents FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON aml_watchlist FOR ALL USING (true) WITH CHECK (true);
