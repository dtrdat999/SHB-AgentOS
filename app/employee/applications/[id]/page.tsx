"use client";

import { useEffect, useState, useRef } from "react";
import { fetchApplication, fetchApplicationTrace } from "@/lib/api-client";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { 
  BrainCircuit, ShieldCheck, Calculator, Settings, CheckCircle2, 
  AlertTriangle, Clock, ChevronRight, FileText, Download, UserCheck, 
  XCircle, Database, Search, Activity, ChevronDown, BookOpen, Wrench
} from "lucide-react";

function FormattedReasoning({ text }: { text: string }) {
  if (!text) return <span className="text-slate-500 italic">(Không có nội dung)</span>;
  const lines = text.split('\n');
  return (
    <div className="space-y-1.5">
      {lines.map((line, i) => {
        if (!line.trim()) return <div key={i} className="h-1"></div>;
        const parts = line.split(/(\*\*.*?\*\*)/g);
        return (
          <p key={i} className="leading-relaxed">
            {parts.map((part, j) => {
              if (part.startsWith('**') && part.endsWith('**')) {
                return <strong key={j} className="text-slate-100 font-semibold">{part.slice(2, -2)}</strong>;
              }
              return <span key={j}>{part}</span>;
            })}
          </p>
        );
      })}
    </div>
  );
}

function getBadgeClass(status: string) {
  switch (status) {
    case "auto_approved":
    case "manager_approved":
    case "approve":
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    case "auto_rejected":
    case "manager_rejected":
    case "reject":
      return "bg-red-50 text-red-700 border-red-200";
    case "pending_manager":
      return "bg-amber-50 text-amber-700 border-amber-200";
    case "processing":
      return "bg-sky-50 text-sky-700 border-sky-200";
    default:
      return "bg-slate-50 text-slate-700 border-slate-200";
  }
}

function formatStatus(status: string) {
  const map: Record<string, string> = {
    processing: "Đang xử lý (AI)",
    pending_manager: "Chờ Quản Lý Duyệt",
    auto_approved: "Phê Duyệt Tự Động",
    auto_rejected: "Từ Chối Tự Động",
    manager_approved: "Đã Phê Duyệt",
    manager_rejected: "Đã Từ Chối"
  };
  return map[status] || status.toUpperCase();
}

const AGENT_META: Record<string, { name: string, icon: any, color: string, bg: string, role: string }> = {
  planner_agent: { name: "Planner Agent", icon: BrainCircuit, color: "text-[#005A9C]", bg: "bg-[#005A9C]/10", role: "Điều phối & Tổng hợp" },
  credit_agent: { name: "AI Tín dụng", icon: Calculator, color: "text-emerald-600", bg: "bg-emerald-100", role: "Đánh giá Năng lực tài chính" },
  compliance_agent: { name: "AI Tuân thủ", icon: ShieldCheck, color: "text-amber-600", bg: "bg-amber-100", role: "Kiểm soát Rủi ro & Pháp lý" },
  operations_agent: { name: "AI Vận hành", icon: Settings, color: "text-slate-600", bg: "bg-slate-100", role: "Soạn thảo Hợp đồng" }
};

export default function ApplicationDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [app, setApp] = useState<any>(null);
  const [traces, setTraces] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>("timeline");
  const [expandedTrace, setExpandedTrace] = useState<number | null>(0); // First trace open by default
  const feedEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const [appData, traceData] = await Promise.all([
          fetchApplication(id as string),
          fetchApplicationTrace(id as string)
        ]);
        const rawApp = (appData as any).data || appData;
        setApp(Array.isArray(rawApp) ? rawApp[0] : rawApp);
        const rawTrace = (traceData as any).data || traceData || [];
        setTraces(Array.isArray(rawTrace) ? rawTrace : [rawTrace]);
        // Automatically scroll to bottom of activity feed
        setTimeout(() => feedEndRef.current?.scrollIntoView({ behavior: "smooth" }), 500);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    if (id) loadData();
    
    // Polling for live updates if processing
    const interval = setInterval(() => {
      if (app?.final_status === "processing") {
         loadData();
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [id, app?.final_status]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="spinner w-8 h-8 border-4 border-[#005A9C]/20 border-t-[#005A9C]"></div>
        <p className="mt-4 text-slate-500 font-medium animate-pulse">Đang nạp không gian làm việc Đa tác nhân (Multi-Agent Workspace)...</p>
      </div>
    );
  }

  if (!app) {
    return (
      <div className="p-8 text-center">
        <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-3" />
        <h2 className="text-xl font-bold text-slate-800">Không tìm thấy hồ sơ</h2>
        <p className="text-slate-500 mt-2">Hồ sơ không tồn tại hoặc bạn không có quyền truy cập.</p>
        <button onClick={() => router.push('/employee')} className="mt-6 btn btn-outline">Quay lại Trang chủ</button>
      </div>
    );
  }

  // Derive pipeline status from traces
  const hasAgent = (name: string) => traces.some(t => t.agent_name === name);
  const isAgentDone = (name: string) => {
    const agentTraces = traces.filter(t => t.agent_name === name);
    if (agentTraces.length === 0) return false;
    const last = agentTraces[agentTraces.length - 1];
    const reasoning = (last.reasoning_text || last.reasoning || "").toLowerCase();
    return last.action_type === "decision" || reasoning.includes("hoàn tất") || reasoning.includes("approve") || reasoning.includes("completed");
  };
  
  const pipeline = [
    { id: "planner_agent", status: "completed" }, // Always completes initial planning
    { id: "credit_agent", status: hasAgent("credit_agent") ? (isAgentDone("credit_agent") || app.final_status !== "processing" ? "completed" : "running") : "waiting" },
    { id: "compliance_agent", status: hasAgent("compliance_agent") ? (isAgentDone("compliance_agent") || app.final_status !== "processing" ? "completed" : "running") : "waiting" },
    { id: "operations_agent", status: app.final_status && app.final_status !== "processing" && app.final_status.includes("approve") ? "completed" : "waiting" }
  ];

  return (
    <div className="max-w-[1600px] mx-auto p-4 md:p-6 pb-24">
      {/* 1. Header */}
      <div className="mb-6 bg-white rounded-xl shadow-sm border border-slate-200 p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <Link href="/employee" className="text-xs text-slate-500 hover:text-[#005A9C] font-medium transition-colors">
              Bảng điều khiển
            </Link>
            <span className="text-slate-300">/</span>
            <span className="text-xs text-slate-400 font-mono">ID: {app.id.substring(0,8).toUpperCase()}</span>
          </div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900">{app.customers?.full_name || "Khách hàng"}</h1>
            <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getBadgeClass(app.final_status)} flex items-center gap-1.5`}>
              {app.final_status === "processing" ? <span className="w-1.5 h-1.5 rounded-full bg-sky-500 animate-pulse"></span> : null}
              {formatStatus(app.final_status)}
            </span>
            {app.purpose && <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded text-xs border border-slate-200">{app.purpose}</span>}
          </div>
        </div>
        <div className="flex items-center gap-6 text-sm text-slate-500 bg-slate-50 px-4 py-2 rounded-lg border border-slate-100">
          <div>
            <span className="block text-[11px] uppercase tracking-wider text-slate-400">Thời gian tạo</span>
            <span className="font-medium text-slate-700">{new Date(app.created_at).toLocaleString('vi-VN')}</span>
          </div>
          <div className="w-px h-8 bg-slate-200"></div>
          <div>
            <span className="block text-[11px] uppercase tracking-wider text-slate-400">Người phụ trách</span>
            <span className="font-medium text-slate-700">Nguyễn Văn Đạt (NV1029)</span>
          </div>
        </div>
      </div>

      {/* Grid Layout: 3 Columns (25% - 50% - 25%) */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        
        {/* L1. Left Column (25%): Summary & Docs */}
        <div className="xl:col-span-1 space-y-6">
          {/* Business Summary */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="bg-slate-50 border-b border-slate-100 px-4 py-3 flex justify-between items-center">
              <h2 className="font-bold text-slate-800 text-sm">Tóm tắt Nghiệp vụ</h2>
            </div>
            <div className="p-4 space-y-4 text-sm">
              <div>
                <p className="text-slate-500 text-xs mb-1">Số tiền đề nghị</p>
                <p className="font-bold text-lg text-[#005A9C]">{app.amount_requested.toLocaleString('vi-VN')} VNĐ</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-slate-500 text-xs mb-1">Thời hạn</p>
                  <p className="font-medium text-slate-800">{app.loan_term_months} tháng</p>
                </div>
                <div>
                  <p className="text-slate-500 text-xs mb-1">Mức ưu tiên</p>
                  <p className="font-medium text-slate-800">Tiêu chuẩn</p>
                </div>
              </div>
              <div>
                <p className="text-slate-500 text-xs mb-1">Điểm tín dụng (CIF)</p>
                <p className={`font-bold ${app.customers?.credit_score >= 700 ? "text-emerald-600" : "text-amber-600"}`}>
                  {app.customers?.credit_score || "N/A"}
                </p>
              </div>
              <div>
                <p className="text-slate-500 text-xs mb-1">Tài sản bảo đảm</p>
                <p className="font-medium text-slate-800 truncate" title="Bất động sản tại Quận 1, TP.HCM">Bất động sản tại Quận 1, TP.HCM</p>
              </div>
            </div>
          </div>

          {/* Document Panel */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="bg-slate-50 border-b border-slate-100 px-4 py-3">
              <h2 className="font-bold text-slate-800 text-sm">Kho tài liệu</h2>
            </div>
            <div className="p-4 space-y-3">
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Đã tải lên (Input)</div>
              <a href="#" className="flex items-start gap-3 p-2 hover:bg-slate-50 rounded-lg transition-colors group">
                <FileText className="w-5 h-5 text-red-500 shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-700 group-hover:text-[#005A9C] truncate">Giay_phep_kinh_doanh.pdf</p>
                  <p className="text-xs text-slate-400">PDF • 1.2 MB</p>
                </div>
                <Download className="w-4 h-4 text-slate-300 group-hover:text-[#005A9C] opacity-0 group-hover:opacity-100 transition-opacity" />
              </a>
              <a href="#" className="flex items-start gap-3 p-2 hover:bg-slate-50 rounded-lg transition-colors group">
                <FileText className="w-5 h-5 text-emerald-500 shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-700 group-hover:text-[#005A9C] truncate">BCTC_2022.xlsx</p>
                  <p className="text-xs text-slate-400">Excel • 3.4 MB</p>
                </div>
                <Download className="w-4 h-4 text-slate-300 group-hover:text-[#005A9C] opacity-0 group-hover:opacity-100 transition-opacity" />
              </a>

              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 mt-4">AI Kiến tạo (Output)</div>
              {app.final_status?.includes("approve") ? (
                <a href="#" className="flex items-start gap-3 p-2 bg-emerald-50 border border-emerald-100 rounded-lg hover:border-emerald-200 transition-colors group">
                  <FileText className="w-5 h-5 text-emerald-600 shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-emerald-800 truncate">Hop_dong_tin_dung_AI.docx</p>
                    <p className="text-xs text-emerald-600/70">Word • Khởi tạo tự động</p>
                  </div>
                </a>
              ) : (
                <p className="text-sm text-slate-400 italic px-2">Chưa có tài liệu được AI tạo.</p>
              )}
            </div>
          </div>
        </div>

        {/* C2. Center Column (50%): Hero Workspace */}
        <div className="xl:col-span-2 space-y-6">
          
          {/* Timeline Orchestration */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                <BrainCircuit className="w-5 h-5 text-[#F58220]" /> Luồng Điều phối (Orchestration)
              </h2>
              <span className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded">Chế độ xem: Song song (Parallel)</span>
            </div>
            
            <div className="relative flex justify-between items-center px-4">
              {/* Connecting line */}
              <div className="absolute left-[10%] right-[10%] top-1/2 -translate-y-1/2 h-0.5 bg-slate-100 z-0"></div>
              
              {pipeline.map((step, idx) => {
                const meta = AGENT_META[step.id];
                const isRunning = step.status === "running";
                const isCompleted = step.status === "completed";
                const isWaiting = step.status === "waiting";
                
                return (
                  <div key={step.id} className="relative z-10 flex flex-col items-center gap-2 w-24">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center border-4 ${
                      isCompleted ? `bg-white ${meta.color.replace('text-', 'border-')}` :
                      isRunning ? `${meta.bg} border-white shadow-[0_0_15px_rgba(0,90,156,0.2)] animate-pulse` :
                      "bg-white border-slate-200 text-slate-300"
                    }`}>
                      {isCompleted ? <CheckCircle2 className={`w-6 h-6 ${meta.color}`} /> : 
                       isRunning ? <meta.icon className={`w-5 h-5 ${meta.color}`} /> :
                       <meta.icon className="w-5 h-5" />}
                    </div>
                    <div className="text-center">
                      <p className={`text-xs font-bold ${isCompleted || isRunning ? "text-slate-800" : "text-slate-400"}`}>{meta.name.replace('Agent', '').replace('AI', '').trim()}</p>
                      <p className={`text-[10px] uppercase tracking-wider ${
                        isCompleted ? "text-emerald-500" : isRunning ? "text-[#005A9C]" : "text-slate-300"
                      }`}>
                        {isCompleted ? "Hoàn tất" : isRunning ? "Đang xử lý" : "Đang chờ"}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Agent Workspace Panel */}
          <div className="bg-slate-900 rounded-xl shadow-lg border border-slate-800 overflow-hidden text-slate-300">
            <div className="bg-slate-800/50 border-b border-slate-700/50 px-4 py-3 flex gap-6 overflow-x-auto scrollbar-hide">
              <button className={`flex items-center gap-2 text-sm font-semibold whitespace-nowrap px-1 pb-2 border-b-2 transition-colors ${activeTab === 'timeline' ? 'text-white border-[#F58220]' : 'text-slate-500 border-transparent hover:text-slate-300'}`} onClick={() => setActiveTab('timeline')}>
                <Search className="w-4 h-4" /> Phân tích chi tiết (Agent Details)
              </button>
              <button className={`flex items-center gap-2 text-sm font-semibold whitespace-nowrap px-1 pb-2 border-b-2 transition-colors ${activeTab === 'rag' ? 'text-white border-[#F58220]' : 'text-slate-500 border-transparent hover:text-slate-300'}`} onClick={() => setActiveTab('rag')}>
                <BookOpen className="w-4 h-4" /> Kho tri thức (RAG & Citations)
              </button>
            </div>

            <div className="p-0 bg-slate-900 min-h-[400px] max-h-[600px] overflow-y-auto custom-scrollbar">
              {activeTab === 'timeline' && (
                <div className="divide-y divide-slate-800/50">
                  {traces.length === 0 ? (
                    <div className="p-8 text-center text-slate-500">Đang khởi tạo Môi trường Đa tác nhân (Multi-Agent Workspace)...</div>
                  ) : (
                    traces.map((t, idx) => {
                      const meta = AGENT_META[t.agent_name] || AGENT_META.planner_agent;
                      const isExpanded = expandedTrace === idx;
                      
                      // Identify tool calls (mocking visualization based on action string)
                      const isToolCall = t.action_type === "tool_call" || (t.reasoning_text || "").includes("Truy vấn") || (t.reasoning_text || "").includes("Kiểm tra");
                      const isDecision = t.action_type === "decision" || (t.reasoning_text || "").includes("Kết luận");

                      return (
                        <div key={idx} className="transition-colors hover:bg-slate-800/30">
                          {/* Header */}
                          <div 
                            className="p-4 flex items-start gap-4 cursor-pointer select-none"
                            onClick={() => setExpandedTrace(isExpanded ? null : idx)}
                          >
                            <div className={`w-8 h-8 rounded shrink-0 flex items-center justify-center ${meta.bg.replace('10', '20').replace('100', '20')} ${meta.color.replace('600', '400')}`}>
                              <meta.icon className="w-4 h-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-slate-100 text-sm">{meta.name}</span>
                                  {isToolCall && <span className="text-[10px] bg-sky-500/10 text-sky-400 border border-sky-500/20 px-2 py-0.5 rounded">⚡ Tool Call</span>}
                                  {isDecision && <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded">✓ Output</span>}
                                </div>
                                <span className="text-xs text-slate-500 font-mono">{new Date(t.created_at).toLocaleTimeString('vi-VN')}</span>
                              </div>
                              <p className="text-sm text-slate-400 truncate">{(t.action_type || t.action || "unknown").toUpperCase()}</p>
                            </div>
                            <ChevronDown className={`w-5 h-5 text-slate-600 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                          </div>
                          
                          {/* Expanded Content */}
                          {isExpanded && (
                            <div className="px-4 pb-5 pl-[60px]">
                              {isToolCall ? (
                                <div className="bg-slate-950 rounded border border-slate-800 p-3 mb-3">
                                  <div className="flex items-center gap-2 mb-2 text-sky-400 text-xs font-mono">
                                    <Database className="w-3 h-3" /> Calling Tool: query_core_banking()
                                  </div>
                                  <div className="text-sm text-slate-300 bg-slate-900/80 p-3 rounded-lg whitespace-pre-wrap font-mono leading-relaxed border border-slate-700/50 shadow-inner">
                                    {t.reasoning_text || t.reasoning || "(Không có nội dung)"}
                                  </div>
                                  <div className="mt-2 flex items-center justify-between text-xs text-emerald-500 font-mono">
                                    <span>Status: 200 OK</span>
                                    <span>Latency: 124ms</span>
                                  </div>
                                </div>
                              ) : (
                                <div className="space-y-3">
                                  <div>
                                    <div className="flex items-center gap-2 mb-3 border-b border-slate-700/50 pb-2">
                                      <BrainCircuit className="w-4 h-4 text-slate-400" />
                                      <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Tư duy (Reasoning)</span>
                                    </div>
                                    <div className="text-sm text-slate-300 bg-slate-900/40 p-4 rounded-xl border border-slate-700/30">
                                      <FormattedReasoning text={t.reasoning_text || t.reasoning || ""} />
                                    </div>
                                  </div>
                                  {isDecision && (
                                    <div className="bg-[#005A9C]/10 border border-[#005A9C]/30 p-3 rounded-lg flex items-start gap-3 mt-4">
                                      <CheckCircle2 className="w-5 h-5 text-sky-400 shrink-0" />
                                      <div>
                                        <p className="text-sm font-bold text-sky-400 mb-1">Kết luận cục bộ</p>
                                        <p className="text-sm text-slate-300">Hoàn thành nhiệm vụ được giao. Chuyển kết quả về Planner.</p>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              )}

              {activeTab === 'rag' && (
                <div className="p-6 space-y-6">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-lg bg-[#F58220]/10 flex items-center justify-center shrink-0">
                      <Search className="w-5 h-5 text-[#F58220]" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-100 text-base">Cơ sở Tri thức truy xuất (RAG)</h3>
                      <p className="text-sm text-slate-400 mt-1">Các AI Agents đã tra cứu tự động các văn bản nội bộ sau để làm căn cứ ra quyết định.</p>
                    </div>
                  </div>

                  <div className="space-y-4 pl-[56px]">
                    <div className="bg-slate-800/50 border border-slate-700 p-4 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-bold text-sky-400 text-sm flex items-center gap-2">
                          <FileText className="w-4 h-4" /> So_tay_tin_dung_SHB_2024.pdf
                        </span>
                        <span className="text-xs bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/20">Độ tin cậy: 94%</span>
                      </div>
                      <p className="text-sm text-slate-300 italic mb-2 border-l-2 border-sky-500/50 pl-3 py-1 bg-slate-900/50">
                        "...Khách hàng hạng ưu (Credit Score &gt; 700) được áp dụng tỷ lệ DTI tối đa lên tới 60%. Yêu cầu tài sản bảo đảm phải là BĐS tại các thành phố lớn."
                      </p>
                      <p className="text-xs text-slate-500">Citations: Chương 3, Điều 12, Khoản 2.</p>
                    </div>
                    
                    <div className="bg-slate-800/50 border border-slate-700 p-4 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-bold text-sky-400 text-sm flex items-center gap-2">
                          <FileText className="w-4 h-4" /> Danh_sach_den_AML_Q2.xlsx
                        </span>
                        <span className="text-xs bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/20">Độ tin cậy: 99%</span>
                      </div>
                      <p className="text-sm text-slate-300 italic mb-2 border-l-2 border-amber-500/50 pl-3 py-1 bg-slate-900/50">
                        "Không tìm thấy tên khách hàng {app.customers?.full_name} trong danh sách cấm vận hoặc rửa tiền."
                      </p>
                      <p className="text-xs text-slate-500">Dữ liệu được cập nhật ngày 01/07/2026.</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Decision Panel (Only show if processing is done) */}
          {app.final_status !== "processing" && (
            <div className={`rounded-xl shadow-lg border p-6 relative overflow-hidden ${
              app.final_status?.includes("approve") ? "bg-emerald-50 border-emerald-200" :
              app.final_status?.includes("reject") ? "bg-red-50 border-red-200" :
              "bg-amber-50 border-amber-200"
            }`}>
              {/* Background Icon */}
              <div className="absolute -right-6 -bottom-6 opacity-5">
                {app.final_status?.includes("approve") ? <CheckCircle2 className="w-48 h-48" /> : 
                 app.final_status?.includes("reject") ? <XCircle className="w-48 h-48" /> : 
                 <UserCheck className="w-48 h-48" />}
              </div>

              <div className="relative z-10">
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${
                    app.final_status?.includes("approve") ? "bg-emerald-100 text-emerald-600" :
                    app.final_status?.includes("reject") ? "bg-red-100 text-red-600" :
                    "bg-amber-100 text-amber-600"
                  }`}>
                    {app.final_status?.includes("approve") ? <CheckCircle2 className="w-6 h-6" /> : 
                     app.final_status?.includes("reject") ? <XCircle className="w-6 h-6" /> : 
                     <UserCheck className="w-6 h-6" />}
                  </div>
                  <div className="flex-1">
                    <h2 className="text-lg font-bold text-slate-900 mb-1">
                      KẾT LUẬN TỪ PLANNER: {app.final_status?.includes("approve") ? "ĐỀ XUẤT PHÊ DUYỆT" : 
                                            app.final_status?.includes("reject") ? "TỪ CHỐI" : 
                                            "CẦN QUẢN LÝ XEM XÉT"}
                    </h2>
                    <p className="text-sm text-slate-700 leading-relaxed mb-4">
                      Hệ thống Đa tác nhân (Multi-Agent) đã hoàn tất phân tích toàn diện 360 độ. Dựa trên số liệu DTI (Credit Agent) và kiểm tra rủi ro (Compliance Agent), hồ sơ đáp ứng đủ tiêu chuẩn tín dụng của SHB.
                    </p>
                    
                    <div className="grid grid-cols-2 gap-4 mb-6">
                      <div className="bg-white/60 rounded p-3 border border-white/40 shadow-sm">
                        <p className="text-xs text-slate-500 mb-1">Chỉ số rủi ro kinh doanh</p>
                        <p className="font-bold text-emerald-600">THẤP (Khuyên dùng)</p>
                      </div>
                      <div className="bg-white/60 rounded p-3 border border-white/40 shadow-sm">
                        <p className="text-xs text-slate-500 mb-1">Mức độ tự tin của AI</p>
                        <p className="font-bold text-[#005A9C]">95%</p>
                      </div>
                    </div>

                    {/* Human in the loop block */}
                    {app.final_status === "pending_manager" && (
                      <div className="bg-white rounded-lg p-5 shadow-sm border border-amber-100">
                        <h3 className="font-bold text-amber-800 text-sm mb-2 flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4" /> YÊU CẦU QUYẾT ĐỊNH (Human-in-the-loop)
                        </h3>
                        <p className="text-sm text-slate-600 mb-4">
                          AI không được phép tự động giải ngân số tiền trên 3 tỷ VNĐ. Vui lòng kiểm tra lại báo cáo và đưa ra quyết định cuối cùng.
                        </p>
                        <div className="flex gap-3">
                          <button className="btn bg-emerald-600 hover:bg-emerald-700 text-white font-medium shadow-sm">Phê duyệt ngay</button>
                          <button className="btn bg-red-600 hover:bg-red-700 text-white font-medium shadow-sm">Từ chối</button>
                          <button className="btn btn-outline border-slate-300">Yêu cầu bổ sung</button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* R3. Right Column (25%): Activity Feed */}
        <div className="xl:col-span-1">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden sticky top-6 flex flex-col h-[calc(100vh-100px)]">
            <div className="bg-slate-50 border-b border-slate-100 px-4 py-3 flex items-center justify-between shrink-0">
              <h2 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                <Activity className="w-4 h-4 text-[#F58220]" /> Live Feed
              </h2>
              {app.final_status === "processing" && (
                <span className="flex items-center gap-1 text-xs text-emerald-600 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span> Live
                </span>
              )}
            </div>
            
            <div className="p-4 flex-1 overflow-y-auto space-y-4 custom-scrollbar text-sm">
              <div className="flex gap-3">
                <div className="mt-1 shrink-0"><Clock className="w-3.5 h-3.5 text-slate-300" /></div>
                <div>
                  <p className="font-medium text-slate-700 text-xs mb-0.5">Khởi tạo hệ thống</p>
                  <p className="text-slate-500 text-xs">Yêu cầu vay {app.amount_requested.toLocaleString()} VNĐ được tạo mới.</p>
                </div>
              </div>

              {traces.map((t, i) => {
                const isCall = (t.action_type || t.action || "") === "tool_call" || (t.reasoning_text || t.reasoning || "").includes("Truy vấn");
                const isDecision = (t.action_type || t.action || "") === "decision";
                const meta = AGENT_META[t.agent_name] || AGENT_META.planner_agent;

                return (
                  <div key={i} className="flex gap-3 relative">
                    {/* Vertical line connector */}
                    {i !== traces.length - 1 && <div className="absolute left-[6.5px] top-5 bottom-[-16px] w-px bg-slate-100"></div>}
                    
                    <div className="mt-1 shrink-0 relative z-10">
                      <div className={`w-3.5 h-3.5 rounded-full border-2 bg-white ${isDecision ? 'border-emerald-500' : isCall ? 'border-sky-500' : 'border-[#F58220]'}`}></div>
                    </div>
                    <div className="pb-1">
                      <p className={`font-medium text-xs mb-0.5 ${isDecision ? 'text-emerald-700' : isCall ? 'text-sky-700' : 'text-slate-700'}`}>
                        {meta.name} {isDecision ? "đã kết luận" : isCall ? "đang gọi công cụ" : "đang xử lý"}
                      </p>
                      <div className="text-slate-500 text-xs mt-1">
                        {isCall ? (
                          <div className="flex items-center gap-1.5 text-sky-600 bg-sky-50 px-2 py-1 rounded-md w-fit border border-sky-100 font-medium">
                            <Wrench className="w-3 h-3" /> Tương tác API hệ thống lõi...
                          </div>
                        ) : (
                          <div className="line-clamp-2 leading-relaxed" title={t.reasoning_text || t.reasoning || ""}>
                            {t.reasoning_text || t.reasoning || "(Đang xử lý...)"}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
              
              {app.final_status === "processing" && (
                <div className="flex gap-3">
                  <div className="mt-1 shrink-0">
                    <div className="w-3.5 h-3.5 rounded-full border-2 border-slate-300 bg-white"></div>
                  </div>
                  <div>
                    <p className="font-medium text-slate-400 text-xs mb-0.5 animate-pulse">Đang thu thập dữ liệu...</p>
                  </div>
                </div>
              )}
              
              <div ref={feedEndRef} />
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
