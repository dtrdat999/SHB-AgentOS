// ============================================================
// SHB-AgentOS: Shared TypeScript Types
// Core type definitions used across the entire application
// ============================================================

// ============================================================
// Database Entity Types
// ============================================================

export interface Customer {
  id: string;
  full_name: string;
  date_of_birth: string | null;
  id_number: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  monthly_income: number;
  existing_debt: number;
  credit_score: number;
  employment_type: EmploymentType;
  employer_name: string | null;
  years_employed: number;
  created_at: string;
  updated_at: string;
}

export type EmploymentType =
  | 'full_time'
  | 'part_time'
  | 'self_employed'
  | 'freelance'
  | 'unemployed'
  | 'retired';

export interface LoanApplication {
  id: string;
  customer_id: string;
  amount_requested: number;
  loan_term_months: number;
  purpose: string | null;
  dti_ratio: number | null;
  credit_decision: AgentDecision | null;
  credit_reasoning: string | null;
  compliance_decision: ComplianceDecision | null;
  compliance_reasoning: string | null;
  compliance_agent_called: boolean;
  guardrail_flags: string[];
  confidence_level: ConfidenceLevel | null;
  final_status: ApplicationStatus;
  submitted_at: string;
  decided_at: string | null;
}

export type AgentDecision = 'approve' | 'reject' | 'flagged';
export type ComplianceDecision = 'approve' | 'reject' | 'flagged' | 'not_required';
export type ConfidenceLevel = 'high' | 'low';
export type ApplicationStatus =
  | 'processing'
  | 'auto_approved'
  | 'auto_rejected'
  | 'pending_manager'
  | 'manager_approved'
  | 'manager_rejected'
  | 'error';

export interface AgentActionLog {
  id: string;
  agent_name: AgentName;
  application_id: string;
  action_type: string;
  input_payload: Record<string, unknown> | null;
  output_payload: Record<string, unknown> | null;
  reasoning_text: string | null;
  duration_ms: number | null;
  created_at: string;
}

export type AgentName = 'planner_agent' | 'credit_agent' | 'compliance_agent' | 'system';

export interface TaskState {
  id: string;
  application_id: string;
  task_description: string;
  assigned_agent: 'credit_agent' | 'compliance_agent';
  status: TaskStatus;
  created_by: string;
  result_summary: string | null;
  error_message: string | null;
  created_at: string;
  updated_at: string;
}

export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'failed';

export interface ManagerApproval {
  id: string;
  application_id: string;
  reason: string;
  escalation_type: EscalationType;
  credit_summary: string | null;
  compliance_summary: string | null;
  planner_recommendation: string | null;
  status: ApprovalStatus;
  approved_by: string | null;
  manager_notes: string | null;
  created_at: string;
  decided_at: string | null;
}

export type EscalationType =
  | 'guardrail_trigger'
  | 'agent_conflict'
  | 'low_confidence'
  | 'manual_review';

export type ApprovalStatus = 'pending' | 'approved' | 'rejected';

export interface PolicyDocument {
  id: string;
  title: string;
  content: string;
  category: 'credit' | 'compliance';
  version: string;
  effective_date: string;
  superseded_by: string | null;
  section_title: string | null;
  chunk_index: number;
  source_file: string | null;
  embedding: number[] | null;
  created_at: string;
}

export interface AmlWatchlistEntry {
  id: string;
  entity_name: string;
  entity_type: 'individual' | 'organization';
  id_number: string | null;
  risk_level: 'high' | 'medium' | 'low';
  reason: string | null;
  source: string | null;
  added_at: string;
  expires_at: string | null;
}

// ============================================================
// Agent System Types
// ============================================================

/** Result returned by any executor agent */
export interface AgentResult {
  agent_name: AgentName;
  task_id: string;
  verdict: AgentDecision;
  reasoning: string;
  citations: PolicyCitation[];
  metadata: Record<string, unknown>;
}

/** Citation from RAG retrieval */
export interface PolicyCitation {
  doc_title: string;
  version: string;
  effective_date: string;
  section: string;
  chunk_id: string;
  relevance_score: number;
}

/** Guardrail check result */
export interface GuardrailResult {
  triggered_rules: string[];
  force_hitl: boolean;
  cannot_auto_approve: boolean;
  stop_execution: boolean;
  stop_reason?: string;
}

/** Confidence computation result */
export interface ConfidenceResult {
  level: ConfidenceLevel;
  score: number; // 0-1 for granularity
  factors: {
    agents_agree: boolean;
    no_guardrail_violations: boolean;
    no_history_flags: boolean;
    dti_within_threshold: boolean;
  };
}

/** Planner's final synthesized decision */
export interface PlannerDecision {
  application_id: string;
  final_status: ApplicationStatus;
  confidence: ConfidenceResult;
  guardrail: GuardrailResult;
  credit_result: AgentResult | null;
  compliance_result: AgentResult | null;
  reasoning: string;
  requires_manager: boolean;
  escalation_reason?: string;
}

// ============================================================
// API Request/Response Types
// ============================================================

/** POST /api/applications — Submit new loan */
export interface SubmitApplicationRequest {
  customer_id: string;
  amount_requested: number;
  loan_term_months: number;
  purpose: string;
}

/** PATCH /api/approvals/[id] — Manager decision */
export interface ManagerDecisionRequest {
  status: 'approved' | 'rejected';
  approved_by: string;
  manager_notes?: string;
}

/** GET /api/dashboard/kpis — Aggregate metrics */
export interface DashboardKPIs {
  total_applications: number;
  avg_processing_time_ms: number;
  auto_approval_rate: number;      // 0-1
  manager_intervention_rate: number; // 0-1
  compliance_call_rate: number;     // 0-1
  pending_approvals: number;
}

/** GET /api/applications/[id]/trace — Reasoning trace */
export interface ReasoningTrace {
  application_id: string;
  steps: TraceStep[];
}

export interface TraceStep {
  step_index: number;
  agent_name: AgentName;
  action_type: string;
  reasoning: string | null;
  input_summary: string | null;
  output_summary: string | null;
  citations: PolicyCitation[];
  timestamp: string;
  duration_ms: number | null;
}
