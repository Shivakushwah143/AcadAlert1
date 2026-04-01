from pydantic import BaseModel
from typing import Optional


class PlanRequest(BaseModel):
    question: Optional[str] = None


class PlanResponse(BaseModel):
    student_id: str
    plan: str
