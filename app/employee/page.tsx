"use client";

import { useEffect, useState } from "react";
import { fetchApplications, fetchRecentTraces } from "@/lib/api-client";
import Link from "next/link";
import { 
  AlertTriangle, 
  BrainCircuit, 
  Briefcase, 
  CheckCircle2, 
  Clock, 
  FileWarning, 
  Scale, 
  ShieldAlert, 
  Wallet,
  ArrowRight,
  Check
} from "lucide-react";

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount);
}

export default function EmployeeDashboard() {
  const [applications, setApplications] = useState<any[]>([]);
  const [traces, setTraces] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadData = () => {
      Promise.all([
        fetchApplications(),
        fetchRecentTraces(15)
      ])
      .then(([appRes, traceRes]) => {
        setApplications(appRes.data || []);
        setTraces(traceRes.data || []);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
    };

    loadData();
    // Refresh traces every 10 seconds
    const interval = setInterval(() => {
      fetchRecentTraces(15).then(res => setTraces(res.data || []));
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  // KPIs
  const processing = applications.filter(a => a.final_status === "processing").length;
  const actionRequired = applications.filter(a => a.final_status === "needs_info").length;
  const pendingManager = applications.filter(a => a.final_status === "pending_manager").length;
  const completed = applications.filter(a => ["auto_approved", "auto_rejected", "manager_approved", "manager_rejected"].includes(a.final_status)).length;
  const flagged = applications.filter(a => a.compliance_decision === "reject" || a.final_status === "manager_rejected").length;

  // Dynamic AI Workforce Status
  const hasProcessing = applications.some(a => a.final_status === "processing");
  let activeAgent = "";
  if (hasProcessing && traces.length > 0) {
    const processingAppIds = applications.filter(a => a.final_status === "processing").map(a => a.id);
    const latestTrace = traces.find(t => processingAppIds.includes(t.application_id));
    if (latestTrace) {
       activeAgent = latestTrace.agent_name;
    } else {
       activeAgent = "planner_agent"; // default if no trace yet but is processing
    }
  }

  const getAgentStatus = (agentName: string, stepIndex: number) => {
    if (!hasProcessing) return { text: "Sẵn sàng", color: "text-slate-300", dot: "bg-slate-400", bg: "bg-white/5 border-white/10 opacity-70", icon: "⏸" };
    
    const pipeline = ["planner_agent", "credit_agent", "compliance_agent", "operations_agent"];
    const activeIndex = pipeline.indexOf(activeAgent !== "" ? activeAgent : "planner_agent");
    
    if (stepIndex < activeIndex) return { text: "Hoàn tất", color: "text-white", dot: "bg-emerald-400", bg: "bg-white/10 border-white/20", icon: "✓" };
    if (stepIndex === activeIndex) return { text: "Đang xử lý", color: "text-white", dot: "bg-emerald-400 animate-pulse", bg: "bg-white/20 border-white/30 shadow-[0_0_10px_rgba(52,211,153,0.3)]", icon: "⚡" };
    return { text: "Đang chờ", color: "text-white/70", dot: "bg-amber-400 opacity-50", bg: "bg-white/5 border-white/10", icon: "⏳" };
  }

  const plannerStatus = getAgentStatus("planner_agent", 0);
  const creditStatus = getAgentStatus("credit_agent", 1);
  const complianceStatus = getAgentStatus("compliance_agent", 2);
  const opsStatus = getAgentStatus("operations_agent", 3);

  return (
    <div className="max-w-screen-2xl mx-auto flex flex-col xl:flex-row gap-6">
      
      {/* Main Content Area (70%) */}
      <div className="flex-1 flex flex-col gap-6">
        
        {/* Welcome Header */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Xin chào, Nguyễn Văn Đạt</h1>
            <p className="text-slate-500 mt-1">
              Hôm nay có <span className="font-bold text-[#005A9C]">{processing}</span> hồ sơ đang được AI xử lý tự động.
            </p>
          </div>
          <div className="hidden md:flex gap-3">
            <Link href="/employee/chat" className="btn btn-outline text-sm text-[#F58220] border-[#F58220]/30 hover:bg-[#F58220]/5">
              <BrainCircuit className="w-4 h-4" /> Trợ lý AI
            </Link>
            <Link href="/employee/new-loan" className="btn btn-primary text-sm shadow-md">
              + Tạo yêu cầu mới
            </Link>
          </div>
        </div>

        {/* AI Workforce Banner */}
        <div className="bg-[#005A9C] text-white rounded-xl p-4 shadow-sm flex flex-col 2xl:flex-row 2xl:items-center gap-4 justify-between">
          <div className="flex items-center gap-2 shrink-0">
            <BrainCircuit className="w-5 h-5 text-[#F58220]" />
            <span className="font-bold tracking-wide text-sm">AI WORKFORCE</span>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-sm flex-1">
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border ${plannerStatus.bg} transition-all`}>
              <span className={`w-2 h-2 rounded-full ${plannerStatus.dot} shrink-0`}></span>
              <span className={`font-semibold ${plannerStatus.color}`}>Planner</span> 
              <span className="opacity-90 text-xs ml-1">{plannerStatus.icon} <span className="hidden sm:inline">{plannerStatus.text}</span></span>
            </div>
            <ArrowRight className="w-4 h-4 text-white/30 shrink-0" />
            
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border ${creditStatus.bg} transition-all`}>
              <span className={`w-2 h-2 rounded-full ${creditStatus.dot} shrink-0`}></span>
              <span className={`font-semibold ${creditStatus.color}`}>Tín dụng</span> 
              <span className="opacity-90 text-xs ml-1">{creditStatus.icon} <span className="hidden sm:inline">{creditStatus.text}</span></span>
            </div>
            <ArrowRight className="w-4 h-4 text-white/30 shrink-0" />
            
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border ${complianceStatus.bg} transition-all`}>
              <span className={`w-2 h-2 rounded-full ${complianceStatus.dot} shrink-0`}></span>
              <span className={`font-semibold ${complianceStatus.color}`}>Tuân thủ</span> 
              <span className="opacity-90 text-xs ml-1">{complianceStatus.icon} <span className="hidden sm:inline">{complianceStatus.text}</span></span>
            </div>
            <ArrowRight className="w-4 h-4 text-white/30 shrink-0" />
            
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border ${opsStatus.bg} transition-all`}>
              <span className={`w-2 h-2 rounded-full ${opsStatus.dot} shrink-0`}></span>
              <span className={`font-semibold ${opsStatus.color}`}>Vận hành</span> 
              <span className="opacity-90 text-xs ml-1">{opsStatus.icon} <span className="hidden sm:inline">{opsStatus.text}</span></span>
            </div>
          </div>
        </div>

        {/* Priority Action Center */}
        {(actionRequired > 0 || flagged > 0) && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0 mt-0.5">
              <FileWarning className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <h3 className="font-bold text-red-800">Việc cần ưu tiên xử lý ngay!</h3>
              <ul className="mt-2 space-y-1 text-sm text-red-700">
                {actionRequired > 0 && <li>• Có {actionRequired} hồ sơ cần bổ sung thông tin chứng minh thu nhập.</li>}
                {flagged > 0 && <li>• Có {flagged} hồ sơ bị hệ thống Guardrail cảnh báo rủi ro AML. Cần rà soát.</li>}
              </ul>
            </div>
          </div>
        )}

        {/* Quick Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm cursor-pointer hover:border-[#005A9C] transition-colors">
            <div className="text-xs text-slate-500 font-semibold uppercase mb-1">AI đang xử lý</div>
            <div className="text-2xl font-bold text-[#005A9C]">{processing}</div>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm cursor-pointer hover:border-amber-500 transition-colors">
            <div className="text-xs text-slate-500 font-semibold uppercase mb-1">Chờ bổ sung hồ sơ</div>
            <div className="text-2xl font-bold text-amber-600">{actionRequired}</div>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm cursor-pointer hover:border-purple-500 transition-colors">
            <div className="text-xs text-slate-500 font-semibold uppercase mb-1">Chờ quản lý phê duyệt</div>
            <div className="text-2xl font-bold text-purple-600">{pendingManager}</div>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm cursor-pointer hover:border-emerald-500 transition-colors">
            <div className="text-xs text-slate-500 font-semibold uppercase mb-1">Đã hoàn thành</div>
            <div className="text-2xl font-bold text-emerald-600">{completed}</div>
          </div>
          <div className="bg-white p-4 rounded-xl border border-red-200 shadow-sm cursor-pointer hover:border-red-500 transition-colors">
            <div className="text-xs text-slate-500 font-semibold uppercase mb-1 text-red-600">Cảnh báo rủi ro</div>
            <div className="text-2xl font-bold text-red-600">{flagged}</div>
          </div>
        </div>

        {/* Recent Applications Table */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex-1 flex flex-col">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <h2 className="font-semibold text-slate-800">Danh sách hồ sơ gần đây</h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-left">
                  <th className="px-5 py-3 font-semibold text-slate-500 uppercase text-xs tracking-wider">Mã hồ sơ</th>
                  <th className="px-5 py-3 font-semibold text-slate-500 uppercase text-xs tracking-wider">Khách hàng</th>
                  <th className="px-5 py-3 font-semibold text-slate-500 uppercase text-xs tracking-wider">Sản phẩm</th>
                  <th className="px-5 py-3 font-semibold text-slate-500 uppercase text-xs tracking-wider">AI đang thực hiện</th>
                  <th className="px-5 py-3 font-semibold text-slate-500 uppercase text-xs tracking-wider">Trạng thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr><td colSpan={5} className="p-8 text-center text-slate-400">Đang tải dữ liệu...</td></tr>
                ) : applications.slice(0, 8).map(app => {
                  const isFlagged = app.compliance_decision === "reject" || app.credit_decision === "reject";
                  return (
                  <tr key={app.id} className="hover:bg-slate-50 transition-colors group cursor-pointer" onClick={() => window.location.href=`/employee/applications/${app.id}`}>
                    <td className="px-5 py-4 text-xs font-mono text-slate-400 group-hover:text-[#005A9C] transition-colors">
                      {app.id.substring(0, 8).toUpperCase()}
                    </td>
                    <td className="px-5 py-4">
                      <div className="font-semibold text-slate-800">{app.customers?.full_name || "N/A"}</div>
                      <div className="text-xs text-slate-500 mt-0.5">{formatCurrency(app.amount_requested)}</div>
                    </td>
                    <td className="px-5 py-4 text-slate-600">Vay SME</td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1.5">
                        {/* Planner Avatar */}
                        <div className="w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center border border-purple-200" title="Planner Agent: Hoàn tất">
                          <BrainCircuit className="w-3.5 h-3.5 text-purple-600" />
                        </div>
                        <ArrowRight className="w-3 h-3 text-slate-300" />
                        {/* Credit Avatar */}
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center border ${app.credit_decision ? 'bg-blue-100 border-blue-200' : 'bg-slate-100 border-slate-200 opacity-50'}`} title={`Credit Agent: ${app.credit_decision || 'Đang chờ'}`}>
                          <Wallet className={`w-3.5 h-3.5 ${app.credit_decision ? 'text-blue-600' : 'text-slate-400'}`} />
                        </div>
                        <ArrowRight className="w-3 h-3 text-slate-300" />
                        {/* Compliance Avatar */}
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center border ${app.compliance_decision ? (app.compliance_decision === 'reject' ? 'bg-red-100 border-red-200' : 'bg-amber-100 border-amber-200') : 'bg-slate-100 border-slate-200 opacity-50'}`} title={`Compliance Agent: ${app.compliance_decision || 'Đang chờ'}`}>
                          <Scale className={`w-3.5 h-3.5 ${app.compliance_decision ? (app.compliance_decision === 'reject' ? 'text-red-600' : 'text-amber-600') : 'text-slate-400'}`} />
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex flex-col gap-1 items-start">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                          app.final_status.includes('approved') ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                          app.final_status.includes('rejected') ? 'bg-red-50 text-red-700 border-red-200' :
                          app.final_status === 'pending_manager' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                          'bg-blue-50 text-blue-700 border-blue-200'
                        }`}>
                          {app.final_status.replace('_', ' ').toUpperCase()}
                        </span>
                        {/* Guardrail Status */}
                        {isFlagged && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-600">
                            <AlertTriangle className="w-3 h-3" /> CẦN QUẢN LÝ XEM XÉT
                          </span>
                        )}
                        {!isFlagged && app.final_status === 'pending_manager' && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-600">
                            <AlertTriangle className="w-3 h-3" /> AI CẦN XÁC NHẬN
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                )})}
              </tbody>
            </table>
            {applications.length === 0 && !loading && (
              <div className="p-12 text-center flex flex-col items-center">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                  <Briefcase className="w-8 h-8 text-slate-300" />
                </div>
                <h3 className="text-slate-700 font-semibold mb-1">Chưa có hồ sơ nào cần xử lý</h3>
                <p className="text-slate-500 text-sm mb-4">Bạn có thể tạo hồ sơ mới hoặc nhờ Trợ lý AI hỗ trợ.</p>
                <Link href="/employee/new-loan" className="btn btn-primary text-sm">
                  + Tạo yêu cầu mới
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Right Panel: AI Live Activity Feed (30%) */}
      <div className="xl:w-96 flex flex-col bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden h-[calc(100vh-8rem)] sticky top-4">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-2">
            <div className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </div>
            <h2 className="font-semibold text-slate-800">Hoạt động AI gần đây</h2>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {traces.length === 0 ? (
            <div className="text-center text-slate-400 text-sm mt-10">Đang đồng bộ dữ liệu với các Tác nhân AI...</div>
          ) : (
            traces.map((trace, idx) => {
              const isPlanner = trace.agent_name === "planner_agent";
              const isCredit = trace.agent_name === "credit_agent";
              const isCompliance = trace.agent_name === "compliance_agent";
              
              // Fake tool calls for visual effect in demo
              const renderToolCalls = () => {
                if (isPlanner) return <div className="text-[11px] text-emerald-700 font-mono mt-1.5 mb-1.5 space-y-0.5"><div className="flex items-center gap-1"><Check className="w-3 h-3"/> Đọc yêu cầu</div><div className="flex items-center gap-1"><Check className="w-3 h-3"/> Định tuyến Tín dụng</div></div>;
                if (isCredit) return <div className="text-[11px] text-emerald-700 font-mono mt-1.5 mb-1.5 space-y-0.5"><div className="flex items-center gap-1"><Check className="w-3 h-3"/> Tra cứu CIC</div><div className="flex items-center gap-1"><Check className="w-3 h-3"/> Tính DTI</div><div className="flex items-center gap-1"><Check className="w-3 h-3"/> Đọc Chính sách Tín dụng</div></div>;
                if (isCompliance) return <div className="text-[11px] text-emerald-700 font-mono mt-1.5 mb-1.5 space-y-0.5"><div className="flex items-center gap-1"><Check className="w-3 h-3"/> Kiểm tra AML</div><div className="flex items-center gap-1"><Check className="w-3 h-3"/> Quét danh sách đen</div></div>;
                return null;
              }

              return (
                <div key={idx} className="relative pl-6 border-l-2 border-slate-100 pb-2 last:pb-0">
                  <div className={`absolute -left-[11px] top-0 w-5 h-5 rounded-full border-2 border-white flex items-center justify-center ${
                    isPlanner ? 'bg-purple-100 text-purple-600' :
                    isCredit ? 'bg-blue-100 text-blue-600' :
                    'bg-amber-100 text-amber-600'
                  }`}>
                    {isPlanner ? <BrainCircuit className="w-3 h-3" /> : isCredit ? <Wallet className="w-3 h-3" /> : <Scale className="w-3 h-3" />}
                  </div>
                  
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                      {isPlanner ? 'Planner' : isCredit ? 'AI Tín dụng' : 'AI Tuân thủ'}
                    </span>
                    <span className="text-[10px] flex items-center gap-1 text-slate-400">
                      <Clock className="w-3 h-3" />
                      {new Date(trace.created_at).toLocaleTimeString()}
                    </span>
                  </div>
                  
                  <div className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                    <span className="font-mono text-[10px] text-slate-400 block mb-1 border-b border-slate-200 pb-1">
                      Hồ sơ: {trace.application_id?.substring(0,8).toUpperCase()}
                    </span>
                    {renderToolCalls()}
                    <span className="italic opacity-80">{trace.reasoning.length > 100 ? trace.reasoning.substring(0, 100) + '...' : trace.reasoning}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

    </div>
  );
}
