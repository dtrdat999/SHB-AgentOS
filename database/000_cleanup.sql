-- ============================================================
-- SHB-AgentOS: CLEANUP SCRIPT
-- Chạy script này TRƯỚC khi chạy lại 002_seed_data.sql
-- Xóa theo đúng thứ tự: bảng con → bảng cha (tránh foreign key error)
-- ============================================================

-- 1. Bảng con nhất (không có bảng nào tham chiếu đến chúng)
DELETE FROM manager_approvals;
DELETE FROM agent_action_log;
DELETE FROM task_states;

-- 2. Bảng trung gian
DELETE FROM loan_applications;

-- 3. Bảng độc lập (không có quan hệ)
DELETE FROM aml_watchlist;
DELETE FROM customers;

-- (Không xóa policy_documents — đây là dữ liệu RAG, giữ lại)
-- Nếu muốn xóa luôn policy_documents, thêm dòng sau:
-- DELETE FROM policy_documents;

-- ============================================================
-- Sau khi chạy xong, chạy tiếp 002_seed_data.sql
-- ============================================================
