"use client";

import { useEffect, useState } from "react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

function getAgentEmoji(agent: string) {
  if (agent === "planner_agent") return "🧠";
  if (agent === "credit_agent") return "💳";
  if (agent === "compliance_agent") return "🛡️";
  return "⚙️";
}

function getAgentColor(agent: string) {
  if (agent === "planner_agent") return "border-l-violet-400";
  if (agent === "credit_agent") return "border-l-emerald-400";
  if (agent === "compliance_agent") return "border-l-amber-400";
  return "border-l-slate-300";
}

export default function AuditLogPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    // Fetch all audit logs (using applications trace as proxy — shows all logs)
    fetch(`${API_BASE}/api/applications`)
      .then((r) => r.json())
      .then(async (res) => {
        const apps = res.data || [];
        // Fetch traces for each application
        const allLogs: any[] = [];
        for (const app of apps.slice(0, 10)) {
          try {
            const traceRes = await fetch(`${API_BASE}/api/applications/${app.id}/trace`);
            const traceData = await traceRes.json();
            const traces = (traceData.data || []).map((t: any) => ({
              ...t,
              application_id: app.id,
              customer_name: app.customers?.full_name || "N/A",
            }));
            allLogs.push(...traces);
          } catch {
            // skip
          }
        }
        // Sort by created_at descending
        allLogs.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        setLogs(allLogs);
      })
      .finally(() => setLoading(false));
  }, []);

  const filteredLogs = filter === "all" ? logs : logs.filter((l) => l.agent_name === filter);

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Audit Log</h1>
        <p className="text-sm text-slate-500 mt-1">
          Toàn bộ hoạt động của các AI Agent — Minh bạch và có thể truy vết
        </p>
      </div>

      {/* Filter */}
      <div className="flex gap-2 mb-6">
        {["all", "planner_agent", "credit_agent", "compliance_agent"].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`btn text-xs ${filter === f ? "btn-primary" : "btn-outline"}`}
          >
            {f === "all" ? "Tất cả" : `${getAgentEmoji(f)} ${f.replace(/_/g, " ")}`}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="spinner"></div>
          <span className="ml-3 text-sm text-slate-500">Đang tải audit log...</span>
        </div>
      ) : filteredLogs.length === 0 ? (
        <div className="card text-center py-12">
          <div className="text-4xl mb-3">📋</div>
          <p className="text-slate-500">Chưa có log nào. Hãy nộp một hồ sơ vay để xem AI Agent hoạt động!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredLogs.map((log, i) => (
            <div key={log.id || i} className={`card border-l-4 ${getAgentColor(log.agent_name)} p-4`}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{getAgentEmoji(log.agent_name)}</span>
                  <span className="font-semibold text-sm text-slate-800">
                    {log.agent_name?.replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase())}
                  </span>
                  <span className="text-xs px-2 py-0.5 bg-slate-100 rounded text-slate-500">
                    {log.action_type}
                  </span>
                </div>
                <div className="text-right">
                  {log.duration_ms && (
                    <span className="text-xs text-slate-400">⏱ {log.duration_ms}ms</span>
                  )}
                  <div className="text-xs text-slate-400">
                    {new Date(log.created_at).toLocaleString("vi-VN")}
                  </div>
                </div>
              </div>

              {log.customer_name && (
                <div className="text-xs text-slate-400 mb-2">
                  Khách hàng: <span className="text-slate-600">{log.customer_name}</span>
                  <span className="text-slate-300 mx-2">|</span>
                  <span className="font-mono">{log.application_id?.slice(0, 8)}...</span>
                </div>
              )}

              {log.reasoning_text && (
                <details className="mt-2">
                  <summary className="cursor-pointer text-xs text-sky-600 hover:text-sky-800 font-medium">
                    Xem lý do đánh giá ▸
                  </summary>
                  <div className="mt-2 text-sm text-slate-600 bg-slate-50 p-3 rounded-lg whitespace-pre-wrap max-h-48 overflow-y-auto">
                    {log.reasoning_text}
                  </div>
                </details>
              )}

              {log.output_payload && (
                <div className="mt-2 flex gap-2">
                  {log.output_payload.verdict && (
                    <span className={`badge ${log.output_payload.verdict === "approve" ? "badge-approve" : log.output_payload.verdict === "reject" ? "badge-reject" : "badge-flagged"}`}>
                      {log.output_payload.verdict}
                    </span>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
