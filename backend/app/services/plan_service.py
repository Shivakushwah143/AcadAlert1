from datetime import datetime
from typing import Any, Dict, List, Optional

from app.database import plans_collection, predictions_collection, students_collection
from app.services.grok_service import call_grok_chat
from app.services.report_context_service import get_report_context


SYSTEM_PROMPT = (
    "You are an academic support assistant. "
    "Use the provided student context to create a personalized improvement plan. "
    "Be concise and practical. Format the response with clear, actionable steps. "
    "Always include sections: Summary, Action Plan, Next 7 Days, Next 30 Days, "
    "and Follow-up Questions."
)


def _risk_factors_from_student(student_data: dict) -> List[Dict[str, Any]]:
    factors = []
    attendance = float(student_data.get("attendance_percentage", 0))
    internal_marks = float(student_data.get("internal_marks", 0))
    assignment_rate = float(student_data.get("assignment_submission_rate", 0))

    if attendance < 75:
        factors.append(
            {
                "factor_name": "Attendance",
                "current_value": attendance,
                "threshold": 75,
                "impact": "high",
            }
        )
    if internal_marks < 60:
        factors.append(
            {
                "factor_name": "Internal Marks",
                "current_value": internal_marks,
                "threshold": 60,
                "impact": "high",
            }
        )
    if assignment_rate < 70:
        factors.append(
            {
                "factor_name": "Assignment Submission",
                "current_value": assignment_rate,
                "threshold": 70,
                "impact": "medium",
            }
        )

    return factors


def _default_plan_text(risk_level: str) -> str:
    return (
        "Summary:\n"
        "Focus on improving attendance, assignment completion, and internal marks with a "
        "structured weekly routine.\n\n"
        "Action Plan:\n"
        "1) Track attendance daily and target >= 85% this month.\n"
        "2) Submit all assignments 24 hours before deadlines.\n"
        "3) Complete one targeted practice set each day.\n\n"
        "Next 7 Days:\n"
        "- Attend every class and log attendance.\n"
        "- Meet one subject tutor or faculty member.\n"
        "- Finish pending assignments and revise last two lectures.\n\n"
        "Next 30 Days:\n"
        "- Maintain a weekly study plan and review progress every Sunday.\n"
        "- Improve at least one internal score by 5-10%.\n"
        "- Keep assignment submission rate above 90%.\n\n"
        "Follow-up Questions:\n"
        f"- Which subject feels hardest right now at risk level {risk_level}?\n"
        "- How many hours per week can you consistently study?"
    )


async def _build_context(student_id: str) -> Dict[str, Any]:
    report_text = get_report_context(student_id)
    if report_text:
        return {
            "context": f"Report Context:\n{report_text}",
            "risk_level": None,
        }

    student = await students_collection.find_one({"student_id": student_id})
    if not student:
        raise ValueError("Student not found")

    prediction = await predictions_collection.find_one({"student_id": student_id}) or {}
    risk_level = prediction.get("risk_level", "UNKNOWN")
    risk_score = prediction.get("risk_score")
    risk_factors = _risk_factors_from_student(student)
    factors_text = (
        ", ".join([f"{f['factor_name']} ({f['current_value']}%)" for f in risk_factors])
        or "None"
    )

    context = (
        "Student Context:\n"
        f"- Student ID: {student.get('student_id')}\n"
        f"- Name: {student.get('student_name')}\n"
        f"- Semester: {student.get('semester')}\n"
        f"- Attendance: {student.get('attendance_percentage')}%\n"
        f"- Internal Marks: {student.get('internal_marks')}%\n"
        f"- Assignment Submission: {student.get('assignment_submission_rate')}%\n"
        f"- Risk Level: {risk_level}\n"
        + (f"- Risk Score: {risk_score}\n" if risk_score is not None else "")
        + f"- Risk Factors: {factors_text}"
    )

    return {
        "context": context,
        "risk_level": risk_level,
    }


async def get_latest_plan(student_id: str) -> Optional[Dict[str, Any]]:
    plan = await plans_collection.find_one({"student_id": student_id})
    if not plan:
        return None
    return plan


async def get_plan_history(student_id: str, limit: int = 5) -> List[Dict[str, Any]]:
    plan = await plans_collection.find_one({"student_id": student_id})
    if not plan:
        return []

    current = {
        "plan_text": plan.get("plan_text", ""),
        "question_asked": plan.get("question_asked"),
        "risk_level": plan.get("risk_level"),
        "created_at": plan.get("created_at"),
        "updated_at": plan.get("updated_at"),
        "generated_by": plan.get("generated_by"),
    }

    history = plan.get("history", [])
    combined = [current] + list(reversed(history))
    combined = [item for item in combined if item.get("created_at")]
    combined.sort(key=lambda item: item["created_at"], reverse=True)
    return combined[:limit]


async def generate_and_save_plan(
    student_id: str,
    question: str,
    generated_by: str,
) -> Dict[str, Any]:
    context_payload = await _build_context(student_id)
    context_text = context_payload["context"]
    risk_level = context_payload.get("risk_level", "UNKNOWN")

    user_message = f"{context_text}\n\nUser Question: {question}"
    messages = [
        {"role": "system", "content": SYSTEM_PROMPT},
        {"role": "user", "content": user_message},
    ]

    try:
        plan_text = call_grok_chat(messages)
    except Exception:
        plan_text = _default_plan_text(str(risk_level))

    now = datetime.utcnow()

    existing = await plans_collection.find_one({"student_id": student_id})
    history_entry = None
    if existing:
        history_entry = {
            "plan_text": existing.get("plan_text", ""),
            "question_asked": existing.get("question_asked"),
            "risk_level": existing.get("risk_level"),
            "created_at": existing.get("created_at"),
            "updated_at": existing.get("updated_at"),
            "generated_by": existing.get("generated_by"),
        }

    update_doc: Dict[str, Any] = {
        "$set": {
            "plan_text": plan_text,
            "question_asked": question,
            "risk_level": risk_level,
            "created_at": now,
            "updated_at": now,
            "generated_by": generated_by,
        },
        "$setOnInsert": {"student_id": student_id},
    }

    if history_entry and history_entry.get("created_at"):
        update_doc["$push"] = {
            "history": {
                "$each": [history_entry],
                "$slice": -5,
            }
        }

    await plans_collection.update_one({"student_id": student_id}, update_doc, upsert=True)

    return {
        "plan_text": plan_text,
        "created_at": now,
        "updated_at": now,
        "question_asked": question,
        "risk_level": risk_level,
    }
