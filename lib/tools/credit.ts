// ============================================================
// SHB-AgentOS: Credit Tools
// calculate_dti, evaluate_eligibility
// ============================================================
// TODO: Implement in Milestone 2

/**
 * Calculate Debt-to-Income ratio.
 * DTI = (existing_debt + monthly_payment_new) / monthly_income
 * where monthly_payment_new = amount_requested / loan_term_months
 */
export function calculateDTI(params: {
  monthlyIncome: number;
  existingDebt: number;
  amountRequested: number;
  loanTermMonths: number;
}): { dtiRatio: number; monthlyPaymentNew: number; totalMonthlyDebt: number } {
  const monthlyPaymentNew = params.amountRequested / params.loanTermMonths;
  const totalMonthlyDebt = params.existingDebt + monthlyPaymentNew;
  const dtiRatio = totalMonthlyDebt / params.monthlyIncome;

  return {
    dtiRatio: Math.round(dtiRatio * 10000) / 10000, // 4 decimal places
    monthlyPaymentNew: Math.round(monthlyPaymentNew),
    totalMonthlyDebt: Math.round(totalMonthlyDebt),
  };
}
