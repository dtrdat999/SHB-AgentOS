# ============================================================
# SHB-AgentOS: Database Query Tools (Python)
# Reusable query functions for Agents
# ============================================================

from api.db import get_supabase


def get_customer_by_id(customer_id: str) -> dict | None:
    """Get customer profile by ID."""
    supabase = get_supabase()
    result = supabase.table("customers").select("*").eq("id", customer_id).single().execute()
    return result.data if result.data else None


def get_all_customers() -> list[dict]:
    """Get all customers (for dropdown selection)."""
    supabase = get_supabase()
    result = supabase.table("customers").select("*").order("full_name").execute()
    return result.data or []


def get_customer_history(customer_id: str) -> list[dict]:
    """Get customer's previous loan applications."""
    supabase = get_supabase()
    result = (
        supabase.table("loan_applications")
        .select("*")
        .eq("customer_id", customer_id)
        .order("submitted_at", desc=True)
        .execute()
    )
    return result.data or []


def check_aml_watchlist(customer_name: str, id_number: str | None = None) -> dict:
    """
    Check AML watchlist by customer name or ID number.
    Returns {"is_on_watchlist": bool, "matches": list}
    """
    supabase = get_supabase()

    # Check by ID number first (more precise)
    if id_number:
        result = (
            supabase.table("aml_watchlist")
            .select("entity_name, risk_level, reason")
            .eq("id_number", id_number)
            .execute()
        )
        if result.data:
            return {"is_on_watchlist": True, "matches": result.data}

    # Fallback: match by name (case-insensitive)
    result = (
        supabase.table("aml_watchlist")
        .select("entity_name, risk_level, reason")
        .ilike("entity_name", f"%{customer_name}%")
        .execute()
    )

    matches = result.data or []
    return {"is_on_watchlist": len(matches) > 0, "matches": matches}


def insert_audit_log(
    agent_name: str,
    application_id: str,
    action_type: str,
    input_payload: dict | None = None,
    output_payload: dict | None = None,
    reasoning_text: str | None = None,
    duration_ms: int | None = None,
) -> None:
    """Insert an audit log entry for agent transparency."""
    supabase = get_supabase()
    supabase.table("agent_action_log").insert({
        "agent_name": agent_name,
        "application_id": application_id,
        "action_type": action_type,
        "input_payload": input_payload,
        "output_payload": output_payload,
        "reasoning_text": reasoning_text,
        "duration_ms": duration_ms,
    }).execute()
