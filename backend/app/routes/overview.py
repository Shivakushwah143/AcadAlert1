import asyncio
from pathlib import Path
from typing import List, Dict, Any, Optional

from fastapi import APIRouter, HTTPException

from app.database import students_collection, predictions_collection
from app.services.pdf_service import generate_student_report

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])


def _visualizations() -> List[Dict[str, Any]]:
    vis_dir = (Path(__file__).resolve().parent.parent.parent / "visualizations").resolve()
    if not vis_dir.exists():
        return []

    items: List[Dict[str, Any]] = []
    for path in vis_dir.iterdir():
        if not path.is_file():
            continue
        if path.suffix.lower() not in {".png", ".jpg", ".jpeg", ".gif", ".webp", ".svg"}:
            continue
        stat = path.stat()
        items.append(
            {
                "name": path.stem.replace("_", " ").title(),
                "filename": path.name,
                "url": f"/visualizations/{path.name}",
                "size": stat.st_size,
                "modified": int(stat.st_mtime),
            }
        )
    items.sort(key=lambda item: item["modified"], reverse=True)
    return items


def _report_status() -> Dict[str, Any]:
    reports_dir = (Path(__file__).resolve().parent.parent.parent / "reports").resolve()
    if not reports_dir.exists():
        return {"generated": 0, "latest_report_at": None}

    student_ids = set()
    latest_mtime: Optional[int] = None
    for path in reports_dir.glob("report_*_*.pdf"):
        name = path.name
        parts = name.split("_")
        if len(parts) >= 3:
            student_ids.add(parts[1])
        stat = path.stat()
        mtime = int(stat.st_mtime)
        latest_mtime = mtime if latest_mtime is None else max(latest_mtime, mtime)

    return {"generated": len(student_ids), "latest_report_at": latest_mtime}


@router.get("/overview")
async def get_overview(limit: int = 200):
    try:
        total_students, high_risk, medium_risk, low_risk = await asyncio.gather(
            students_collection.count_documents({}),
            predictions_collection.count_documents({"risk_level": "HIGH"}),
            predictions_collection.count_documents({"risk_level": "MEDIUM"}),
            predictions_collection.count_documents({"risk_level": "LOW"}),
        )

        total_predicted = high_risk + medium_risk + low_risk
        risk_percentages = {
            "high": round((high_risk / total_predicted * 100) if total_predicted > 0 else 0, 2),
            "medium": round((medium_risk / total_predicted * 100) if total_predicted > 0 else 0, 2),
            "low": round((low_risk / total_predicted * 100) if total_predicted > 0 else 0, 2),
        }

        students = await students_collection.find({}, {"_id": 1, "student_id": 1, "student_name": 1, "attendance_percentage": 1, "internal_marks": 1, "assignment_submission_rate": 1, "semester": 1}).limit(limit).to_list(limit)
        student_ids = [s.get("student_id") for s in students if s.get("student_id") is not None]
        predictions = []
        if student_ids:
            predictions = await predictions_collection.find(
                {"student_id": {"$in": student_ids}},
                {"student_id": 1, "risk_level": 1, "risk_score": 1},
            ).to_list(None)
        pred_map = {p.get("student_id"): p for p in predictions if p.get("student_id") is not None}
        for student in students:
            prediction = pred_map.get(student.get("student_id"))
            if prediction:
                student["risk_level"] = prediction.get("risk_level")
                student["risk_score"] = prediction.get("risk_score")

        # Convert ObjectId to string
        from app.routes.upload import convert_objectid_to_str

        students = convert_objectid_to_str(students)

        return {
            "stats": {
                "total_students": total_students,
                "high_risk": high_risk,
                "medium_risk": medium_risk,
                "low_risk": low_risk,
                "risk_percentages": risk_percentages,
            },
            "students": students,
            "visualizations": _visualizations(),
            "reports": _report_status(),
        }
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.post("/reports/batch")
async def generate_reports_batch(batch_size: int = 10, file_id: Optional[str] = None):
    try:
        query: Dict[str, Any] = {}
        if file_id:
            query["file_id"] = file_id

        students = await students_collection.find(query).to_list(None)

        reports_dir = (Path(__file__).resolve().parent.parent / "reports").resolve()
        reports_dir.mkdir(parents=True, exist_ok=True)

        generated_for = set()
        for path in reports_dir.glob("report_*_*.pdf"):
            parts = path.name.split("_")
            if len(parts) >= 3:
                generated_for.add(parts[1])

        pending = [s for s in students if str(s.get("student_id")) not in generated_for]
        pending_slice = pending[:batch_size]

        generated = []
        for student in pending_slice:
            prediction = await predictions_collection.find_one(
                {"student_id": student.get("student_id")}
            )
            filepath = await generate_student_report(
                student_data=student,
                prediction_data=prediction or {"risk_level": "LOW", "risk_score": 0},
                risk_factors=[],
                suggestions=[
                    "Continue maintaining good academic performance",
                    "Review progress regularly",
                ],
            )
            generated.append(Path(filepath).name)

        return {
            "generated": len(generated),
            "generated_files": generated,
            "remaining": max(0, len(pending) - len(generated)),
        }
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))
