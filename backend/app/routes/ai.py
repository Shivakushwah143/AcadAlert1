from fastapi import APIRouter, HTTPException

from app.models.ai import PlanRequest, PlanResponse
from app.services.ai_memory_service import (
    append_conversation_messages,
    get_conversation_messages,
)
from app.services.grok_service import call_grok_chat
from app.services.report_context_service import get_report_context

router = APIRouter(prefix="/api/ai", tags=["ai"])

SYSTEM_PROMPT = (
    "You are an academic support assistant. "
    "Use the provided PDF report context to create a personalized improvement plan. "
    "Be concise and practical. Format the response with clear, actionable steps. "
    "Always include sections: Summary, Action Plan, Next 7 Days, Next 30 Days, "
    "and Follow-up Questions."
)


@router.post("/plan/{student_id}", response_model=PlanResponse)
async def generate_plan(
    student_id: str,
    payload: PlanRequest,
) -> PlanResponse:
    report_text = get_report_context(student_id)
    if not report_text:
        raise HTTPException(
            status_code=404,
            detail="No report found for this student. Generate the report first.",
        )

    question = payload.question or "Generate a personalized improvement plan."

    conversation = await get_conversation_messages(student_id)

    user_message = (
        "Report Context:\n"
        f"{report_text}\n\n"
        f"User Question: {question}"
    )

    messages = [
        {"role": "system", "content": SYSTEM_PROMPT},
        *conversation,
        {"role": "user", "content": user_message},
    ]

    plan_text = call_grok_chat(messages)

    await append_conversation_messages(
        student_id,
        [
            {"role": "user", "content": question},
            {"role": "assistant", "content": plan_text},
        ],
    )

    return PlanResponse(student_id=student_id, plan=plan_text)
