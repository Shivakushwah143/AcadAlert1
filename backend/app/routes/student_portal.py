from fastapi import APIRouter, Depends, HTTPException

from app.database import predictions_collection, students_collection
from app.services.auth_service import require_role
from app.services.pdf_service import generate_student_report
from app.services.plan_service import generate_and_save_plan

router = APIRouter(prefix="/api/student", tags=["student"])


async def _get_student_for_user(user_id: str) -> dict:
    student = await students_collection.find_one({"clerk_user_id": user_id})
    if not student:
        raise HTTPException(status_code=404, detail="Student profile not found")
    return student


@router.get("/me/dashboard", dependencies=[Depends(require_role("STUDENT"))])
async def get_my_dashboard(ctx: dict = Depends(require_role("STUDENT"))):
    student = await _get_student_for_user(ctx["user_id"])
    prediction = await predictions_collection.find_one(
        {"student_id": student.get("student_id")}
    )

    student["_id"] = str(student["_id"])
    if prediction and "_id" in prediction:
        prediction["_id"] = str(prediction["_id"])

    return {
        "student": student,
        "prediction": prediction,
        "report_url": f"/api/download-report/{student.get('student_id')}",
    }


@router.get("/me/report", dependencies=[Depends(require_role("STUDENT"))])
async def generate_my_report(ctx: dict = Depends(require_role("STUDENT"))):
    student = await _get_student_for_user(ctx["user_id"])
    prediction = await predictions_collection.find_one(
        {"student_id": student.get("student_id")}
    )
    prediction_data = prediction or {"risk_level": "LOW", "risk_score": 0}

    pdf_path = generate_student_report(student, prediction_data)
    return {
        "message": "Report generated",
        "report_path": pdf_path,
        "download_url": f"/api/download-report/{student.get('student_id')}",
    }


@router.post("/me/ai-plan", dependencies=[Depends(require_role("STUDENT"))])
async def generate_my_ai_plan(ctx: dict = Depends(require_role("STUDENT"))):
    student = await _get_student_for_user(ctx["user_id"])
    plan_payload = await generate_and_save_plan(
        student_id=student.get("student_id"),
        question="Generate a short improvement plan.",
        generated_by="student_portal",
    )

    return {"plan": plan_payload["plan_text"]}


@router.post("/me/link", dependencies=[Depends(require_role("STUDENT"))])
async def link_student_profile(payload: dict, ctx: dict = Depends(require_role("STUDENT"))):
    student_id = payload.get("student_id")
    if not student_id:
        raise HTTPException(status_code=400, detail="student_id is required")

    student = await students_collection.find_one({"student_id": student_id})
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    existing = student.get("clerk_user_id")
    if existing and existing != ctx["user_id"]:
        raise HTTPException(status_code=409, detail="Student already linked")

    await students_collection.update_one(
        {"student_id": student_id},
        {"$set": {"clerk_user_id": ctx["user_id"]}},
    )

    return {"status": "linked", "student_id": student_id}
