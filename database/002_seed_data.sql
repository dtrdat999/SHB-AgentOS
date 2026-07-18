-- ============================================================
-- SHB-AgentOS: Seed Data
-- Run AFTER 001_initial_schema.sql
-- ============================================================

-- ============================================================
-- 1. CUSTOMERS — 7 mock customers designed for specific test scenarios
-- ============================================================

INSERT INTO customers (id, full_name, date_of_birth, id_number, phone, email, address, monthly_income, existing_debt, credit_score, employment_type, employer_name, years_employed) VALUES

-- Case 1 & 2: Clean, low-risk customers → Auto-approve, Credit Agent only
('11111111-1111-1111-1111-111111111101',
 'Nguyễn Văn An', '1990-05-15', '001090012345', '0901234567',
 'an.nguyen@email.com', '123 Lý Thường Kiệt, Q.10, TP.HCM',
 45000000, 5000000, 750, 'full_time', 'FPT Software', 5),

('11111111-1111-1111-1111-111111111102',
 'Trần Thị Bình', '1988-03-22', '001088034567', '0912345678',
 'binh.tran@email.com', '456 Nguyễn Huệ, Q.1, TP.HCM',
 35000000, 3000000, 720, 'full_time', 'Vietcombank', 7),

-- Case 3: DTI borderline → Credit Agent reasons carefully
('11111111-1111-1111-1111-111111111103',
 'Lê Hoàng Cường', '1985-11-08', '001085056789', '0923456789',
 'cuong.le@email.com', '789 Điện Biên Phủ, Q.3, TP.HCM',
 25000000, 8000000, 650, 'self_employed', 'Cường Auto Shop', 3),

-- Case 4: AML watchlist → Compliance VETO
('11111111-1111-1111-1111-111111111104',
 'Phạm Đức Dũng', '1982-07-30', '001082078901', '0934567890',
 'dung.pham@email.com', '101 Hai Bà Trưng, Q.1, TP.HCM',
 80000000, 10000000, 800, 'full_time', 'Vingroup', 10),

-- Case 5: Large amount (> 2B VNĐ) → Guardrail force HITL
('11111111-1111-1111-1111-111111111105',
 'Hoàng Minh Tuấn', '1978-01-20', '001078090123', '0945678901',
 'tuan.hoang@email.com', '202 Phạm Ngọc Thạch, Q.3, TP.HCM',
 150000000, 20000000, 820, 'full_time', 'Samsung Vietnam', 15),

-- Case 6: Previously rejected → Memory/history awareness
('11111111-1111-1111-1111-111111111106',
 'Võ Thanh Hải', '1992-09-12', '001092012345', '0956789012',
 'hai.vo@email.com', '303 Cách Mạng Tháng 8, Q.10, TP.HCM',
 30000000, 12000000, 580, 'part_time', 'Freelance Designer', 2),

-- Case 7: DTI at exact threshold → Edge case reasoning
('11111111-1111-1111-1111-111111111107',
 'Đặng Thị Mai', '1995-04-18', '001095034567', '0967890123',
 'mai.dang@email.com', '404 Lê Lợi, Q.1, TP.HCM',
 40000000, 6000000, 700, 'full_time', 'Unilever Vietnam', 4);

-- ============================================================
-- 2. AML_WATCHLIST — Mock Anti-Money Laundering entries
-- ============================================================

INSERT INTO aml_watchlist (entity_name, entity_type, id_number, risk_level, reason, source) VALUES

-- Case 4 customer is on AML watchlist (by ID number match)
('Phạm Đức Dũng', 'individual', '001082078901', 'high',
 'Liên quan đến giao dịch đáng ngờ - Báo cáo STR #2024-0892',
 'Ngân hàng Nhà nước - Danh sách cảnh báo'),

-- Additional entries for realism
('Công ty TNHH Thương Mại XYZ', 'organization', NULL, 'medium',
 'Giao dịch chuyển tiền quốc tế bất thường',
 'FATF Advisory List'),

('Trần Văn Hùng', 'individual', '001075099999', 'high',
 'Đối tượng bị điều tra tội rửa tiền',
 'Bộ Công An - Danh sách truy nã');

-- ============================================================
-- 3. HISTORICAL LOAN — For Case 6 (previously rejected customer)
-- ============================================================

INSERT INTO loan_applications (
  id, customer_id, amount_requested, loan_term_months, purpose,
  dti_ratio, credit_decision, credit_reasoning,
  compliance_decision, compliance_reasoning, compliance_agent_called,
  guardrail_flags, confidence_level, final_status,
  submitted_at, decided_at
) VALUES (
  '22222222-2222-2222-2222-222222222201',
  '11111111-1111-1111-1111-111111111106',  -- Võ Thanh Hải
  200000000,                                -- 200 triệu
  24,
  'Mua xe máy và vốn kinh doanh',
  0.7333,                                   -- DTI 73.33% - quá cao
  'reject',
  'DTI ratio 73.33% vượt ngưỡng tối đa 50% theo Chính sách tín dụng v2.0. Thu nhập 30 triệu/tháng không đủ để đảm bảo khả năng trả nợ với tổng nợ hiện tại 12 triệu + khoản vay mới 200 triệu.',
  'flagged',
  'Khách hàng có credit score 580 - thuộc nhóm rủi ro cao. Cần thêm tài sản đảm bảo hoặc người bảo lãnh.',
  TRUE,
  '["high_dti_ratio"]'::jsonb,
  'low',
  'auto_rejected',
  '2024-06-15T10:30:00+07:00',
  '2024-06-15T10:32:15+07:00'
);

-- Historical audit log for the rejected application
INSERT INTO agent_action_log (agent_name, application_id, action_type, reasoning_text, created_at) VALUES
('credit_agent', '22222222-2222-2222-2222-222222222201', 'calculate_dti',
 'DTI = (12,000,000 + 200,000,000/24) / 45,000,000 = 73.33%. Vượt ngưỡng 50%.',
 '2024-06-15T10:31:00+07:00'),
('compliance_agent', '22222222-2222-2222-2222-222222222201', 'evaluate_compliance',
 'Credit score 580 thuộc nhóm high-risk. Đề xuất yêu cầu tài sản đảm bảo.',
 '2024-06-15T10:31:30+07:00'),
('planner_agent', '22222222-2222-2222-2222-222222222201', 'synthesize_final_decision',
 'Cả Credit Agent và Compliance Agent đều đánh giá tiêu cực. DTI vượt ngưỡng + credit score thấp. Tự động từ chối.',
 '2024-06-15T10:32:15+07:00');
