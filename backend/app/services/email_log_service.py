from datetime import datetime
from typing import Dict

from app.database import email_send_logs_collection


async def log_email_event(event: Dict) -> None:
    payload = {**event, "logged_at": datetime.utcnow()}
    await email_send_logs_collection.insert_one(payload)
