from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime


class PlanRequest(BaseModel):
    question: Optional[str] = None


class PlanCreateResponse(BaseModel):
    plan_text: str
    created_at: datetime
    updated_at: datetime


class PlanLatestResponse(BaseModel):
    plan_text: str
    created_at: datetime
    updated_at: datetime
    question_asked: Optional[str] = None
    risk_level: Optional[str] = None


class PlanHistoryItem(BaseModel):
    plan_text: str
    created_at: datetime
    updated_at: datetime
    question_asked: Optional[str] = None
    risk_level: Optional[str] = None
    generated_by: Optional[str] = None


class PlanHistoryResponse(BaseModel):
    student_id: str
    plans: List[PlanHistoryItem]
