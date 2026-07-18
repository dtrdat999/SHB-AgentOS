# ============================================================
# SHB-AgentOS: User Proxy Agent (Python)
# Conversational interface for data gathering
# ============================================================

import json
from api.llm import get_openai, get_model

SYSTEM_PROMPT = """Bạn là trợ lý ảo thân thiện của ngân hàng SHB. Nhiệm vụ của bạn là hỗ trợ khách hàng nộp hồ sơ vay vốn bằng cách trò chuyện tự nhiên.
Giọng điệu: Chuyên nghiệp, ân cần, đáng tin cậy. Dùng đại từ "SHB" và "Quý khách" hoặc "Anh/Chị".

Bạn cần thu thập đủ 4 thông tin sau để nộp hồ sơ:
1. Số tiền muốn vay (amount_requested) - Phải quy ra số nguyên (VNĐ).
2. Thời hạn vay (loan_term_months) - Phải là số tháng.
3. Mục đích vay (purpose).
4. Mã khách hàng (customer_id). (Trong demo này, giả định khách hàng đã đăng nhập. Bạn có thể tự chọn customer_id là 'CUST-001' nếu khách hàng chưa cung cấp, HOẶC yêu cầu khách hàng cung cấp họ tên để bạn ánh xạ).

QUY TẮC:
- Nếu thiếu thông tin, hãy ĐẶT CÂU HỎI MỘT CÁCH TỰ NHIÊN để hỏi thêm. Đừng hỏi như tra khảo, hãy hỏi như người tư vấn.
- Nếu khách hàng nói chung chung (vd: "tôi muốn vay mua xe"), hãy hỏi "Tuyệt vời, anh/chị dự định vay bao nhiêu tiền và trong thời gian bao lâu ạ?".
- KHI VÀ CHỈ KHI ĐÃ ĐỦ THÔNG TIN: gọi function `submit_loan_application` để nộp hồ sơ.
"""

async def run_user_proxy(messages: list[dict]) -> dict:
    """
    Process a chat turn.
    messages: list of {"role": "...", "content": "..."}
    Returns: {"response": str, "is_complete": bool, "submission_payload": dict | None}
    """
    client = get_openai()
    model = get_model()

    sys_msg = [{"role": "system", "content": SYSTEM_PROMPT}]
    full_messages = sys_msg + messages

    tools = [
        {
            "type": "function",
            "function": {
                "name": "submit_loan_application",
                "description": "Gọi hàm này khi bạn đã thu thập ĐỦ thông tin về số tiền vay, thời hạn vay, mục đích vay và mã khách hàng.",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "customer_id": {
                            "type": "string",
                            "description": "Mã khách hàng (VD: CUST-001, CUST-002, ...)"
                        },
                        "amount_requested": {
                            "type": "number",
                            "description": "Số tiền vay (bằng số, đơn vị VNĐ. VD: 500000000)"
                        },
                        "loan_term_months": {
                            "type": "integer",
                            "description": "Thời hạn vay tính bằng tháng (VD: 12, 24, 36)"
                        },
                        "purpose": {
                            "type": "string",
                            "description": "Mục đích vay"
                        }
                    },
                    "required": ["customer_id", "amount_requested", "loan_term_months", "purpose"]
                }
            }
        }
    ]

    response = client.chat.completions.create(
        model=model,
        messages=full_messages,
        tools=tools,
        temperature=0.7,
    )

    choice = response.choices[0]

    # If the LLM called a tool, it means it has gathered enough info
    if choice.message.tool_calls:
        tc = choice.message.tool_calls[0]
        if tc.function.name == "submit_loan_application":
            payload = json.loads(tc.function.arguments)
            return {
                "response": "Cảm ơn Quý khách! Hệ thống AI của SHB đang tiến hành phân tích hồ sơ vay của Quý khách...",
                "is_complete": True,
                "submission_payload": payload
            }

    # Otherwise, return the conversational response
    return {
        "response": choice.message.content or "Xin lỗi, tôi chưa hiểu ý của Quý khách.",
        "is_complete": False,
        "submission_payload": None
    }
