from pydantic import BaseModel
from typing import List, Optional


class AutoEmailResponse(BaseModel):
    sent: List[dict]
    failed: List[dict]
