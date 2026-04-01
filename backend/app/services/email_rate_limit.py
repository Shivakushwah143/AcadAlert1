from datetime import datetime

from app.database import email_limits_collection

DAILY_LIMIT = 300


def _today_key() -> str:
    return datetime.utcnow().strftime("%Y-%m-%d")


async def enforce_daily_limit() -> None:
    today = _today_key()
    count = await email_limits_collection.count_documents({"date": today})
    if count >= DAILY_LIMIT:
        raise RuntimeError("Daily email limit reached (300/day)")


async def remaining_quota() -> int:
    today = _today_key()
    count = await email_limits_collection.count_documents({"date": today})
    remaining = DAILY_LIMIT - count
    return max(0, remaining)


async def record_send(student_id: str, recipient: str) -> None:
    await email_limits_collection.insert_one(
        {
            "date": _today_key(),
            "student_id": student_id,
            "recipient": recipient,
            "sent_at": datetime.utcnow(),
        }
    )
