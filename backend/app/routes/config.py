from fastapi import APIRouter, Depends

from app.database import database
from app.services.auth_service import require_role

router = APIRouter(prefix="/api/config", tags=["config"])

collection = database["risk_config"]

DEFAULT_CONFIG = {
    "weights": {
        "attendance_percentage": 0.4,
        "internal_marks": 0.4,
        "assignment_submission_rate": 0.2,
    },
    "thresholds": {
        "attendance_percentage": 75,
        "internal_marks": 60,
        "assignment_submission_rate": 70,
    },
}


@router.get("/risk", dependencies=[Depends(require_role("FACULTY"))])
async def get_risk_config() -> dict:
    doc = await collection.find_one({"_id": "risk_config"})
    if not doc:
        return DEFAULT_CONFIG
    doc.pop("_id", None)
    return doc


@router.put("/risk", dependencies=[Depends(require_role("FACULTY"))])
async def update_risk_config(payload: dict) -> dict:
    await collection.update_one(
        {"_id": "risk_config"},
        {"$set": payload},
        upsert=True,
    )
    return {"status": "updated"}
