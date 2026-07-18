"use client";

import { useEffect, useState } from "react";
import { fetchCustomers, submitLoanApplication } from "@/lib/api-client";
import { useRouter } from "next/navigation";
import { BrainCircuit, UploadCloud, CheckCircle2, AlertTriangle, FileText, Trash2, ArrowRight, X } from "lucide-react";
import Link from "next/link";

export default function NewApplicationPage() {
  const router = useRouter();
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Form state
  const [requestType, setRequestType] = useState("Vay vốn doanh nghiệp SME");
  const [customerId, setCustomerId] = useState("");
  const [amount, setAmount] = useState("");
  const [termMonths, setTermMonths] = useState("12");
  const [purpose, setPurpose] = useState("Kinh doanh");
  const [files, setFiles] = useState<File[]>([]); // mock files

  // Selected customer info
  const selectedCustomer = customers.find((c) => c.id === customerId);

  useEffect(() => {
    fetchCustomers()
      .then((res) => {
        setCustomers(res.data || []);
        if (res.data?.length > 0) setCustomerId(res.data[0].id);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      const res = await submitLoanApplication({
        customer_id: customerId,
        amount_requested: parseFloat(amount),
        loan_term_months: parseInt(termMonths),
        purpose,
      });
      // Redirect immediately per UX spec
      if (res?.application_id) {
        router.push(`/employee/applications/${res.application_id}`);
      } else {
        setError("Không nhận được mã hồ sơ từ hệ thống.");
        setSubmitting(false);
      }
    } catch (err: any) {
      setError(err.message);
      setSubmitting(false);
    }
  }

  function formatCurrency(val: string) {
    const num = parseFloat(val);
    if (isNaN(num)) return "";
    return new Intl.NumberFormat("vi-VN").format(num);
  }

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[calc(100vh-100px)]">
        <div className="spinner"></div>
        <span className="ml-3 text-slate-500 font-medium">Đang đồng bộ dữ liệu Core Banking...</span>
      </div>
    );
  }

  // Pre-check logic (mock)
  const isComplete = amount !== "" && parseFloat(amount) > 0 && customerId !== "";

  return (
    <div className="pb-24">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 p-6 sticky top-0 z-10">
        <div className="max-w-screen-2xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Tạo yêu cầu mới</h1>
            <p className="text-sm text-slate-500 mt-1">
              Nhập thông tin nghiệp vụ để AI tiếp nhận và điều phối xử lý.
            </p>
          </div>
          {/* Breadcrumb / Progress optional */}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="max-w-screen-2xl mx-auto p-6 flex flex-col xl:flex-row gap-6 items-start">
        {/* Main Form Area (70%) */}
        <div className="flex-1 w-full space-y-6">
          
          {/* Category */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="bg-slate-50 px-5 py-4 border-b border-slate-100">
              <h2 className="font-semibold text-slate-800">1. Phân loại yêu cầu</h2>
            </div>
            <div className="p-5">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {["Hồ sơ vay cá nhân", "Vay vốn doanh nghiệp SME", "Tăng hạn mức tín dụng", "Gia hạn khoản vay", "Kiểm tra hồ sơ pháp lý", "Yêu cầu vận hành"].map(type => (
                  <label key={type} className={`border rounded-lg p-3 cursor-pointer transition-all ${requestType === type ? 'border-[#F58220] bg-[#F58220]/5 ring-1 ring-[#F58220]' : 'border-slate-200 hover:border-slate-300'}`}>
                    <div className="flex items-center gap-2">
                      <input type="radio" name="reqType" value={type} checked={requestType === type} onChange={(e) => setRequestType(e.target.value)} className="text-[#F58220] focus:ring-[#F58220]" />
                      <span className="text-sm font-medium text-slate-700">{type}</span>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Customer Info */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="bg-slate-50 px-5 py-4 border-b border-slate-100 flex justify-between items-center">
              <h2 className="font-semibold text-slate-800">2. Thông tin Khách hàng</h2>
              <span className="text-xs bg-[#005A9C]/10 text-[#005A9C] px-2 py-1 rounded font-medium">Tìm kiếm từ Core</span>
            </div>
            <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="md:col-span-2">
                <label className="label">Mã khách hàng (CIF) / Tên khách hàng <span className="text-red-500">*</span></label>
                <select
                  className="input border-slate-300 focus:border-[#005A9C] focus:ring-[#005A9C]/20"
                  value={customerId}
                  onChange={(e) => setCustomerId(e.target.value)}
                  required
                >
                  <option value="" disabled>-- Chọn khách hàng --</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.full_name} (CIF: {c.id.substring(0,8).toUpperCase()})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label">Loại khách hàng</label>
                <input type="text" className="input bg-slate-50 text-slate-500" value={selectedCustomer?.employment_type === 'business' ? "Doanh nghiệp" : "Cá nhân"} disabled />
              </div>
              
              <div>
                <label className="label">Số điện thoại</label>
                <input type="text" className="input bg-slate-50 text-slate-500" value="0901234567" disabled />
              </div>

              <div>
                <label className="label">Người phụ trách (RM)</label>
                <input type="text" className="input bg-slate-50 text-slate-500" value="Nguyễn Văn Đạt (NV1029)" disabled />
              </div>

              <div>
                <label className="label">Điểm tín dụng (Từ Core)</label>
                <div className="flex items-center h-[42px] px-3 bg-slate-50 border border-slate-200 rounded-lg">
                  <span className={`font-bold ${selectedCustomer?.credit_score >= 700 ? "text-emerald-600" : selectedCustomer?.credit_score >= 600 ? "text-amber-600" : "text-red-600"}`}>
                    {selectedCustomer?.credit_score || "N/A"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Business Info */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="bg-slate-50 px-5 py-4 border-b border-slate-100">
              <h2 className="font-semibold text-slate-800">3. Thông tin Nghiệp vụ</h2>
            </div>
            <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="label">Sản phẩm vay</label>
                <select className="input border-slate-300 focus:border-[#005A9C] focus:ring-[#005A9C]/20">
                  <option>Cho vay vốn lưu động siêu tốc</option>
                  <option>Cho vay đầu tư tài sản cố định</option>
                  <option>Tài trợ chuỗi cung ứng</option>
                </select>
              </div>

              <div>
                <label className="label">Số tiền đề nghị (VNĐ) <span className="text-red-500">*</span></label>
                <input
                  type="number"
                  className="input border-slate-300 focus:border-[#005A9C] focus:ring-[#005A9C]/20"
                  placeholder="Nhập số tiền..."
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                  min="1000000"
                />
                <div className="text-xs text-[#005A9C] mt-1.5 font-medium h-4">
                  {amount && formatCurrency(amount) + " VNĐ"}
                </div>
              </div>

              <div>
                <label className="label">Thời hạn (Tháng) <span className="text-red-500">*</span></label>
                <select
                  className="input border-slate-300 focus:border-[#005A9C] focus:ring-[#005A9C]/20"
                  value={termMonths}
                  onChange={(e) => setTermMonths(e.target.value)}
                >
                  <option value="6">6 tháng</option>
                  <option value="12">12 tháng</option>
                  <option value="24">24 tháng</option>
                  <option value="36">36 tháng</option>
                  <option value="60">60 tháng</option>
                </select>
              </div>

              <div>
                <label className="label">Mục đích vay <span className="text-red-500">*</span></label>
                <select
                  className="input border-slate-300 focus:border-[#005A9C] focus:ring-[#005A9C]/20"
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                >
                  <option>Kinh doanh</option>
                  <option>Bổ sung vốn lưu động</option>
                  <option>Thanh toán L/C</option>
                  <option>Đầu tư dự án</option>
                  <option>Tiêu dùng cá nhân</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="label">Tài sản bảo đảm</label>
                <input type="text" className="input border-slate-300 focus:border-[#005A9C] focus:ring-[#005A9C]/20" placeholder="VD: Bất động sản, Giấy tờ có giá, Máy móc thiết bị..." defaultValue="Bất động sản tại Quận 1, TP.HCM" />
              </div>
            </div>
          </div>

          {/* Upload */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="bg-slate-50 px-5 py-4 border-b border-slate-100 flex justify-between items-center">
              <h2 className="font-semibold text-slate-800">4. Hồ sơ đính kèm</h2>
              <span className="text-xs text-slate-500">Tối đa 15 files (PDF, JPG, XLSX)</span>
            </div>
            <div className="p-5">
              <div className="border-2 border-dashed border-slate-300 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors flex flex-col items-center justify-center py-10 cursor-pointer">
                <UploadCloud className="w-10 h-10 text-slate-400 mb-3" />
                <p className="text-sm text-slate-700 font-medium">Kéo thả tài liệu vào đây hoặc <span className="text-[#005A9C]">Nhấn để chọn file</span></p>
                <p className="text-xs text-slate-400 mt-1">Dung lượng tối đa 25MB/file</p>
              </div>

              {/* Mock file list */}
              <div className="mt-4 space-y-2">
                <div className="flex items-center justify-between p-3 border border-slate-200 rounded-lg bg-white">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-red-50 text-red-600 rounded">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-700">Giay_phep_kinh_doanh_2023.pdf</p>
                      <p className="text-xs text-slate-400">1.2 MB</p>
                    </div>
                  </div>
                  <button type="button" className="p-2 text-slate-400 hover:text-red-500 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex items-center justify-between p-3 border border-slate-200 rounded-lg bg-white">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-50 text-green-600 rounded">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-700">BCTC_2022_Kiem_toan.xlsx</p>
                      <p className="text-xs text-slate-400">3.4 MB</p>
                    </div>
                  </div>
                  <button type="button" className="p-2 text-slate-400 hover:text-red-500 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* AI Panel (30%) */}
        <div className="w-full xl:w-[350px] shrink-0 space-y-6 xl:sticky xl:top-[104px]">
          {/* Pre-check */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="bg-slate-800 px-5 py-4 flex items-center gap-2">
              <BrainCircuit className="w-5 h-5 text-[#F58220]" />
              <h3 className="font-semibold text-white">AI Pre-check</h3>
            </div>
            <div className="p-5">
              {isComplete ? (
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-slate-800">Thông tin cơ bản đầy đủ</p>
                      <p className="text-xs text-slate-500 mt-0.5">Sẵn sàng để AI phân tích tín dụng.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-slate-800">Cảnh báo pháp lý (Gợi ý)</p>
                      <p className="text-xs text-slate-500 mt-0.5">Có vẻ thiếu BCTC năm gần nhất. Tuân thủ có thể sẽ request bổ sung.</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-3 opacity-60">
                  <AlertTriangle className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-slate-600">Đang chờ thông tin...</p>
                    <p className="text-xs text-slate-500 mt-0.5">AI sẽ tự động kiểm tra khi bạn nhập số tiền và khách hàng.</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* AI Workflow Summary */}
          <div className="bg-sky-50 rounded-xl border border-sky-200 overflow-hidden">
            <div className="px-5 py-3 border-b border-sky-200/60 flex items-center justify-between">
              <h3 className="font-semibold text-[#005A9C] text-sm">Luồng điều phối dự kiến</h3>
            </div>
            <div className="p-5">
              <div className="relative">
                <div className="absolute left-[11px] top-4 bottom-4 w-0.5 bg-sky-200"></div>
                <div className="space-y-4 relative z-10">
                  <div className="flex items-center gap-3">
                    <div className={`w-6 h-6 rounded-full text-white flex items-center justify-center shrink-0 transition-all ${submitting ? 'bg-[#F58220] shadow-[0_0_10px_rgba(245,130,32,0.5)] animate-pulse' : 'bg-[#005A9C]'}`}>
                      {submitting ? <div className="w-3 h-3 rounded-full border-2 border-white/30 border-t-white animate-spin"></div> : <BrainCircuit className="w-3 h-3" />}
                    </div>
                    <div>
                      <p className={`text-sm font-bold ${submitting ? 'text-[#F58220]' : 'text-slate-800'}`}>Planner Agent</p>
                      <p className="text-[11px] text-slate-500">{submitting ? 'Đang khởi tạo Môi trường đa tác nhân...' : 'Tiếp nhận & Lập kế hoạch'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 opacity-60">
                    <div className="w-6 h-6 rounded-full bg-white border-2 border-sky-300 flex items-center justify-center shrink-0">
                      <span className="w-2 h-2 rounded-full bg-sky-400"></span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-700">AI Tín dụng</p>
                      <p className="text-[11px] text-slate-500">Tính DTI, Check dư nợ</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 opacity-60">
                    <div className="w-6 h-6 rounded-full bg-white border-2 border-sky-300 flex items-center justify-center shrink-0">
                      <span className="w-2 h-2 rounded-full bg-sky-400"></span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-700">AI Tuân thủ</p>
                      <p className="text-[11px] text-slate-500">Kiểm tra AML, Chính sách</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 opacity-60">
                    <div className="w-6 h-6 rounded-full bg-[#005A9C]/50 text-white flex items-center justify-center shrink-0">
                      <CheckCircle2 className="w-3 h-3" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-500">Tổng hợp & Đề xuất</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {error && (
            <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
              ❌ {error}
            </div>
          )}

        </div>
      </form>

      {/* Sticky Footer Actions */}
      <div className="fixed bottom-0 left-0 right-0 lg:left-64 bg-white border-t border-slate-200 p-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-20">
        <div className="max-w-screen-2xl mx-auto flex items-center justify-between px-2">
          <Link href="/employee" className="text-slate-500 hover:text-slate-700 text-sm font-medium px-4 py-2 rounded-lg hover:bg-slate-100 transition-colors">
            Hủy
          </Link>
          <div className="flex items-center gap-3">
            <button type="button" className="btn btn-outline border-slate-300 text-slate-700 hover:bg-slate-50">
              Lưu bản nháp
            </button>
            <button
              type="submit"
              disabled={submitting || !isComplete}
              onClick={handleSubmit}
              className="btn bg-[#005A9C] hover:bg-[#004a82] text-white font-medium px-6 shadow-md transition-all disabled:opacity-50 flex items-center gap-2"
            >
              {submitting ? (
                <>
                  <div className="spinner w-4 h-4 border-2 border-white/30 border-t-white"></div>
                  <span>Đang khởi tạo luồng...</span>
                </>
              ) : (
                <>
                  Gửi AI xử lý <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
