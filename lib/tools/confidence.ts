// ============================================================
// SHB-AgentOS: Confidence Calculator
// Heuristic rule-based — NOT ML model
// Transparent, explainable, deterministic
// ============================================================

import type { AgentResult, ConfidenceResult, GuardrailResult, ConfidenceLevel } from '@/lib/core/types';

export function computeConfidence(params: {
  creditResult: AgentResult | null;
  complianceResult: AgentResult | null;
  guardrailResult: GuardrailResult;
  dtiRatio: number | null;
}): ConfidenceResult {
  const { creditResult, complianceResult, guardrailResult, dtiRatio } = params;

  // Factor 1: Do agents agree?
  let agentsAgree = true;
  if (creditResult && complianceResult) {
    // Both called — check if they agree
    agentsAgree = creditResult.verdict === complianceResult.verdict ||
                  (creditResult.verdict === 'approve' && complianceResult.verdict === 'approve');
  }

  // Factor 2: No guardrail violations?
  const noGuardrailViolations = guardrailResult.triggered_rules.length === 0;

  // Factor 3: No history flags?
  const noHistoryFlags = !guardrailResult.triggered_rules.includes('customer_previously_rejected');

  // Factor 4: DTI within safe threshold?
  const dtiWithinThreshold = dtiRatio !== null && dtiRatio < 0.4;

  // Compute overall confidence
  const factors = {
    agents_agree: agentsAgree,
    no_guardrail_violations: noGuardrailViolations,
    no_history_flags: noHistoryFlags,
    dti_within_threshold: dtiWithinThreshold,
  };

  // Score: each factor contributes 0.25
  const trueCount = Object.values(factors).filter(Boolean).length;
  const score = trueCount / 4;

  const level: ConfidenceLevel = score >= 0.75 ? 'high' : 'low';

  return { level, score, factors };
}
