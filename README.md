# 🏦 SHB-AgentOS: Hệ điều hành Đa tác nhân cho Vận hành Ngân hàng

**SHB-AgentOS** là một giải pháp Hệ thống Đa tác nhân (Multi-Agent System) chuyên biệt dành cho Khối Vận hành và Thẩm định Tín dụng của ngân hàng. Dự án giải quyết bài toán tự động hóa quy trình thẩm định hồ sơ vay vốn, giảm thiểu rủi ro con người, và tăng cường tốc độ ra quyết định thông qua sự phối hợp của nhiều AI Agents có vai trò chuyên biệt.

---

## 🎯 1. Vấn đề (Problem Statement)
Quy trình thẩm định và phê duyệt tín dụng truyền thống đang gặp các thách thức:
- **Tốn thời gian:** Nhân viên tín dụng phải tra cứu chéo nhiều hệ thống (Core Banking, CIC, hệ thống nội bộ).
- **Phân mảnh dữ liệu:** Thông tin từ phòng tín dụng, phòng tuân thủ (AML) và quản lý rủi ro thường xuyên bị ngắt quãng.
- **Tính tuân thủ:** Dễ xảy ra sai sót con người khi đối chiếu thủ công các quy định pháp lý phức tạp.
- **Thiếu minh bạch:** Khó khăn trong việc truy xuất lại lý do chính xác cho một quyết định phê duyệt/từ chối.

## 💡 2. Giải pháp (Solution)
Xây dựng một hệ thống **AI Multi-Agent** (Đa tác nhân) hoạt động như một hội đồng thẩm định ảo:
- **Tự động hóa luồng công việc (Orchestration):** Nhận hồ sơ, phân chia tác vụ, thu thập dữ liệu và ra kết luận tự động đối với các hồ sơ rõ ràng.
- **Tích hợp RAG (Retrieval-Augmented Generation):** Trợ lý AI tự động truy xuất các cẩm nang tín dụng, sổ tay nội bộ, và chính sách pháp luật mới nhất để làm căn cứ ra quyết định.
- **Human-in-the-loop (HITL):** Tự động phê duyệt các khoản vay nhỏ gọn, nhưng **bắt buộc** đẩy lên cho Quản lý phê duyệt (Manager Approval) đối với các khoản vay rủi ro cao hoặc vượt hạn mức (Guardrail).

---

## 🤖 3. Kiến trúc Đa tác nhân (Multi-Agent Architecture)

Hệ thống bao gồm 4 Agent chính, phối hợp theo mô hình **Hierarchical (Phân cấp)**:

1. **🧠 Planner Agent (Điều phối trưởng):**
   - Tiếp nhận hồ sơ từ người dùng.
   - Lập kế hoạch phân rã tác vụ (Task Decomposition).
   - Gọi các Agent chuyên trách.
   - Tổng hợp kết quả và ra kết luận cuối cùng (hoặc đẩy lên Manager).

2. **📊 Credit Agent (Chuyên viên Tín dụng AI):**
   - Tính toán chỉ số DTI (Debt-to-Income).
   - Đánh giá khả năng trả nợ dựa trên Credit Score và lịch sử tín dụng.
   - Áp dụng các chính sách lãi suất từ RAG.

3. **🛡️ Compliance Agent (Chuyên viên Tuân thủ AI):**
   - Quét tên và CMND qua danh sách đen (AML Watchlist).
   - Đối chiếu quy định pháp lý.
   - **Đặc quyền VETO:** Nếu phát hiện rủi ro AML, Compliance Agent có quyền phủ quyết toàn bộ hồ sơ, bất chấp chỉ số tài chính có tốt đến đâu.

4. **⚙️ Operations Agent (Chuyên viên Vận hành AI - Dự kiến):**
   - Tự động soạn thảo hợp đồng tín dụng sau khi hồ sơ được phê duyệt.

---

## 🛠️ 4. Công nghệ sử dụng (Tech Stack)

### Frontend (User Interface)
- **Framework:** Next.js 16 (App Router), React 19.
- **Styling:** Tailwind CSS v4, Lucide React Icons.
- **Tính năng nổi bật:** Live Tracing UI (Hiển thị luồng tư duy của AI theo thời gian thực), Hero Screen Layout với Dashboard 3 cột trực quan.

### Backend (AI & Logic)
- **Framework:** Python 3.10+, FastAPI.
- **AI Core:** OpenAI API (Hỗ trợ cấu hình Prompt chuyên sâu, Structured Output JSON).
- **Kiến trúc:** ReAct (Reasoning and Acting) cho phép AI gọi Tools.

### Cơ sở dữ liệu (Database)
- **Supabase (PostgreSQL):** Lưu trữ hồ sơ, lịch sử trace (Agent Action Logs), phân quyền.
- **pgvector:** Lưu trữ embedding vector dùng cho tính năng RAG.

---

## 📁 5. Cấu trúc thư mục (Project Structure)
```text
SHB-AgentOS/
├── api/                   # Backend Python FastAPI
│   ├── agents/            # Chứa logic của từng Agent (planner, credit, compliance)
│   ├── index.py           # Điểm vào (Entry point) của FastAPI
│   ├── tools.py           # Các function tools cho AI gọi (tính DTI, check AML)
│   └── rag.py             # Logic xử lý Retrieval-Augmented Generation
├── app/                   # Frontend Next.js (App Router)
│   ├── employee/          # Màn hình cho nhân viên tín dụng
│   │   ├── new-loan/      # Giao diện tạo hồ sơ mới
│   │   └── applications/  # Giao diện chi tiết hồ sơ & Live Tracing
│   ├── manager/           # Màn hình phê duyệt cho cấp Quản lý (HITL)
│   └── api/               # Next.js API Routes (Proxy gọi sang FastAPI)
├── database/              # Scripts SQL khởi tạo CSDL
│   ├── 001_initial_schema.sql # Tạo bảng, pgvector
│   └── 002_seed_data.sql  # Tạo dữ liệu mẫu (Mock data)
├── lib/                   # Các hàm tiện ích frontend (api-client)
└── package.json           # Cấu hình project Node.js
```

---

## 🚀 6. Hướng dẫn Cài đặt & Chạy (Setup & Run)

### Yêu cầu hệ thống
- Node.js (v18+)
- Python (3.10+)
- Tài khoản Supabase
- OpenAI API Key

### Bước 1: Khởi tạo CSDL trên Supabase
1. Mở SQL Editor trên Supabase.
2. Chạy `database/001_initial_schema.sql` để tạo cấu trúc bảng.
3. Chạy `database/002_seed_data.sql` để tạo 4 hồ sơ mẫu (phục vụ Demo).

### Bước 2: Cài đặt biến môi trường
Tạo file `.env` ở thư mục gốc:
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_key

# OpenAI
OPENAI_API_KEY=your_openai_key
```

### Bước 3: Chạy ứng dụng
Cần chạy song song cả 2 môi trường (Mở 2 terminal):

**Terminal 1 (Chạy Frontend Next.js):**
```bash
npm install
npm run dev
# App chạy tại: http://localhost:3000
```

**Terminal 2 (Chạy Backend FastAPI):**
```bash
pip install -r api/requirements.txt
npm run dev:py
# API chạy tại: http://localhost:8000
```

