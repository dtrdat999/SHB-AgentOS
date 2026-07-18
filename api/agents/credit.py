# ============================================================
# SHB-AgentOS: Credit Agent (Python)
# Executor: Calculates DTI, Queries Credit Policy, Evaluates Eligibility
# ============================================================

import json
import time
from api.prompts import CREDIT_AGENT_SYSTEM_PROMPT
from api.llm import run_agent_conversation, parse_json_response
from api.rag import retrieve_policies, format_retrieval_context, extract_citations
from api.tools import insert_audit_log


def calculate_dti(
    monthly_income: float,
    existing_debt: float,
    amount_requested: float,
    loan_term_months: int,
) -> dict:
    """Deterministic DTI calculation — no LLM guessing."""
    monthly_payment_new = amount_requested / loan_term_months
    total_monthly_debt = existing_debt + monthly_payment_new
    dti_ratio = total_monthly_debt / monthly_income if monthly_income > 0 else 1.0
    return {
        "dti_ratio": round(dti_ratio, 4),
        "monthly_payment_new": round(monthly_payment_new, 0),
    }


async def run_credit_agent(
    application_id: str,
    amount_requested: float,
    loan_term_months: int,
    monthly_income: float,
    existing_debt: float,
    credit_score: int,
    employment_type: str,
    purpose: str,
) -> dict:
    """Main entry point for the Credit Agent."""
    start = time.time()
    print(f"[Credit Agent] Started analysis for application: {application_id}")

    # Step 1: Deterministic Math — Calculate DTI
    dti = calculate_dti(monthly_income, existing_debt, amount_requested, loan_term_months)
    print(f"[Credit Agent] DTI Calculated: {dti['dti_ratio'] * 100:.2f}%")

    collected_citations = []

    # Step 2: Build user message with pre-calculated DTI
    user_message = f"""HỒ SƠ KHÁCH HÀNG:
- Số tiền vay: {amount_requested:,.0f} VNĐ
- Thời hạn vay: {loan_term_months} tháng
- Mục đích vay: {purpose}
- Thu nhập hàng tháng: {monthly_income:,.0f} VNĐ
- Nợ hiện tại: {existing_debt:,.0f} VNĐ
- Điểm tín dụng (Credit Score): {credit_score}
- Loại công việc: {employment_type}

KẾT QUẢ TÍNH TOÁN DTI TỰ ĐỘNG:
- Khoản trả hàng tháng dự kiến mới: {dti['monthly_payment_new']:,.0f} VNĐ
- Tỷ lệ DTI: {dti['dti_ratio'] * 100:.2f}%

YÊU CẦU:
1. Tra cứu chính sách tín dụng ('credit') cho DTI, Credit Score, và Thu nhập/Mục đích vay.
2. Đánh giá tính hợp lệ của khoản vay.
3. Đưa ra quyết định (approve/reject/flagged) và giải thích lý do."""

    # Tool definition for RAG
    tools = [
        {
            "type": "function",
            "function": {
                "name": "search_credit_policy",
                "description": "Tìm kiếm quy định trong bộ chính sách tín dụng của ngân hàng. Sử dụng khi cần kiểm tra luật về DTI, Credit Score, công việc, mục đích vay.",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "query": {
                            "type": "string",
                            "description": 'Câu hỏi hoặc từ khóa tìm kiếm (VD: "Quy định DTI bao nhiêu là an toàn?")',
                        }
                    },
                    "required": ["query"],
                },
            },
        }
    ]

    # Tool executor
    async def tool_executor(name: str, args: dict) -> str:
        nonlocal collected_citations
        if name == "search_credit_policy":
            results = retrieve_policies(query=args["query"], category="credit", match_count=2)
            collected_citations.extend(extract_citations(results))
            return format_retrieval_context(results)
        raise ValueError(f"Unknown tool: {name}")

    # Run LLM loop
    conversation = await run_agent_conversation(
        system_prompt=CREDIT_AGENT_SYSTEM_PROMPT,
        user_message=user_message,
        tools=tools,
        tool_executor=tool_executor,
    )

    print("[Credit Agent] LLM completed reasoning.")

    # Step 3: Parse structured output
    parsed = parse_json_response(
        f'Bài đánh giá:\n{conversation["final_response"]}\n\n'
        f'Trích xuất JSON với cấu trúc:\n'
        f'{{ "verdict": "approve" | "reject" | "flagged", "reasoning": "Tóm tắt lý do ngắn gọn dưới 50 chữ" }}'
    )

    duration_ms = int((time.time() - start) * 1000)

    # Audit log
    try:
        insert_audit_log(
            agent_name="credit_agent",
            application_id=application_id,
            action_type="execute_credit_agent",
            input_payload={"amount": amount_requested, "dti": dti["dti_ratio"]},
            output_payload=parsed,
            reasoning_text=conversation["final_response"],
            duration_ms=duration_ms,
        )
    except Exception as e:
        print(f"[Credit Agent] Audit log warning: {e}")

    # Deduplicate citations
    seen = set()
    unique_citations = []
    for c in collected_citations:
        if c["chunk_id"] not in seen:
            seen.add(c["chunk_id"])
            unique_citations.append(c)

    return {
        "agent_name": "credit_agent",
        "task_id": "auto-credit-analysis",
        "verdict": parsed.get("verdict", "flagged"),
        "reasoning": parsed.get("reasoning", ""),
        "full_reasoning": conversation["final_response"],
        "citations": unique_citations,
        "metadata": {"dti_ratio": dti["dti_ratio"], "monthly_payment_new": dti["monthly_payment_new"]},
        "duration_ms": duration_ms,
        "tool_calls": conversation["tool_call_log"],
    }
