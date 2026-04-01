from pydantic import BaseModel
from typing import Optional


class EmailReportRequest(BaseModel):
    recipient_email: str
    recipient_name: Optional[str] = None
    advisor_email: Optional[str] = None


class EmailReportResponse(BaseModel):
    message_id: str
    status: str
