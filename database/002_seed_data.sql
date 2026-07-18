-- ============================================================
-- SHB-AgentOS: Full Seed Data with Agent Traces
-- Run AFTER 001_initial_schema.sql
-- This file creates realistic demo data for all screens
-- ============================================================

-- ============================================================
-- 1. CUSTOMERS — 7 mock customers for different test scenarios
-- ============================================================

INSERT INTO customers (id, full_name, date_of_birth, id_number, phone, email, address, monthly_income, existing_debt, credit_score, employment_type, employer_name, years_employed) VALUES

-- Case 1: Clean, high-income → Auto-approve (Credit only)
('11111111-1111-1111-1111-111111111101',
 'Nguyễn Văn An', '1990-05-15', '001090012345', '0901234567',
 'an.nguyen@email.com', '123 Lý Thường Kiệt, Q.10, TP.HCM',
 45000000, 5000000, 750, 'full_time', 'FPT Software', 5),

-- Case 2: Good profile → Auto-approve
('11111111-1111-1111-1111-111111111102',
 'Trần Thị Bình', '1988-03-22', '001088034567', '0912345678',
 'binh.tran@email.com', '456 Nguyễn Huệ, Q.1, TP.HCM',
 35000000, 3000000, 720, 'full_time', 'Vietcombank', 7),

-- Case 3: DTI borderline → Credit Agent reasons carefully
('11111111-1111-1111-1111-111111111103',
 'Lê Hoàng Cường', '1985-11-08', '001085056789', '0923456789',
 'cuong.le@email.com', '789 Điện Biên Phủ, Q.3, TP.HCM',
 25000000, 8000000, 650, 'self_employed', 'Cường Auto Shop', 3),

-- Case 4: AML watchlist hit → Compliance VETO
('11111111-1111-1111-1111-111111111104',
 'Phạm Đức Dũng', '1982-07-30', '001082078901', '0934567890',
 'dung.pham@email.com', '101 Hai Bà Trưng, Q.1, TP.HCM',
 80000000, 10000000, 800, 'full_time', 'Vingroup', 10),

-- Case 5: Large amount (>3B VNĐ) → Guardrail force HITL
('11111111-1111-1111-1111-111111111105',
 'Hoàng Minh Tuấn', '1978-01-20', '001078090123', '0945678901',
 'tuan.hoang@email.com', '202 Phạm Ngọc Thạch, Q.3, TP.HCM',
 150000000, 20000000, 820, 'full_time', 'Samsung Vietnam', 15),

-- Case 6: Previously rejected → Memory/history awareness
('11111111-1111-1111-1111-111111111106',
 'Võ Thanh Hải', '1992-09-12', '001092012345', '0956789012',
 'hai.vo@email.com', '303 Cách Mạng Tháng 8, Q.10, TP.HCM',
 30000000, 12000000, 580, 'part_time', 'Freelance Designer', 2),

-- Case 7: DTI at exact threshold → Edge case
('11111111-1111-1111-1111-111111111107',
 'Đặng Thị Mai', '1995-04-18', '001095034567', '0967890123',
 'mai.dang@email.com', '404 Lê Lợi, Q.1, TP.HCM',
 40000000, 6000000, 700, 'full_time', 'Unilever Vietnam', 4);

-- ============================================================
-- 2. AML_WATCHLIST
-- ============================================================

INSERT INTO aml_watchlist (entity_name, entity_type, id_number, risk_level, reason, source) VALUES

('Phạm Đức Dũng', 'individual', '001082078901', 'high',
 'Liên quan đến giao dịch đáng ngờ - Báo cáo STR #2024-0892',
 'Ngân hàng Nhà nước - Danh sách cảnh báo'),

('Công ty TNHH Thương Mại XYZ', 'organization', NULL, 'medium',
 'Giao dịch chuyển tiền quốc tế bất thường',
 'FATF Advisory List'),

('Trần Văn Hùng', 'individual', '001075099999', 'high',
 'Đối tượng bị điều tra tội rửa tiền',
 'Bộ Công An - Danh sách truy nã');

-- ============================================================
-- 3. DEMO APPLICATIONS with full AI decisions
-- ============================================================

-- App A: Auto-approved (Nguyễn Văn An - Case 1)
INSERT INTO loan_applications (
  id, customer_id, amount_requested, loan_term_months, purpose,
  dti_ratio, credit_decision, credit_reasoning,
  compliance_decision, compliance_reasoning, compliance_agent_called,
  guardrail_flags, confidence_level, final_status,
  submitted_at, decided_at
) VALUES (
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  '11111111-1111-1111-1111-111111111101',
  500000000, 36, 'Mua căn hộ tại Q.7 TP.HCM',
  0.3370,
  'approve',
  'DTI = (5,000,000 + 500,000,000/36) / 45,000,000 = 33.7%. Nằm trong ngưỡng 50% theo chính sách. Credit score 750 - thuộc nhóm ưu tiên. Lịch sử tín dụng sạch. Khuyến nghị phê duyệt.',
  'approve',
  'Không có tên trong danh sách AML/Blacklist. Tuổi 34 - đủ điều kiện theo quy định. Số tiền 500M không vượt ngưỡng cảnh báo.',
  TRUE,
  '[]'::jsonb,
  'high',
  'auto_approved',
  NOW() - INTERVAL '2 hours',
  NOW() - INTERVAL '1 hour 55 minutes'
);

-- App B: Auto-rejected (Võ Thanh Hải - Case 6, high DTI)
INSERT INTO loan_applications (
  id, customer_id, amount_requested, loan_term_months, purpose,
  dti_ratio, credit_decision, credit_reasoning,
  compliance_decision, compliance_reasoning, compliance_agent_called,
  guardrail_flags, confidence_level, final_status,
  submitted_at, decided_at
) VALUES (
  'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
  '11111111-1111-1111-1111-111111111106',
  300000000, 24, 'Vốn kinh doanh',
  0.7500,
  'reject',
  'DTI = (12,000,000 + 300,000,000/24) / 30,000,000 = 75%. Vượt ngưỡng tối đa 50% theo Chính sách tín dụng v2.0. Thu nhập không đủ đảm bảo khả năng trả nợ. Lịch sử có 1 hồ sơ bị từ chối trước đó.',
  'flagged',
  'Credit score 580 thuộc nhóm rủi ro cao. Khuyến nghị yêu cầu tài sản bảo đảm bổ sung hoặc người bảo lãnh.',
  TRUE,
  '["high_dti_ratio", "low_credit_score"]'::jsonb,
  'high',
  'auto_rejected',
  NOW() - INTERVAL '1 hour',
  NOW() - INTERVAL '58 minutes'
);

-- App C: Pending Manager (Hoàng Minh Tuấn - Case 5, large amount)
INSERT INTO loan_applications (
  id, customer_id, amount_requested, loan_term_months, purpose,
  dti_ratio, credit_decision, credit_reasoning,
  compliance_decision, compliance_reasoning, compliance_agent_called,
  guardrail_flags, confidence_level, final_status,
  submitted_at, decided_at
) VALUES (
  'cccccccc-cccc-cccc-cccc-cccccccccccc',
  '11111111-1111-1111-1111-111111111105',
  5000000000, 120, 'Đầu tư bất động sản thương mại',
  0.3330,
  'approve',
  'DTI = (20,000,000 + 5,000,000,000/120) / 150,000,000 = 33.3%. Tốt. Credit score 820 - nhóm Excellent. Tuy nhiên số tiền 5 tỷ VNĐ vượt ngưỡng guardrail (3 tỷ) - cần phê duyệt HITL.',
  'approve',
  'Không có cờ AML. Hồ sơ sạch. Tuy nhiên số tiền lớn cần sự phê duyệt của Quản lý theo quy trình.',
  TRUE,
  '["large_amount_hitl"]'::jsonb,
  'low',
  'pending_manager',
  NOW() - INTERVAL '30 minutes',
  NULL
);

-- App D: Rejected by AML (Phạm Đức Dũng - Case 4)
INSERT INTO loan_applications (
  id, customer_id, amount_requested, loan_term_months, purpose,
  dti_ratio, credit_decision, credit_reasoning,
  compliance_decision, compliance_reasoning, compliance_agent_called,
  guardrail_flags, confidence_level, final_status,
  submitted_at, decided_at
) VALUES (
  'dddddddd-dddd-dddd-dddd-dddddddddddd',
  '11111111-1111-1111-1111-111111111104',
  1000000000, 60, 'Mở rộng kinh doanh',
  0.2250,
  'approve',
  'DTI = (10,000,000 + 1,000,000,000/60) / 80,000,000 = 22.5%. Rất tốt. Credit score 800. Tuy nhiên Compliance Agent có QUYỀN VETO.',
  'reject',
  'CẢNH BÁO AML: Phát hiện tên khách hàng trong danh sách cảnh báo STR #2024-0892 của NHNN. Rủi ro AML mức CAO. Từ chối theo quy trình bắt buộc.',
  TRUE,
  '["aml_watchlist_hit"]'::jsonb,
  'high',
  'auto_rejected',
  NOW() - INTERVAL '45 minutes',
  NOW() - INTERVAL '43 minutes'
);

-- ============================================================
-- 4. AGENT ACTION LOGS — Full traces for Demo Apps
-- ============================================================

-- Traces for App A (Auto-approved - Nguyễn Văn An)
INSERT INTO agent_action_log (agent_name, application_id, action_type, input_payload, output_payload, reasoning_text, duration_ms, created_at) VALUES

('planner_agent', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'start_orchestration',
 '{"customer_id": "11111111-1111-1111-1111-111111111101", "amount": 500000000}'::jsonb,
 '{"plan": ["credit_analysis", "compliance_check"]}'::jsonb,
 'Tiếp nhận hồ sơ vay 500 triệu VNĐ của KH Nguyễn Văn An. Khởi tạo pipeline đa tác nhân. Giao nhiệm vụ: (1) Credit Agent tính DTI và đánh giá tín dụng, (2) Compliance Agent kiểm tra AML.',
 312,
 NOW() - INTERVAL '1 hour 58 minutes'),

('credit_agent', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'retrieve_credit_policy',
 '{"query": "DTI threshold full_time employee credit score 750"}'::jsonb,
 '{"policy": "DTI max 50% for standard, 60% for premium (score > 700)"}'::jsonb,
 'Truy vấn chính sách tín dụng RAG: KH có credit score 750 (Premium). DTI threshold áp dụng: tối đa 60%. Thu nhập 45M, nợ hiện tại 5M.',
 890,
 NOW() - INTERVAL '1 hour 57 minutes'),

('credit_agent', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'calculate_dti',
 '{"monthly_income": 45000000, "existing_debt": 5000000, "loan_amount": 500000000, "term_months": 36}'::jsonb,
 '{"dti_ratio": 0.337, "monthly_payment": 13888889, "total_payment": 500000000}'::jsonb,
 'Tính DTI: (5,000,000 + 500,000,000÷36) ÷ 45,000,000 = 33.7%. Nằm trong ngưỡng cho phép 60% đối với KH Premium. QUYẾT ĐỊNH: APPROVE.',
 145,
 NOW() - INTERVAL '1 hour 56 minutes'),

('compliance_agent', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'check_aml_watchlist',
 '{"customer_name": "Nguyen Van An", "id_number": "001090012345"}'::jsonb,
 '{"is_on_watchlist": false, "matches": []}'::jsonb,
 'Quét AML/Blacklist: Không tìm thấy tên "Nguyễn Văn An" hoặc CMND "001090012345" trong bất kỳ danh sách cảnh báo nào. Hồ sơ SẠCH.',
 234,
 NOW() - INTERVAL '1 hour 56 minutes'),

('compliance_agent', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'execute_compliance_agent',
 '{}'::jsonb,
 '{"verdict": "approve"}'::jsonb,
 'Đánh giá tuân thủ hoàn tất. Tuổi KH: 34 (hợp lệ ≥18). Số tiền 500M không vượt ngưỡng 3B (không cần HITL). Không có cờ AML. QUYẾT ĐỊNH TUÂN THỦ: APPROVE.',
 1820,
 NOW() - INTERVAL '1 hour 55 minutes 30 seconds'),

('planner_agent', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'synthesize_final_decision',
 '{"credit_verdict": "approve", "compliance_verdict": "approve"}'::jsonb,
 '{"final_status": "auto_approved"}'::jsonb,
 'Tổng hợp kết quả: Credit Agent → APPROVE (DTI 33.7%, score 750). Compliance Agent → APPROVE (AML sạch). Độ tin cậy hệ thống: CAO. QUYẾT ĐỊNH CUỐI CÙNG: TỰ ĐỘNG PHÊ DUYỆT.',
 198,
 NOW() - INTERVAL '1 hour 55 minutes');

-- Traces for App B (Auto-rejected - Võ Thanh Hải)
INSERT INTO agent_action_log (agent_name, application_id, action_type, input_payload, output_payload, reasoning_text, duration_ms, created_at) VALUES

('planner_agent', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'start_orchestration',
 '{"customer_id": "11111111-1111-1111-1111-111111111106", "amount": 300000000}'::jsonb,
 '{"plan": ["credit_analysis", "compliance_check"]}'::jsonb,
 'Tiếp nhận hồ sơ vay 300 triệu VNĐ của KH Võ Thanh Hải. Kiểm tra lịch sử: KH có 1 hồ sơ bị từ chối trước đó (2024-06-15). Khởi tạo pipeline đa tác nhân.',
 287,
 NOW() - INTERVAL '59 minutes'),

('credit_agent', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'retrieve_credit_policy',
 '{"query": "DTI threshold part_time employment credit score below 600"}'::jsonb,
 '{"policy": "DTI max 40% for part_time, score < 600 requires collateral"}'::jsonb,
 'Truy vấn chính sách: KH là part_time, score 580 (nhóm rủi ro cao). DTI threshold: tối đa 40%. Yêu cầu tài sản bảo đảm bổ sung.',
 760,
 NOW() - INTERVAL '58 minutes 30 seconds'),

('credit_agent', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'calculate_dti',
 '{"monthly_income": 30000000, "existing_debt": 12000000, "loan_amount": 300000000, "term_months": 24}'::jsonb,
 '{"dti_ratio": 0.75, "monthly_payment": 12500000}'::jsonb,
 'DTI = (12,000,000 + 300,000,000÷24) ÷ 30,000,000 = 75%. VƯỢT NGƯỠNG 50% (thậm chí vượt ngưỡng 40% cho part_time). Lịch sử: 1 lần bị từ chối. QUYẾT ĐỊNH: REJECT.',
 132,
 NOW() - INTERVAL '58 minutes'),

('compliance_agent', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'execute_compliance_agent',
 '{}'::jsonb,
 '{"verdict": "flagged"}'::jsonb,
 'Credit score 580 thuộc nhóm rủi ro cao theo Thông tư 39/2016/TT-NHNN. Đề xuất: yêu cầu tài sản bảo đảm tối thiểu 120% giá trị khoản vay hoặc người bảo lãnh đủ điều kiện. QUYẾT ĐỊNH: FLAGGED.',
 1650,
 NOW() - INTERVAL '57 minutes 30 seconds'),

('planner_agent', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'synthesize_final_decision',
 '{"credit_verdict": "reject", "compliance_verdict": "flagged"}'::jsonb,
 '{"final_status": "auto_rejected"}'::jsonb,
 'Credit Agent → REJECT (DTI 75%, vượt 50%). Compliance Agent → FLAGGED (score thấp). Cả 2 agents đều đánh giá tiêu cực. Không đủ điều kiện để escalate lên Manager. QUYẾT ĐỊNH: TỰ ĐỘNG TỪ CHỐI.',
 201,
 NOW() - INTERVAL '57 minutes');

-- Traces for App C (Pending Manager - Hoàng Minh Tuấn)
INSERT INTO agent_action_log (agent_name, application_id, action_type, input_payload, output_payload, reasoning_text, duration_ms, created_at) VALUES

('planner_agent', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'start_orchestration',
 '{"customer_id": "11111111-1111-1111-1111-111111111105", "amount": 5000000000}'::jsonb,
 '{"plan": ["credit_analysis", "compliance_check"], "guardrail": "large_amount"}'::jsonb,
 'Tiếp nhận hồ sơ vay 5 TỶ VNĐ của KH Hoàng Minh Tuấn. ⚠️ GUARDRAIL: Số tiền > 3 tỷ → Bắt buộc HITL sau khi hoàn thành phân tích AI. Khởi tạo pipeline.',
 341,
 NOW() - INTERVAL '28 minutes'),

('credit_agent', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'calculate_dti',
 '{"monthly_income": 150000000, "existing_debt": 20000000, "loan_amount": 5000000000, "term_months": 120}'::jsonb,
 '{"dti_ratio": 0.333, "monthly_payment": 41666667}'::jsonb,
 'DTI = (20,000,000 + 5,000,000,000÷120) ÷ 150,000,000 = 33.3%. Tốt. Credit score 820 (Excellent). KH là giám đốc Samsung Vietnam, 15 năm kinh nghiệm. Về mặt tín dụng: APPROVE.',
 445,
 NOW() - INTERVAL '27 minutes'),

('compliance_agent', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'check_aml_watchlist',
 '{"customer_name": "Hoang Minh Tuan", "id_number": "001078090123"}'::jsonb,
 '{"is_on_watchlist": false, "matches": []}'::jsonb,
 'Quét AML: KH không có trong bất kỳ danh sách đen nào. Hồ sơ SẠCH. Tuy nhiên số tiền 5 tỷ yêu cầu thẩm định thêm theo quy định khoản vay lớn.',
 289,
 NOW() - INTERVAL '26 minutes 30 seconds'),

('planner_agent', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'synthesize_final_decision',
 '{"credit_verdict": "approve", "compliance_verdict": "approve", "guardrail_triggered": true}'::jsonb,
 '{"final_status": "pending_manager"}'::jsonb,
 'Credit → APPROVE. Compliance → APPROVE. Hồ sơ tốt. NHƯNG Guardrail "large_amount" (5B > 3B ngưỡng) đã kích hoạt. Theo chính sách, không thể tự động giải ngân. Chuyển lên Quản lý phê duyệt.',
 178,
 NOW() - INTERVAL '26 minutes');

-- Traces for App D (AML Rejected - Phạm Đức Dũng)
INSERT INTO agent_action_log (agent_name, application_id, action_type, input_payload, output_payload, reasoning_text, duration_ms, created_at) VALUES

('planner_agent', 'dddddddd-dddd-dddd-dddd-dddddddddddd', 'start_orchestration',
 '{"customer_id": "11111111-1111-1111-1111-111111111104", "amount": 1000000000}'::jsonb,
 '{"plan": ["credit_analysis", "compliance_check"]}'::jsonb,
 'Tiếp nhận hồ sơ vay 1 TỶ VNĐ của KH Phạm Đức Dũng. Khởi tạo pipeline đa tác nhân song song.',
 298,
 NOW() - INTERVAL '44 minutes'),

('credit_agent', 'dddddddd-dddd-dddd-dddd-dddddddddddd', 'calculate_dti',
 '{"monthly_income": 80000000, "existing_debt": 10000000, "loan_amount": 1000000000, "term_months": 60}'::jsonb,
 '{"dti_ratio": 0.2958, "monthly_payment": 16666667}'::jsonb,
 'DTI = (10,000,000 + 1,000,000,000÷60) ÷ 80,000,000 = 29.6%. Rất tốt. Credit score 800 (Excellent). Về mặt tín dụng thuần tuý: APPROVE. Tuy nhiên cần chờ kết quả Compliance.',
 389,
 NOW() - INTERVAL '43 minutes 30 seconds'),

('compliance_agent', 'dddddddd-dddd-dddd-dddd-dddddddddddd', 'check_aml_watchlist',
 '{"customer_name": "Pham Duc Dung", "id_number": "001082078901"}'::jsonb,
 '{"is_on_watchlist": true, "matches": [{"entity_name": "Phạm Đức Dũng", "risk_level": "high", "reason": "Liên quan STR #2024-0892"}]}'::jsonb,
 '🚨 CẢNH BÁO AML: Phát hiện KH trong danh sách giám sát STR #2024-0892 của NHNN. Mức rủi ro: CAO. Kích hoạt QUYỀN VETO bắt buộc.',
 312,
 NOW() - INTERVAL '43 minutes'),

('compliance_agent', 'dddddddd-dddd-dddd-dddd-dddddddddddd', 'execute_compliance_agent',
 '{"aml_found": true}'::jsonb,
 '{"verdict": "reject"}'::jsonb,
 'Theo Thông tư 35/2023/TT-NHNN về phòng chống rửa tiền: KH có rủi ro AML mức CAO bắt buộc từ chối, bất kể chỉ số tài chính. Compliance Agent thực thi QUYỀN VETO. QUYẾT ĐỊNH: REJECT.',
 1940,
 NOW() - INTERVAL '42 minutes 30 seconds'),

('planner_agent', 'dddddddd-dddd-dddd-dddd-dddddddddddd', 'synthesize_final_decision',
 '{"credit_verdict": "approve", "compliance_verdict": "reject", "compliance_veto": true}'::jsonb,
 '{"final_status": "auto_rejected"}'::jsonb,
 'Credit Agent → APPROVE. Compliance Agent → REJECT (VETO AML). Theo quy tắc hệ thống: VETO của Compliance có hiệu lực tuyệt đối, ghi đè kết quả tín dụng. QUYẾT ĐỊNH CUỐI CÙNG: TỪ CHỐI.',
 165,
 NOW() - INTERVAL '42 minutes');

-- ============================================================
-- 5. MANAGER APPROVAL RECORD (for App C)
-- ============================================================

INSERT INTO manager_approvals (
  application_id, reason, escalation_type,
  credit_summary, compliance_summary, planner_recommendation,
  status, created_at
) VALUES (
  'cccccccc-cccc-cccc-cccc-cccccccccccc',
  'Khoản vay 5 tỷ VNĐ vượt ngưỡng tự động phê duyệt (3 tỷ). Hồ sơ KH tốt nhưng cần Quản lý xem xét theo quy trình.',
  'guardrail_trigger',
  'DTI 33.3%, Credit score 820 (Excellent), thu nhập 150M/tháng. Đánh giá: Đủ năng lực tài chính.',
  'Không có AML. Hồ sơ pháp lý sạch. Khoản vay lớn cần thẩm định thêm theo quy định nội bộ.',
  'Hệ thống AI khuyến nghị PHÊ DUYỆT với điều kiện bổ sung tài sản bảo đảm tương đương.',
  'pending',
  NOW() - INTERVAL '26 minutes'
);

-- ============================================================
-- 6. HISTORICAL LOAN for Case 6 (Võ Thanh Hải - previous rejection)
-- ============================================================

INSERT INTO loan_applications (
  id, customer_id, amount_requested, loan_term_months, purpose,
  dti_ratio, credit_decision, credit_reasoning,
  compliance_decision, compliance_reasoning, compliance_agent_called,
  guardrail_flags, confidence_level, final_status,
  submitted_at, decided_at
) VALUES (
  '22222222-2222-2222-2222-222222222201',
  '11111111-1111-1111-1111-111111111106',
  200000000, 24, 'Mua xe máy và vốn kinh doanh',
  0.7333,
  'reject',
  'DTI ratio 73.33% vượt ngưỡng tối đa 50%. Thu nhập 30 triệu/tháng không đủ với tổng nợ hiện tại 12 triệu + khoản vay mới 200 triệu.',
  'flagged',
  'Credit score 580 - nhóm rủi ro cao. Cần tài sản bảo đảm hoặc người bảo lãnh.',
  TRUE,
  '["high_dti_ratio"]'::jsonb,
  'low',
  'auto_rejected',
  NOW() - INTERVAL '30 days',
  NOW() - INTERVAL '30 days' + INTERVAL '2 minutes'
);
