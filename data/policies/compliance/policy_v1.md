# CHÍNH SÁCH TUÂN THỦ VÀ PHÒNG CHỐNG RỬA TIỀN (AML/KYC)
**Phiên bản:** 1.0
**Ngày áp dụng:** 01/01/2026
**Tình trạng:** Đang hiệu lực

## 1. MỤC ĐÍCH
Quy định các tiêu chuẩn tuân thủ pháp luật, phòng chống rửa tiền (AML), tài trợ khủng bố và nhận biết khách hàng (KYC) đối với tất cả các khoản vay tại Ngân hàng SHB.

## 2. QUY ĐỊNH VỀ ĐỘ TUỔI VÀ NĂNG LỰC HÀNH VI
- Khách hàng vay vốn phải từ đủ 18 tuổi trở lên và không quá 65 tuổi tại thời điểm tất toán khoản vay.
- Nếu khách hàng < 18 tuổi hoặc > 65 tuổi: Bắt buộc TỪ CHỐI.

## 3. QUY ĐỊNH VỀ LỊCH SỬ PHÁP LÝ (Legal Flags)
- Bất kỳ khách hàng nào đang trong quá trình bị khởi kiện, thi hành án, hoặc có tiền án tiền sự về gian lận tài chính, lừa đảo: Bắt buộc TỪ CHỐI.
- Khách hàng có lịch sử phá sản trong vòng 5 năm gần nhất: Bắt buộc TỪ CHỐI.
- Nếu phát hiện hồ sơ giả mạo (giấy tờ tuỳ thân, sao kê lương giả): Bắt buộc TỪ CHỐI và ghi danh sách đen.

## 4. QUY TRÌNH PHÒNG CHỐNG RỬA TIỀN (AML Watchlist)
- Mọi hồ sơ vay vốn có giá trị >= 500 triệu VNĐ đều phải đi qua vòng kiểm tra AML bắt buộc.
- Nếu khách hàng NẰM TRONG danh sách đen AML (Watchlist) với mức độ rủi ro CAO (High): Bắt buộc TỪ CHỐI ngay lập tức không cần xem xét các yếu tố tín dụng.
- Nếu khách hàng nằm trong AML Watchlist với rủi ro TRUNG BÌNH (Medium): Tạm thời FLAG (Cảnh báo) và chuyển vào Manager Queue để xem xét thủ công (HITL). Không được phép tự động phê duyệt (Auto-approve).
- Nếu không có thông tin trên AML Watchlist: Khách hàng an toàn về mặt AML.

## 5. QUY ĐỊNH QUẢN LÝ RỦI RO HẠN MỨC (Guardrail)
- Đối với các khoản vay có giá trị cực lớn (> 2 Tỷ VNĐ), dù điểm tín dụng hoàn hảo và không có cờ báo rủi ro AML, hệ thống cũng KHÔNG ĐƯỢC PHÉP tự động phê duyệt (Auto-approve).
- Bắt buộc phải chuyển vào danh sách chờ quản lý (Manager Queue) để phê duyệt thủ công (Human-in-the-loop). Đánh dấu flag: "amount_exceeds_2b_threshold".
