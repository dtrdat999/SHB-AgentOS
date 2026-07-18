import Link from "next/link";
import Image from "next/image";
import { 
  LayoutDashboard, 
  MessageSquare, 
  FileText,
  Activity,
  LogOut,
  Folder,
  BookOpen,
  User
} from "lucide-react";

const navGroups = [
  {
    title: "👨‍💼 KHÔNG GIAN NHÂN VIÊN (RM)",
    items: [
      { href: "/employee", label: "Trang chủ", icon: LayoutDashboard },
      { href: "/employee/new-loan", label: "Tạo yêu cầu mới", icon: FileText },
      { href: "#", label: "Hồ sơ của tôi", icon: Folder },
      { href: "/employee/chat", label: "Trợ lý AI", icon: MessageSquare, highlight: true },
      { href: "#", label: "Kho tri thức", icon: BookOpen },
      { href: "#", label: "Hồ sơ cá nhân", icon: User },
    ]
  }
];

export default function EmployeeLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="min-h-full flex h-full">
      {/* Sidebar */}
      <aside className="w-72 flex flex-col shrink-0 bg-white border-r border-slate-200 shadow-sm z-10 relative">
        {/* Logo Area */}
        <div className="p-6 border-b border-slate-100 flex flex-col items-center justify-center">
          <Image src="/logo.png" alt="SHB Logo" width={120} height={40} className="object-contain mb-3" />
          <div className="text-center">
            <div className="text-slate-800 font-bold text-lg tracking-wide">AGENT<span className="text-[#F58220]">OS</span></div>
            <div className="text-xs text-[#005A9C] font-semibold mt-0.5 tracking-wider">EMPLOYEE WORKSPACE</div>
          </div>
        </div>

        {/* Nav Area */}
        <nav className="flex-1 px-4 py-6 flex flex-col gap-6 overflow-y-auto">
          {navGroups.map((group, groupIdx) => (
            <div key={groupIdx}>
              <h3 className="px-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3">
                {group.title}
              </h3>
              <div className="flex flex-col gap-1">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isHighlight = item.highlight;
                  
                  return (
                    <Link 
                      key={item.label} 
                      href={item.href} 
                      className={`flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 font-medium text-sm ${
                        isHighlight 
                          ? 'bg-gradient-to-r from-[#F58220]/10 to-transparent text-[#F58220] border border-[#F58220]/20 hover:bg-[#F58220]/15 shadow-sm' 
                          : 'text-slate-600 hover:bg-slate-50 hover:text-[#005A9C]'
                      }`}
                    >
                      <Icon className={`w-4 h-4 ${isHighlight ? 'text-[#F58220]' : 'text-slate-400 group-hover:text-[#005A9C]'}`} />
                      <span>{item.label}</span>
                      {isHighlight && (
                        <span className="ml-auto flex h-2 w-2 relative">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#F58220] opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-[#F58220]"></span>
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Footer Area */}
        <div className="p-5 border-t border-slate-100 bg-slate-50/50">
          <Link href="/" className="flex items-center gap-3 text-slate-600 hover:text-red-500 transition-colors w-full px-2 py-2 rounded-lg hover:bg-red-50">
            <LogOut className="w-5 h-5" />
            <span className="text-sm font-semibold">Đăng xuất</span>
          </Link>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-auto bg-slate-50 relative">
        <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-slate-100 to-transparent pointer-events-none"></div>
        <div className="relative z-10 h-full p-4">
          {children}
        </div>
      </main>
    </div>
  );
}
