from datetime import datetime
from typing import List, Dict

from app.database import ai_conversations_collection

MAX_MESSAGES = 10


async def get_conversation_messages(student_id: str) -> List[Dict]:
    doc = await ai_conversations_collection.find_one({"student_id": student_id})
    if not doc:
        return []
    return doc.get("messages", [])


async def append_conversation_messages(student_id: str, messages: List[Dict]) -> None:
    now = datetime.utcnow()
    await ai_conversations_collection.update_one(
        {"student_id": student_id},
        {
            "$push": {
                "messages": {
                    "$each": messages,
                    "$slice": -MAX_MESSAGES,
                }
            },
            "$set": {"updated_at": now},
            "$setOnInsert": {"created_at": now},
        },
        upsert=True,
    )
