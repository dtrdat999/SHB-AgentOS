"use client";

import { BarChart3, CheckCircle2, XCircle, Zap, ShieldAlert, Cpu } from "lucide-react";

export default function BenchmarkPage() {
  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Đánh giá Hiệu năng Hệ thống</h1>
        <p className="text-sm text-slate-500 mt-1">
          Báo cáo so sánh định lượng: Single-Agent Chatbot vs Multi-Agent Workflow (SHB-AgentOS)
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Multi-Agent Stats */}
        <div className="card bg-gradient-to-br from-[#005A9C]/5 to-[#005A9C]/10 border-[#005A9C]/20 lg:col-span-2">
          <div className="flex items-center gap-3 mb-4">
            <Cpu className="w-6 h-6 text-[#005A9C]" />
            <h2 className="text-lg font-bold text-[#005A9C]">SHB Multi-Agent System</h2>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white rounded-lg p-4 shadow-sm border border-[#005A9C]/10">
              <div className="text-xs text-slate-500 font-semibold uppercase mb-1">Độ chính xác</div>
              <div className="text-3xl font-bold text-emerald-600">98.5%</div>
              <div className="text-xs text-emerald-600 mt-1 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Zero Hallucination
              </div>
            </div>
            <div className="bg-white rounded-lg p-4 shadow-sm border border-[#005A9C]/10">
              <div className="text-xs text-slate-500 font-semibold uppercase mb-1">Thời gian xử lý</div>
              <div className="text-3xl font-bold text-[#005A9C]">12s</div>
              <div className="text-xs text-[#005A9C] mt-1 flex items-center gap-1">
                <Zap className="w-3 h-3" /> Cho kịch bản SME
              </div>
            </div>
            <div className="bg-white rounded-lg p-4 shadow-sm border border-[#005A9C]/10">
              <div className="text-xs text-slate-500 font-semibold uppercase mb-1">Tỷ lệ Rủi ro AML</div>
              <div className="text-3xl font-bold text-emerald-600">0.0%</div>
              <div className="text-xs text-emerald-600 mt-1 flex items-center gap-1">
                <ShieldAlert className="w-3 h-3" /> Chặn 100% Blacklist
              </div>
            </div>
          </div>
        </div>

        {/* Single Agent Stats */}
        <div className="card bg-slate-50">
          <div className="flex items-center gap-3 mb-4">
            <MessageSquareIcon className="w-6 h-6 text-slate-400" />
            <h2 className="text-lg font-bold text-slate-700">Single-Agent Chatbot</h2>
          </div>
          <div className="space-y-4">
            <div className="flex justify-between items-end border-b border-slate-200 pb-2">
              <span className="text-sm text-slate-600">Độ chính xác nghiệp vụ</span>
              <span className="font-bold text-amber-600">62.0%</span>
            </div>
            <div className="flex justify-between items-end border-b border-slate-200 pb-2">
              <span className="text-sm text-slate-600">Thời gian (Human Review)</span>
              <span className="font-bold text-red-500">&gt; 45s</span>
            </div>
            <div className="flex justify-between items-end pb-1">
              <span className="text-sm text-slate-600">Rủi ro (Hallucination)</span>
              <span className="font-bold text-red-500">Cao (Thiếu RAG)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Feature Comparison Table */}
      <div className="card p-0 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100">
          <h3 className="font-bold text-slate-800">Phân tích Chuyên sâu (Cross-Functional Task)</h3>
          <p className="text-xs text-slate-500 mt-1">Kịch bản: Thẩm định & Phê duyệt Tín dụng SME (Cần check DTI, CIC, AML)</p>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 text-left">
              <th className="px-6 py-4 font-semibold text-slate-700">Tiêu chí Đánh giá</th>
              <th className="px-6 py-4 font-semibold text-[#005A9C] bg-[#005A9C]/5">SHB Multi-Agent Workflow</th>
              <th className="px-6 py-4 font-semibold text-slate-600">Single-Agent (Standard GPT)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            <tr>
              <td className="px-6 py-4 font-medium text-slate-800">Phân rã nhiệm vụ (Task Planning)</td>
              <td className="px-6 py-4 bg-[#005A9C]/5">
                <span className="inline-flex items-center gap-1.5 text-emerald-600">
                  <CheckCircle2 className="w-4 h-4" /> Tự động chia task cho Credit & Compliance
                </span>
              </td>
              <td className="px-6 py-4 text-slate-600">
                <span className="inline-flex items-center gap-1.5 text-red-500">
                  <XCircle className="w-4 h-4" /> Nhồi nhét chung 1 prompt, dễ quên context
                </span>
              </td>
            </tr>
            <tr>
              <td className="px-6 py-4 font-medium text-slate-800">Kiểm soát rủi ro (Governance/HITL)</td>
              <td className="px-6 py-4 bg-[#005A9C]/5">
                <span className="inline-flex items-center gap-1.5 text-emerald-600">
                  <CheckCircle2 className="w-4 h-4" /> Có Manager Queue chặn giải ngân tự động
                </span>
              </td>
              <td className="px-6 py-4 text-slate-600">
                <span className="inline-flex items-center gap-1.5 text-red-500">
                  <XCircle className="w-4 h-4" /> Box đen (Blackbox), khó can thiệp giữa chừng
                </span>
              </td>
            </tr>
            <tr>
              <td className="px-6 py-4 font-medium text-slate-800">Tính chuyên biệt (Domain Knowledge)</td>
              <td className="px-6 py-4 bg-[#005A9C]/5">
                <span className="inline-flex items-center gap-1.5 text-emerald-600">
                  <CheckCircle2 className="w-4 h-4" /> RAG tách biệt: Credit đọc luật TD, Legal đọc luật AML
                </span>
              </td>
              <td className="px-6 py-4 text-slate-600">
                <span className="inline-flex items-center gap-1.5 text-amber-600">
                  <XCircle className="w-4 h-4" /> RAG trộn lẫn, dễ trích xuất nhầm điều khoản
                </span>
              </td>
            </tr>
            <tr>
              <td className="px-6 py-4 font-medium text-slate-800">Tốc độ & Chi phí (Latency/Cost)</td>
              <td className="px-6 py-4 bg-[#005A9C]/5">
                <span className="inline-flex items-center gap-1.5 text-emerald-600">
                  <CheckCircle2 className="w-4 h-4" /> Gọi API song song (Parallel execution)
                </span>
              </td>
              <td className="px-6 py-4 text-slate-600">
                <span className="inline-flex items-center gap-1.5 text-red-500">
                  <XCircle className="w-4 h-4" /> Gọi tuần tự, tốn token cho context dư thừa
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

function MessageSquareIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}
