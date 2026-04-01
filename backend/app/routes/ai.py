from fastapi import APIRouter, HTTPException

from app.models.ai import (
    PlanCreateResponse,
    PlanHistoryResponse,
    PlanLatestResponse,
    PlanRequest,
)
from app.services.ai_memory_service import append_conversation_messages
from app.services.plan_service import generate_and_save_plan, get_latest_plan, get_plan_history

router = APIRouter(prefix="/api/ai", tags=["ai"])


@router.post("/plan/{student_id}", response_model=PlanCreateResponse)
async def generate_plan(
    student_id: str,
    payload: PlanRequest,
) -> PlanCreateResponse:
    question = payload.question or "Generate a personalized improvement plan."

    plan_payload = await generate_and_save_plan(
        student_id=student_id,
        question=question,
        generated_by="ui",
    )

    await append_conversation_messages(
        student_id,
        [
            {"role": "user", "content": question},
            {"role": "assistant", "content": plan_payload["plan_text"]},
        ],
    )

    return PlanCreateResponse(
        plan_text=plan_payload["plan_text"],
        created_at=plan_payload["created_at"],
        updated_at=plan_payload["updated_at"],
    )


@router.get("/plan/{student_id}/latest", response_model=PlanLatestResponse)
async def get_latest_student_plan(student_id: str) -> PlanLatestResponse:
    plan = await get_latest_plan(student_id)
    if not plan:
        raise HTTPException(status_code=404, detail="No plan found")

    return PlanLatestResponse(
        plan_text=plan.get("plan_text", ""),
        created_at=plan.get("created_at"),
        updated_at=plan.get("updated_at"),
        question_asked=plan.get("question_asked"),
        risk_level=plan.get("risk_level"),
    )


@router.get("/plan/{student_id}/history", response_model=PlanHistoryResponse)
async def get_student_plan_history(student_id: str) -> PlanHistoryResponse:
    plans = await get_plan_history(student_id, limit=5)
    return PlanHistoryResponse(student_id=student_id, plans=plans)
