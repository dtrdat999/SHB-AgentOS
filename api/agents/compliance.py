# ============================================================
# SHB-AgentOS: Compliance Agent (Python)
# Executor: Checks AML watchlist, Legal Flags, Queries Compliance Policy
# ============================================================

import json
import time
from api.prompts import COMPLIANCE_AGENT_SYSTEM_PROMPT
from api.llm import run_agent_conversation, parse_json_response
from api.rag import retrieve_policies, format_retrieval_context, extract_citations
from api.tools import check_aml_watchlist, insert_audit_log


async def run_compliance_agent(
    application_id: str,
    customer_name: str,
    id_number: str | None,
    amount_requested: float,
    age: int,
) -> dict:
    """Main entry point for the Compliance Agent."""
    start = time.time()
    print(f"[Compliance Agent] Started analysis for application: {application_id}")

    # Step 1: Deterministic Check — Database AML Watchlist
    aml_result = check_aml_watchlist(customer_name, id_number)
    print(f"[Compliance Agent] AML Check: Found {len(aml_result['matches'])} matches.")

    collected_citations = []

    # Step 2: Agent Conversation
    user_message = f"""HỒ SƠ KHÁCH HÀNG:
- Tên khách hàng: {customer_name}
- Tuổi: {age}
- Số tiền vay: {amount_requested:,.0f} VNĐ

KẾT QUẢ QUÉT AML/BLACKLIST TỰ ĐỘNG (TỪ DB):
- Có nằm trong Watchlist không: {"CÓ" if aml_result["is_on_watchlist"] else "KHÔNG"}
- Chi tiết: {json.dumps(aml_result["matches"], ensure_ascii=False) if aml_result["is_on_watchlist"] else "Hồ sơ sạch"}

YÊU CẦU:
1. Tra cứu chính sách tuân thủ ('compliance') về độ tuổi, AML, và khoản vay lớn (Guardrail).
2. Đánh giá tính hợp lệ của khoản vay về mặt rủi ro AML và pháp lý.
3. Đưa ra quyết định (approve/reject/flagged) và giải thích lý do. Nhớ rằng bạn có QUYỀN VETO (Bắt buộc reject) nếu rủi ro AML mức CAO."""

    tools = [
        {
            "type": "function",
            "function": {
                "name": "search_compliance_policy",
                "description": "Tìm kiếm quy định trong bộ chính sách pháp lý & tuân thủ của ngân hàng. Sử dụng khi cần kiểm tra luật về độ tuổi, danh sách đen AML, mức độ rủi ro.",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "query": {
                            "type": "string",
                            "description": 'Từ khóa tìm kiếm (VD: "Quy định xử lý AML Watchlist")',
                        }
                    },
                    "required": ["query"],
                },
            },
        }
    ]

    async def tool_executor(name: str, args: dict) -> str:
        nonlocal collected_citations
        if name == "search_compliance_policy":
            results = retrieve_policies(query=args["query"], category="compliance", match_count=2)
            collected_citations.extend(extract_citations(results))
            return format_retrieval_context(results)
        raise ValueError(f"Unknown tool: {name}")

    conversation = await run_agent_conversation(
        system_prompt=COMPLIANCE_AGENT_SYSTEM_PROMPT,
        user_message=user_message,
        tools=tools,
        tool_executor=tool_executor,
    )

    print("[Compliance Agent] LLM completed reasoning.")

    # Step 3: Parse structured output
    parsed = parse_json_response(
        f'Bài đánh giá:\n{conversation["final_response"]}\n\n'
        f'Trích xuất JSON với cấu trúc:\n'
        f'{{ "verdict": "approve" | "reject" | "flagged", "reasoning": "Tóm tắt lý do ngắn gọn dưới 50 chữ" }}'
    )

    duration_ms = int((time.time() - start) * 1000)

    try:
        insert_audit_log(
            agent_name="compliance_agent",
            application_id=application_id,
            action_type="execute_compliance_agent",
            input_payload={"customer_name": customer_name, "aml_found": aml_result["is_on_watchlist"]},
            output_payload=parsed,
            reasoning_text=conversation["final_response"],
            duration_ms=duration_ms,
        )
    except Exception as e:
        print(f"[Compliance Agent] Audit log warning: {e}")

    seen = set()
    unique_citations = []
    for c in collected_citations:
        if c["chunk_id"] not in seen:
            seen.add(c["chunk_id"])
            unique_citations.append(c)

    return {
        "agent_name": "compliance_agent",
        "task_id": "auto-compliance-analysis",
        "verdict": parsed.get("verdict", "flagged"),
        "reasoning": parsed.get("reasoning", ""),
        "full_reasoning": conversation["final_response"],
        "citations": unique_citations,
        "metadata": {"aml_found": aml_result["is_on_watchlist"]},
        "duration_ms": duration_ms,
        "tool_calls": conversation["tool_call_log"],
    }
