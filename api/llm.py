# ============================================================
# SHB-AgentOS: OpenAI Client + Agent Conversation Loop (Python)
# ============================================================

import json
from openai import OpenAI
from api.config import OPENAI_API_KEY, OPENAI_MODEL

_client: OpenAI | None = None

def get_openai() -> OpenAI:
    """Get OpenAI client singleton."""
    global _client
    if _client is None:
        if not OPENAI_API_KEY:
            raise RuntimeError("Missing OPENAI_API_KEY")
        _client = OpenAI(api_key=OPENAI_API_KEY)
    return _client

def get_model() -> str:
    return OPENAI_MODEL or "gpt-4.1-nano"


async def run_agent_conversation(
    system_prompt: str,
    user_message: str,
    tools: list[dict],
    tool_executor,  # async callable(name: str, args: dict) -> str
    max_iterations: int = 10,
    temperature: float = 0,
) -> dict:
    """
    Multi-turn tool calling conversation loop.
    Returns {"final_response": str, "tool_call_log": list}
    """
    client = get_openai()
    model = get_model()

    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": user_message},
    ]

    tool_call_log = []

    for i in range(max_iterations):
        response = client.chat.completions.create(
            model=model,
            messages=messages,
            tools=tools,
            temperature=temperature,
        )

        choice = response.choices[0]

        # If no tool calls, agent is done reasoning
        if not choice.message.tool_calls:
            return {
                "final_response": choice.message.content or "",
                "tool_call_log": tool_call_log,
                "usage": {
                    "prompt_tokens": response.usage.prompt_tokens if response.usage else 0,
                    "completion_tokens": response.usage.completion_tokens if response.usage else 0,
                },
            }

        # Process tool calls
        messages.append(choice.message)

        for tc in choice.message.tool_calls:
            args = json.loads(tc.function.arguments)
            result = await tool_executor(tc.function.name, args)

            tool_call_log.append({
                "tool_name": tc.function.name,
                "arguments": args,
                "result": result,
            })

            messages.append({
                "role": "tool",
                "tool_call_id": tc.id,
                "content": str(result),
            })

    return {
        "final_response": "Agent reached maximum iterations without completing.",
        "tool_call_log": tool_call_log,
        "usage": None,
    }


def parse_json_response(text: str, fallback: dict | None = None) -> dict:
    """Use a cheap LLM call to extract structured JSON from agent text."""
    client = get_openai()
    model = get_model()

    response = client.chat.completions.create(
        model=model,
        messages=[
            {"role": "system", "content": "Bạn là JSON parser. Chỉ trả về JSON, không trả lời gì thêm."},
            {"role": "user", "content": text},
        ],
        response_format={"type": "json_object"},
        temperature=0,
    )

    try:
        return json.loads(response.choices[0].message.content or "{}")
    except json.JSONDecodeError:
        return fallback or {"verdict": "flagged", "reasoning": "Lỗi phân tích LLM"}
