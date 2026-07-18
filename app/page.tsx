"use client";

import Image from "next/image";
import Link from "next/link";
import { User, ShieldCheck, Settings } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-slate-50 relative overflow-hidden">
      {/* Background Decoration */}
      <div className="absolute top-0 w-full h-1/2 bg-gradient-to-b from-[#005A9C]/10 to-transparent pointer-events-none"></div>
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-[#F58220]/20 rounded-full blur-3xl opacity-50 pointer-events-none"></div>
      <div className="absolute top-40 -left-40 w-96 h-96 bg-[#005A9C]/20 rounded-full blur-3xl opacity-50 pointer-events-none"></div>

      <div className="z-10 text-center max-w-4xl mx-auto px-6">
        {/* Logo */}
        <div className="mb-8 flex justify-center">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 inline-block">
            <Image src="/logo.png" alt="SHB Logo" width={180} height={60} className="object-contain" priority />
            <div className="mt-4 border-t border-slate-100 pt-3">
              <div className="text-slate-800 font-bold text-2xl tracking-wide">
                AGENT<span className="text-[#F58220]">OS</span>
              </div>
              <div className="text-sm text-[#005A9C] font-semibold mt-1 tracking-widest uppercase">
                Banking Operations Platform
              </div>
            </div>
          </div>
        </div>

        <h1 className="text-3xl md:text-4xl font-bold text-slate-800 mb-4">
          Hệ sinh thái Đa Tác Nhân (Multi-Agent) cho Vận hành Nội bộ
        </h1>
        <p className="text-slate-600 mb-12 max-w-2xl mx-auto">
          Chọn phân hệ làm việc của bạn để tiếp tục. Hệ thống sẽ tự động điều hướng đến không gian làm việc chuyên biệt (Workspace) dành riêng cho vai trò của bạn.
        </p>

        {/* Roles Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto">
          {/* Employee */}
          <Link href="/employee" className="group">
            <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-[#005A9C]/50 transition-all duration-300 h-full flex flex-col items-center text-center cursor-pointer relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#005A9C]/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="w-16 h-16 rounded-full bg-[#005A9C]/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <User className="w-8 h-8 text-[#005A9C]" />
              </div>
              <h2 className="text-xl font-bold text-slate-800 mb-2">Nhân viên (RM)</h2>
              <p className="text-sm text-slate-500">Khởi tạo hồ sơ, giao tiếp với AI Trợ lý để tự động hoá nhập liệu.</p>
              <div className="mt-6 text-[#005A9C] font-semibold text-sm group-hover:translate-y-1 transition-transform">
                Đăng nhập →
              </div>
            </div>
          </Link>

          {/* Manager */}
          <Link href="/manager" className="group">
            <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-[#F58220]/50 transition-all duration-300 h-full flex flex-col items-center text-center cursor-pointer relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#F58220]/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="w-16 h-16 rounded-full bg-[#F58220]/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <ShieldCheck className="w-8 h-8 text-[#F58220]" />
              </div>
              <h2 className="text-xl font-bold text-slate-800 mb-2">Quản lý (Manager)</h2>
              <p className="text-sm text-slate-500">Xem xét hồ sơ ngoại lệ, phê duyệt tín dụng (Human-in-the-loop).</p>
              <div className="mt-6 text-[#F58220] font-semibold text-sm group-hover:translate-y-1 transition-transform">
                Đăng nhập →
              </div>
            </div>
          </Link>

          {/* Admin */}
          <Link href="/admin" className="group">
            <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-slate-400 transition-all duration-300 h-full flex flex-col items-center text-center cursor-pointer relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-b from-transparent to-slate-100 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Settings className="w-8 h-8 text-slate-600" />
              </div>
              <h2 className="text-xl font-bold text-slate-800 mb-2">Quản trị viên</h2>
              <p className="text-sm text-slate-500">Theo dõi nhật ký AI, vết tư duy (XAI) và đánh giá hiệu năng hệ thống.</p>
              <div className="mt-6 text-slate-600 font-semibold text-sm group-hover:translate-y-1 transition-transform">
                Đăng nhập →
              </div>
            </div>
          </Link>
        </div>

        <div className="mt-16 flex items-center justify-center gap-2 text-xs text-slate-400 font-semibold uppercase tracking-widest">
          <ShieldCheck className="w-4 h-4" />
          <span>Internal Use Only</span>
        </div>
      </div>
    </div>
  );
}
