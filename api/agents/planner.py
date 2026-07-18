# ============================================================
# SHB-AgentOS: Planner Agent (Python)
# Orchestrates the loan approval workflow
# DOES NOT perform business analysis — only coordinates
# ============================================================

import json
import time
from api.prompts import PLANNER_SYSTEM_PROMPT
from api.llm import run_agent_conversation, parse_json_response
from api.tools import get_customer_by_id, get_customer_history, insert_audit_log
from api.agents.credit import run_credit_agent
from api.agents.compliance import run_compliance_agent


async def run_planner_agent(
    application_id: str,
    customer_id: str,
    amount_requested: float,
    loan_term_months: int = 12,
    purpose: str = "Vay tiêu dùng cá nhân",
) -> dict:
    """Main entry point: Orchestrates the entire loan approval workflow."""
    start = time.time()
    print(f"[Planner Agent] Started orchestration for: {application_id}")

    # Step 1: Gather context
    profile = get_customer_by_id(customer_id)
    if not profile:
        raise ValueError(f"Customer {customer_id} not found in database.")

    history = get_customer_history(customer_id)

    sub_agent_results = []
    gathered_citations = []

    # Step 2: Define tools for the Planner (it delegates to sub-agents)
    tools = [
        {
            "type": "function",
            "function": {
                "name": "run_credit_analysis",
                "description": "BẮT BUỘC GỌI cho mọi hồ sơ. Thực thi Credit Agent để tính DTI, tra cứu chính sách tín dụng và ra quyết định tín dụng.",
                "parameters": {
                    "type": "object",
                    "properties": {},
                    "required": [],
                },
            },
        },
        {
            "type": "function",
            "function": {
                "name": "run_compliance_analysis",
                "description": "CHỈ GỌI khi khoản vay > 500 triệu, Credit Score < 650, hoặc có lịch sử bị reject. Thực thi Compliance Agent để check AML và pháp lý.",
                "parameters": {
                    "type": "object",
                    "properties": {},
                    "required": [],
                },
            },
        },
    ]

    # Step 3: Tool executor (invokes sub-agents)
    async def tool_executor(name: str, args: dict) -> str:
        nonlocal sub_agent_results, gathered_citations

        if name == "run_credit_analysis":
            result = await run_credit_agent(
                application_id=application_id,
                amount_requested=amount_requested,
                loan_term_months=loan_term_months,
                monthly_income=profile.get("monthly_income", 0),
                existing_debt=profile.get("existing_debt", 0),
                credit_score=profile.get("credit_score", 0),
                employment_type=profile.get("employment_type", "unknown"),
                purpose=purpose,
            )
            sub_agent_results.append(result)
            gathered_citations.extend(result.get("citations", []))
            return json.dumps({
                "verdict": result["verdict"],
                "reasoning": result["reasoning"],
                "dti_ratio": result["metadata"].get("dti_ratio"),
            }, ensure_ascii=False)

        if name == "run_compliance_analysis":
            # Calculate age from date_of_birth
            age = 30  # default
            dob = profile.get("date_of_birth")
            if dob:
                from datetime import date
                birth = date.fromisoformat(str(dob))
                today = date.today()
                age = today.year - birth.year - ((today.month, today.day) < (birth.month, birth.day))

            result = await run_compliance_agent(
                application_id=application_id,
                customer_name=profile.get("full_name", ""),
                id_number=profile.get("id_number"),
                amount_requested=amount_requested,
                age=age,
            )
            sub_agent_results.append(result)
            gathered_citations.extend(result.get("citations", []))
            return json.dumps({
                "verdict": result["verdict"],
                "reasoning": result["reasoning"],
                "aml_found": result["metadata"].get("aml_found"),
            }, ensure_ascii=False)

        raise ValueError(f"Unknown tool: {name}")

    # Step 4: The Orchestration Conversation
    was_rejected = any(
        h.get("final_status") in ("auto_rejected", "manager_rejected")
        for h in history
    )

    user_message = f"""YÊU CẦU XÉT DUYỆT KHOẢN VAY:
- Mã hồ sơ: {application_id}
- Số tiền vay: {amount_requested:,.0f} VNĐ
- Thời hạn: {loan_term_months} tháng
- Mục đích: {purpose}

HỒ SƠ KHÁCH HÀNG:
- Tên: {profile.get("full_name", "N/A")}
- Credit Score: {profile.get("credit_score", "N/A")}
- Số lần vay trước đây: {len(history)}
- Lịch sử bị reject: {"CÓ" if was_rejected else "KHÔNG"}

HÃY ĐIỀU PHỐI:
1. Quyết định xem có cần gọi run_compliance_analysis không (Dựa vào rules).
2. LUÔN gọi run_credit_analysis.
3. Tổng hợp kết quả từ các agent. Nếu Compliance Agent trả về 'reject', kết quả cuối cùng BẮT BUỘC là 'reject'.
4. Trả về quyết định cuối cùng và luồng xử lý (auto-execute hay manager_queue)."""

    conversation = await run_agent_conversation(
        system_prompt=PLANNER_SYSTEM_PROMPT,
        user_message=user_message,
        tools=tools,
        tool_executor=tool_executor,
    )

    print("[Planner Agent] Orchestration completed.")

    # Step 5: Parse final output
    parsed = parse_json_response(
        f'Bài đánh giá:\n{conversation["final_response"]}\n\n'
        f'Trích xuất JSON với cấu trúc:\n'
        f'{{ "verdict": "approve" | "reject" | "flagged", "routing": "auto-execute" | "manager_queue", "reasoning": "Tóm tắt tổng thể" }}'
    )

    duration_ms = int((time.time() - start) * 1000)

    # Deduplicate citations
    seen = set()
    unique_citations = []
    for c in gathered_citations:
        cid = c.get("chunk_id", "")
        if cid not in seen:
            seen.add(cid)
            unique_citations.append(c)

    # Audit log
    try:
        insert_audit_log(
            agent_name="planner_agent",
            application_id=application_id,
            action_type="execute_planner_agent",
            input_payload={"customer_id": customer_id, "amount": amount_requested},
            output_payload=parsed,
            reasoning_text=conversation["final_response"],
            duration_ms=duration_ms,
        )
    except Exception as e:
        print(f"[Planner Agent] Audit log warning: {e}")

    return {
        "agent_name": "planner_agent",
        "task_id": "loan-orchestration",
        "verdict": parsed.get("verdict", "flagged"),
        "routing": parsed.get("routing", "manager_queue"),
        "reasoning": parsed.get("reasoning", ""),
        "full_reasoning": conversation["final_response"],
        "citations": unique_citations,
        "sub_agent_results": [
            {
                "agent": r["agent_name"],
                "verdict": r["verdict"],
                "reasoning": r["reasoning"],
                "duration_ms": r.get("duration_ms", 0),
            }
            for r in sub_agent_results
        ],
        "duration_ms": duration_ms,
    }
