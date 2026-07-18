// ============================================================
// SHB-AgentOS: Guardrail Engine
// DETERMINISTIC rules — Python-style logic, NO LLM
// Cannot be bypassed by agent reasoning
// ============================================================

import type { GuardrailResult } from '@/lib/core/types';

// ============================================================
// Guardrail Thresholds (configurable)
// ============================================================
const GUARDRAIL_CONFIG = {
  /** Amount threshold for forced HITL (2 billion VNĐ) */
  AMOUNT_FORCE_HITL: 2_000_000_000,

  /** Amount threshold for requiring Compliance Agent (500 million VNĐ) */
  AMOUNT_REQUIRE_COMPLIANCE: 500_000_000,
} as const;

// ============================================================
// Main Guardrail Check
// ============================================================
export function applyGuardrailRules(params: {
  amountRequested: number;
  amlFlag: boolean;
  policyAvailable: boolean;
  customerHasHistory: boolean;
  previouslyRejected: boolean;
}): GuardrailResult {
  const triggeredRules: string[] = [];
  let forceHitl = false;
  let cannotAutoApprove = false;
  let stopExecution = false;
  let stopReason: string | undefined;

  // Rule 1: Amount exceeds threshold → Force HITL
  if (params.amountRequested > GUARDRAIL_CONFIG.AMOUNT_FORCE_HITL) {
    triggeredRules.push('amount_exceeds_2b_threshold');
    forceHitl = true;
  }

  // Rule 2: AML flag → Cannot auto-approve
  if (params.amlFlag) {
    triggeredRules.push('aml_high_risk');
    cannotAutoApprove = true;
  }

  // Rule 3: Policy missing → Stop execution
  if (!params.policyAvailable) {
    triggeredRules.push('policy_unavailable');
    stopExecution = true;
    stopReason = 'Không tìm thấy chính sách tín dụng hiệu lực. Không thể tiếp tục xét duyệt.';
  }

  // Rule 4: Previously rejected customer → Cannot auto-approve (heighten caution)
  if (params.previouslyRejected) {
    triggeredRules.push('customer_previously_rejected');
    cannotAutoApprove = true;
  }

  return {
    triggered_rules: triggeredRules,
    force_hitl: forceHitl,
    cannot_auto_approve: cannotAutoApprove,
    stop_execution: stopExecution,
    stop_reason: stopReason,
  };
}
