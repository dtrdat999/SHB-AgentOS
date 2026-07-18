# ============================================================
# SHB-AgentOS: FastAPI Backend Entry Point
# All API routes are defined here
# ============================================================

import sys
import os

# Fix Windows console encoding for Vietnamese characters
# sys.stdout.reconfigure is Python 3.7+ and works with uvicorn reloader subprocess
try:
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")
except AttributeError:
    pass  # Non-Windows or older Python — skip

import uuid
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel

from api.config import SUPABASE_URL, OPENAI_API_KEY
from api.tools import get_customer_by_id, get_all_customers, get_customer_history, insert_audit_log
from api.agents.planner import run_planner_agent
from api.db import get_supabase

app = FastAPI(
    title="SHB-AgentOS Backend",
    description="AI Workforce Platform for Intelligent Banking Operations",
    version="1.0.0",
)

# CORS — allow Next.js frontend to call this API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "https://*.vercel.app"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================
# Health Check
# ============================================================
@app.get("/api/health")
def health_check():
    return {
        "status": "ok",
        "message": "SHB-AgentOS Python Backend is running",
        "supabase_configured": bool(SUPABASE_URL),
        "openai_configured": bool(OPENAI_API_KEY),
    }


# ============================================================
# Chat Endpoint (User Proxy Agent)
# ============================================================
from api.agents.user_proxy import run_user_proxy

class ChatRequest(BaseModel):
    messages: list[dict]

@app.post("/api/chat")
async def chat_endpoint(request: ChatRequest):
    """Handle conversational inputs to gather loan data."""
    try:
        result = await run_user_proxy(request.messages)
        return {"success": True, "data": result}
    except Exception as e:
        print(f"[API Chat Route] Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ============================================================
# Customer Endpoints
# ============================================================
@app.get("/api/customers")
def list_customers():
    """List all customers for the loan submission form."""
    customers = get_all_customers()
    return {"success": True, "data": customers}


@app.get("/api/customers/{customer_id}")
def get_customer(customer_id: str):
    """Get a single customer profile."""
    customer = get_customer_by_id(customer_id)
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    return {"success": True, "data": customer}


@app.get("/api/customers/{customer_id}/history")
def get_history(customer_id: str):
    """Get customer's loan application history."""
    history = get_customer_history(customer_id)
    return {"success": True, "data": history}


# ============================================================
# Agent Orchestration Endpoint
# ============================================================
class LoanApplicationRequest(BaseModel):
    customer_id: str
    amount_requested: float
    loan_term_months: int = 12
    purpose: str = "Vay tiêu dùng cá nhân"


@app.post("/api/agent")
async def run_agent(request: LoanApplicationRequest):
    """
    Main endpoint: Submit a loan application and run the full
    Planner → Credit → Compliance agent workflow.
    """
    try:
        # Verify customer exists
        customer = get_customer_by_id(request.customer_id)
        if not customer:
            raise HTTPException(status_code=404, detail="Customer not found")

        # Generate application ID
        application_id = str(uuid.uuid4())

        # Create application record in DB
        supabase = get_supabase()
        supabase.table("loan_applications").insert({
            "id": application_id,
            "customer_id": request.customer_id,
            "amount_requested": request.amount_requested,
            "loan_term_months": request.loan_term_months,
            "purpose": request.purpose,
            "final_status": "processing",
        }).execute()

        # Run the Planner Agent (which orchestrates Credit + Compliance)
        result = await run_planner_agent(
            application_id=application_id,
            customer_id=request.customer_id,
            amount_requested=request.amount_requested,
            loan_term_months=request.loan_term_months,
            purpose=request.purpose,
        )

        # Update application with results
        final_status = "processing"
        if result["routing"] == "auto-execute":
            final_status = "auto_approved" if result["verdict"] == "approve" else "auto_rejected"
        else:
            final_status = "pending_manager"

        # Extract sub-agent decisions
        credit_result = next((r for r in result["sub_agent_results"] if r["agent"] == "credit_agent"), None)
        compliance_result = next((r for r in result["sub_agent_results"] if r["agent"] == "compliance_agent"), None)

        update_data = {
            "final_status": final_status,
            "credit_decision": credit_result["verdict"] if credit_result else None,
            "credit_reasoning": credit_result["reasoning"] if credit_result else None,
            "compliance_decision": compliance_result["verdict"] if compliance_result else "not_required",
            "compliance_reasoning": compliance_result["reasoning"] if compliance_result else None,
            "compliance_agent_called": compliance_result is not None,
        }

        supabase.table("loan_applications").update(update_data).eq("id", application_id).execute()

        # If manager review needed, create manager_approvals record
        if final_status == "pending_manager":
            supabase.table("manager_approvals").insert({
                "application_id": application_id,
                "reason": result.get("reasoning", "Agent escalation"),
                "escalation_type": "low_confidence",
                "credit_summary": credit_result["reasoning"] if credit_result else None,
                "compliance_summary": compliance_result["reasoning"] if compliance_result else None,
                "planner_recommendation": result["verdict"],
                "status": "pending",
            }).execute()

        return JSONResponse({
            "success": True,
            "application_id": application_id,
            "data": result,
        })

    except HTTPException:
        raise
    except Exception as e:
        print(f"[API Agent Route] Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================
# Loan Applications CRUD
# ============================================================
@app.get("/api/applications")
def list_applications():
    """List all loan applications for dashboard."""
    supabase = get_supabase()
    result = supabase.table("loan_applications").select("*, customers(full_name)").order("submitted_at", desc=True).execute()
    return {"success": True, "data": result.data or []}


@app.get("/api/applications/{application_id}")
def get_application(application_id: str):
    """Get a single application with full details."""
    supabase = get_supabase()
    result = supabase.table("loan_applications").select("*, customers(*)").eq("id", application_id).single().execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Application not found")
    return {"success": True, "data": result.data}


@app.get("/api/applications/{application_id}/trace")
def get_application_trace(application_id: str):
    """Get agent reasoning trace for an application."""
    supabase = get_supabase()
    result = (
        supabase.table("agent_action_log")
        .select("*")
        .eq("application_id", application_id)
        .order("created_at")
        .execute()
    )
    return {"success": True, "data": result.data or []}


@app.get("/api/traces/recent")
def get_recent_traces(limit: int = 15):
    """Get most recent agent traces across all applications for the live activity feed."""
    supabase = get_supabase()
    result = (
        supabase.table("agent_action_log")
        .select("*, loan_applications(customer_id, customers(full_name))")
        .order("created_at", desc=True)
        .limit(limit)
        .execute()
    )
    return {"success": True, "data": result.data or []}


# ============================================================
# Manager Approvals
# ============================================================
class ManagerDecisionRequest(BaseModel):
    status: str  # "approved" or "rejected"
    approved_by: str = "manager"
    manager_notes: str | None = None


@app.get("/api/approvals")
def list_pending_approvals():
    """List all pending manager approvals."""
    supabase = get_supabase()
    result = (
        supabase.table("manager_approvals")
        .select("*, loan_applications(*, customers(full_name))")
        .eq("status", "pending")
        .order("created_at", desc=True)
        .execute()
    )
    return {"success": True, "data": result.data or []}


@app.patch("/api/approvals/{approval_id}")
def decide_approval(approval_id: str, request: ManagerDecisionRequest):
    """Manager approves or rejects a flagged application."""
    supabase = get_supabase()

    # Update approval record
    supabase.table("manager_approvals").update({
        "status": request.status,
        "approved_by": request.approved_by,
        "manager_notes": request.manager_notes,
        "decided_at": "now()",
    }).eq("id", approval_id).execute()

    # Get linked application
    approval = supabase.table("manager_approvals").select("application_id").eq("id", approval_id).single().execute()
    if approval.data:
        app_id = approval.data["application_id"]
        new_status = "manager_approved" if request.status == "approved" else "manager_rejected"
        supabase.table("loan_applications").update({
            "final_status": new_status,
            "decided_at": "now()",
        }).eq("id", app_id).execute()

    return {"success": True, "message": f"Approval {request.status}"}
