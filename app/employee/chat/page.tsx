"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { sendChatMessage, submitLoanApplication } from "@/lib/api-client";

export default function ChatPage() {
  const router = useRouter();
  const [messages, setMessages] = useState<any[]>([
    {
      role: "assistant",
      content: "Xin chào! Tôi là AI Tư vấn viên của SHB. Quý khách đang có nhu cầu vay vốn phải không ạ? Xin cho tôi biết số tiền Quý khách muốn vay và dự định dùng vào việc gì nhé!"
    }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading, processing]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || loading || processing) return;

    const userMsg = input.trim();
    setInput("");
    
    const newMessages = [...messages, { role: "user", content: userMsg }];
    setMessages(newMessages);
    setLoading(true);

    try {
      const res = await sendChatMessage(newMessages);
      const data = res.data;

      // Add AI reply
      setMessages((prev) => [...prev, { role: "assistant", content: data.response }]);

      // If AI collected all data, submit the loan!
      if (data.is_complete && data.submission_payload) {
        setProcessing(true);
        
        // Ensure customer_id is provided, otherwise mock one for demo
        const payload = data.submission_payload;
        if (!payload.customer_id) payload.customer_id = 'CUST-001';

        const submitRes = await submitLoanApplication(payload);
        
        // Wait a little bit for effect, then redirect to trace page
        setTimeout(() => {
          router.push(`/employee/applications/${submitRes.application_id}`);
        }, 1500);
      }
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Xin lỗi, đã có lỗi kết nối xảy ra. Vui lòng thử lại sau!" }
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col h-screen max-w-4xl mx-auto p-4 lg:p-6">
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-slate-900">AI Tư vấn viên (User Proxy Agent)</h1>
        <p className="text-sm text-slate-500 mt-1">Trò chuyện để hoàn thiện hồ sơ vay vốn tự động</p>
      </div>

      <div className="flex-1 card flex flex-col overflow-hidden p-0 relative shadow-lg">
        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-slate-50/50">
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`flex gap-3 max-w-[80%] ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
                
                {/* Avatar */}
                <div className="shrink-0 mt-1">
                  {msg.role === "assistant" ? (
                    <div className="w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center p-1 border border-slate-100 overflow-hidden">
                      <Image src="/logo.png" alt="SHB" width={24} height={24} className="object-contain" />
                    </div>
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 text-sm">
                      👤
                    </div>
                  )}
                </div>

                {/* Bubble */}
                <div className={`p-3.5 rounded-2xl text-[15px] leading-relaxed shadow-sm ${
                  msg.role === "user" 
                    ? "bg-orange-500 text-white rounded-tr-sm" 
                    : "bg-white border border-slate-200 text-slate-800 rounded-tl-sm"
                }`}>
                  {msg.content}
                </div>
              </div>
            </div>
          ))}

          {loading && !processing && (
            <div className="flex justify-start">
              <div className="flex gap-3 max-w-[80%]">
                <div className="w-8 h-8 shrink-0 rounded-full bg-white shadow-sm flex items-center justify-center p-1 border border-slate-100 mt-1">
                  <Image src="/logo.png" alt="SHB" width={24} height={24} className="object-contain opacity-50" />
                </div>
                <div className="p-4 rounded-2xl bg-white border border-slate-200 rounded-tl-sm flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-slate-300 animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-2 h-2 rounded-full bg-slate-300 animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-2 h-2 rounded-full bg-slate-300 animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Processing Overlay (When all data is gathered) */}
        {processing && (
          <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center z-10">
            <div className="w-16 h-16 rounded-2xl bg-white shadow-xl flex items-center justify-center p-2 mb-4 animate-pulse">
               <Image src="/logo.png" alt="SHB" width={48} height={48} className="object-contain" />
            </div>
            <h3 className="text-lg font-bold text-slate-800 mb-1">Đang xử lý hồ sơ...</h3>
            <p className="text-sm text-slate-500">Đang chuyển cho Planner Agent & Credit Agent</p>
            <div className="mt-4 flex gap-1">
               <div className="w-2 h-2 rounded-full bg-orange-400 animate-ping"></div>
               <div className="w-2 h-2 rounded-full bg-sky-400 animate-ping" style={{ animationDelay: '150ms' }}></div>
               <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" style={{ animationDelay: '300ms' }}></div>
            </div>
          </div>
        )}

        {/* Input Area */}
        <div className="p-4 bg-white border-t border-slate-100">
          <form onSubmit={handleSend} className="relative flex items-center">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={loading || processing}
              placeholder="Nhập tin nhắn (VD: Tôi muốn vay 500 triệu mua xe)..."
              className="w-full pl-4 pr-12 py-3.5 bg-slate-50 border border-slate-200 rounded-full text-[15px] focus:outline-none focus:border-orange-400 focus:bg-white transition-colors"
            />
            <button
              type="submit"
              disabled={!input.trim() || loading || processing}
              className="absolute right-2 w-9 h-9 rounded-full bg-orange-500 text-white flex items-center justify-center disabled:opacity-50 hover:bg-orange-600 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 translate-x-[1px] translate-y-[-1px]">
                <path d="M3.478 2.404a.75.75 0 0 0-.926.941l2.432 7.905H13.5a.75.75 0 0 1 0 1.5H4.984l-2.432 7.905a.75.75 0 0 0 .926.94 60.519 60.519 0 0 0 18.445-8.986.75.75 0 0 0 0-1.218A60.517 60.517 0 0 0 3.478 2.404Z" />
              </svg>
            </button>
          </form>
          <div className="text-center mt-2">
            <span className="text-[11px] text-slate-400">
              User Proxy Agent sẽ tự động phân tích và trích xuất dữ liệu để nộp hồ sơ.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
