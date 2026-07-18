// ============================================================
// SHB-AgentOS: API Client for Frontend → Python Backend
// ============================================================

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || err.error || 'API Error');
  }
  return res.json();
}

// ---- Chat (User Proxy Agent) ----
export async function sendChatMessage(messages: { role: string; content: string }[]) {
  return apiFetch<{ success: boolean; data: any }>('/api/chat', {
    method: 'POST',
    body: JSON.stringify({ messages }),
  });
}

// ---- Customers ----
export async function fetchCustomers() {
  return apiFetch<{ success: boolean; data: any[] }>('/api/customers');
}

export async function fetchCustomer(id: string) {
  return apiFetch<{ success: boolean; data: any }>(`/api/customers/${id}`);
}

// ---- Agent Orchestration ----
export async function submitLoanApplication(payload: {
  customer_id: string;
  amount_requested: number;
  loan_term_months: number;
  purpose: string;
}) {
  return apiFetch<{ success: boolean; application_id: string; data: any }>(
    '/api/agent',
    { method: 'POST', body: JSON.stringify(payload) }
  );
}

// ---- Applications ----
export async function fetchApplications() {
  return apiFetch<{ success: boolean; data: any[] }>('/api/applications');
}

export async function fetchApplication(id: string) {
  return apiFetch<{ success: boolean; data: any }>(`/api/applications/${id}`);
}

export async function fetchApplicationTrace(id: string) {
  return apiFetch<{ success: boolean; data: any[] }>(`/api/applications/${id}/trace`);
}

export async function fetchRecentTraces(limit: number = 15) {
  return apiFetch<{ success: boolean; data: any[] }>(`/api/traces/recent?limit=${limit}`);
}

// ---- Manager Approvals ----
export async function fetchPendingApprovals() {
  return apiFetch<{ success: boolean; data: any[] }>('/api/approvals');
}

export async function decideApproval(approvalId: string, payload: {
  status: 'approved' | 'rejected';
  approved_by?: string;
  manager_notes?: string;
}) {
  return apiFetch<{ success: boolean }>(`/api/approvals/${approvalId}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}
