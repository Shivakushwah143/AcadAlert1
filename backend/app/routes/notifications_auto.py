import base64
import logging
import os
from typing import List, Dict

from fastapi import APIRouter, HTTPException, Depends

from app.database import students_collection, predictions_collection
from app.models.auto_email import AutoEmailResponse
from app.services.brevo_service import build_attachment, build_sender, send_transactional_email
from app.services.email_log_service import log_email_event
from app.services.email_plan_service import generate_plan_summary
from app.services.email_rate_limit import enforce_daily_limit, record_send, remaining_quota
from app.services.ics_service import build_six_week_schedule
from app.services.report_context_service import find_latest_report_path, get_report_context
from app.services.pdf_service import generate_student_report
from app.services.urgent_email_template import (
    build_urgent_risk_html,
    build_full_report_html,
    build_full_report_text,
)
from app.services.auth_service import require_role

router = APIRouter(prefix="/api/notifications", tags=["notifications"])
logger = logging.getLogger(__name__)

TEST_RECIPIENTS = [
    "test1@gmail.com",
    "test2@gmail.com",
    "test3@gmail.com",
    "test4@gmail.com",
    "test5@gmail.com",
    "brajrajputofficial@gmail.com",
]


def _metrics_from_student(student: Dict) -> Dict:
    return {
        "attendance_percentage": student.get("attendance_percentage", 0),
        "internal_marks": student.get("internal_marks", 0),
        "assignment_submission_rate": student.get("assignment_submission_rate", 0),
    }


def _build_email_payload(subject: str, html: str, text: str, to_list: List[Dict], attachments: List[Dict]):
    payload = {
        "sender": build_sender(),
        "to": to_list,
        "subject": subject,
        "htmlContent": html,
        "textContent": text,
    }
    if attachments:
        payload["attachment"] = attachments
    return payload


@router.post("/send-high-risk", response_model=AutoEmailResponse, dependencies=[Depends(require_role("FACULTY"))])
async def send_high_risk_reports() -> AutoEmailResponse:
    students = await students_collection.find({"risk_level": "HIGH"}).to_list(None)
    if not students:
        return AutoEmailResponse(sent=[], failed=[])

    sent: List[Dict] = []
    failed: List[Dict] = []

    base_url = os.getenv("APP_BASE_URL", "http://localhost:8000")
    support_email = os.getenv("SUPPORT_EMAIL", "support@acadalert.com")
    support_url = os.getenv("SUPPORT_URL", base_url)

    for student in students:
        prediction = await predictions_collection.find_one({"student_id": student.get("student_id")})
        risk_level = (prediction or {}).get("risk_level") or student.get("risk_level", "HIGH")

        report_path = find_latest_report_path(student.get("student_id"))
        if not report_path:
            prediction_data = prediction or {"risk_level": "HIGH", "risk_score": 0}
            report_path = await generate_student_report(student, prediction_data)

        report_text = get_report_context(student.get("student_id")) or ""
        plan_payload = generate_plan_summary(report_text)

        email_data = {
            "student_name": student.get("student_name", "Student"),
            "risk_level": risk_level,
            "metrics": _metrics_from_student(student),
            "plan_summary": plan_payload.get("summary", ""),
            "next_steps": plan_payload.get("next_steps", []),
            "support_email": support_email,
            "support_url": support_url,
            "report_url": f"{base_url}/api/download-report/{student.get('student_id')}",
        }

        urgent_html = build_urgent_risk_html(email_data)
        urgent_text = f"Urgent risk alert for {student.get('student_name', 'Student')}."

        full_html = build_full_report_html(email_data)
        full_text = build_full_report_text(email_data)

        pdf_attachment = build_attachment(
            f"AcadAlert_Report_{student.get('student_id')}.pdf",
            base64.b64encode(open(report_path, "rb").read()).decode("utf-8"),
        )

        ics_content = build_six_week_schedule(student.get("student_name", "Student"))
        ics_attachment = build_attachment(
            "AcadAlert_6Week_Schedule.ics",
            base64.b64encode(ics_content.encode("utf-8")).decode("utf-8"),
        )

        recipients = [{"email": email} for email in TEST_RECIPIENTS]

        for email_type, subject, html, text, attachments in [
            (
                "urgent",
                "AcadAlert: Urgent Risk Alert",
                urgent_html,
                urgent_text,
                [],
            ),
            (
                "full_report",
                "AcadAlert: Full Report & Calendar Invite",
                full_html,
                full_text,
                [pdf_attachment, ics_attachment],
            ),
        ]:
            try:
                remaining = await remaining_quota()
                if remaining <= 0:
                    raise RuntimeError("Daily email limit reached (300/day)")

                await enforce_daily_limit()
                payload = _build_email_payload(subject, html, text, recipients, attachments)
                response = send_transactional_email(payload)
                message_id = response.get("messageId", "")

                await record_send(student.get("student_id", "unknown"), ",".join(TEST_RECIPIENTS))
                await log_email_event(
                    {
                        "student_id": student.get("student_id"),
                        "email_type": email_type,
                        "status": "sent",
                        "message_id": message_id,
                        "recipients": TEST_RECIPIENTS,
                    }
                )

                sent.append(
                    {
                        "student_id": student.get("student_id"),
                        "email_type": email_type,
                        "message_id": message_id,
                    }
                )
            except Exception as exc:
                logger.error("Email send failed: %s", exc)
                await log_email_event(
                    {
                        "student_id": student.get("student_id"),
                        "email_type": email_type,
                        "status": "failed",
                        "error": str(exc),
                        "recipients": TEST_RECIPIENTS,
                    }
                )
                failed.append(
                    {
                        "student_id": student.get("student_id"),
                        "email_type": email_type,
                        "error": str(exc),
                    }
                )

    return AutoEmailResponse(sent=sent, failed=failed)
