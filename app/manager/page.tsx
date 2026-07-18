"use client";

import { useEffect, useState } from "react";
import { fetchPendingApprovals, decideApproval } from "@/lib/api-client";

export default function ManagerApprovalsPage() {
  const [approvals, setApprovals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [decidingId, setDecidingId] = useState<string | null>(null);

  const loadApprovals = () => {
    setLoading(true);
    fetchPendingApprovals()
      .then((res) => setApprovals(res.data || []))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadApprovals();
  }, []);

  async function handleDecision(approvalId: string, status: "approved" | "rejected") {
    setDecidingId(approvalId);
    try {
      await decideApproval(approvalId, {
        status,
        approved_by: "manager",
        manager_notes: `${status === "approved" ? "Approved" : "Rejected"} by manager via dashboard`,
      });
      loadApprovals();
    } catch (err) {
      alert("Error: " + (err as Error).message);
    } finally {
      setDecidingId(null);
    }
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Manager Approvals</h1>
        <p className="text-sm text-slate-500 mt-1">
          Các hồ sơ cần xét duyệt thủ công (HITL — Human-in-the-Loop)
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="spinner"></div>
          <span className="ml-3 text-sm text-slate-500">Đang tải...</span>
        </div>
      ) : approvals.length === 0 ? (
        <div className="card text-center py-12">
          <div className="text-4xl mb-3">✅</div>
          <p className="text-slate-500">Không có hồ sơ nào cần xét duyệt!</p>
          <p className="text-xs text-slate-400 mt-1">
            Hồ sơ sẽ xuất hiện ở đây khi AI Agent không chắc chắn hoặc phát hiện rủi ro.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {approvals.map((item) => {
            const app = item.loan_applications;
            const customer = app?.customers;

            return (
              <div key={item.id} className="card border-l-4 border-l-amber-400">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-slate-800">
                      {customer?.full_name || "N/A"}
                    </h3>
                    <p className="text-xs text-slate-400 font-mono mt-0.5">{app?.id}</p>
                  </div>
                  <span className="badge badge-pending">Pending Review</span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4 text-sm">
                  <div>
                    <span className="text-xs text-slate-400">Số tiền</span>
                    <div className="font-semibold">
                      {app?.amount_requested
                        ? new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(app.amount_requested)
                        : "N/A"}
                    </div>
                  </div>
                  <div>
                    <span className="text-xs text-slate-400">Escalation</span>
                    <div className="font-medium text-amber-700">{item.escalation_type?.replace(/_/g, " ")}</div>
                  </div>
                  <div>
                    <span className="text-xs text-slate-400">AI Recommendation</span>
                    <div className={`font-bold ${item.planner_recommendation === "approve" ? "text-emerald-600" : item.planner_recommendation === "reject" ? "text-red-600" : "text-amber-600"}`}>
                      {item.planner_recommendation?.toUpperCase()}
                    </div>
                  </div>
                  <div>
                    <span className="text-xs text-slate-400">Credit / Compliance</span>
                    <div className="font-medium">
                      {app?.credit_decision || "—"} / {app?.compliance_decision || "—"}
                    </div>
                  </div>
                </div>

                {/* Summaries */}
                {item.credit_summary && (
                  <div className="bg-slate-50 rounded-lg p-3 mb-2 text-xs">
                    <span className="font-semibold text-slate-600">💳 Credit:</span>{" "}
                    <span className="text-slate-500">{item.credit_summary}</span>
                  </div>
                )}
                {item.compliance_summary && (
                  <div className="bg-slate-50 rounded-lg p-3 mb-3 text-xs">
                    <span className="font-semibold text-slate-600">🛡️ Compliance:</span>{" "}
                    <span className="text-slate-500">{item.compliance_summary}</span>
                  </div>
                )}

                {/* Reason */}
                <div className="bg-amber-50 rounded-lg p-3 mb-4 text-xs">
                  <span className="font-semibold text-amber-700">⚠️ Lý do escalate:</span>{" "}
                  <span className="text-amber-600">{item.reason}</span>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <button
                    onClick={() => handleDecision(item.id, "approved")}
                    disabled={decidingId === item.id}
                    className="btn btn-success flex-1"
                  >
                    {decidingId === item.id ? <div className="spinner"></div> : "✅ Duyệt"}
                  </button>
                  <button
                    onClick={() => handleDecision(item.id, "rejected")}
                    disabled={decidingId === item.id}
                    className="btn btn-danger flex-1"
                  >
                    {decidingId === item.id ? <div className="spinner"></div> : "❌ Từ chối"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
