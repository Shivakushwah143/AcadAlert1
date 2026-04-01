import base64
import logging
import os

from fastapi import APIRouter, HTTPException, Depends

from app.database import predictions_collection, students_collection
from app.models.email import EmailReportRequest, EmailReportResponse
from app.services.brevo_service import build_attachment, build_sender, send_transactional_email
from app.services.email_plan_service import generate_plan_summary
from app.services.email_rate_limit import enforce_daily_limit, record_send
from app.services.email_template import build_email_html, build_email_text
from app.services.ics_service import build_checkin_invite
from app.services.report_context_service import find_latest_report_path, get_report_context
from app.services.pdf_service import generate_student_report

router = APIRouter(prefix="/api/notifications", tags=["notifications"])
logger = logging.getLogger(__name__)


@router.post("/email-report/{student_id}", response_model=EmailReportResponse)
async def send_report_email(student_id: str, payload: EmailReportRequest) -> EmailReportResponse:
    await enforce_daily_limit()

    student = await students_collection.find_one({"student_id": student_id})
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    prediction = await predictions_collection.find_one({"student_id": student_id})
    risk_level = (prediction or {}).get("risk_level") or student.get("risk_level")

    # Allow sending for any risk level to support faculty outreach

    report_path = find_latest_report_path(student_id)
    if not report_path:
        prediction_data = prediction or {"risk_level": "LOW", "risk_score": 0}
        report_path = generate_student_report(student, prediction_data)

    report_text = get_report_context(student_id) or ""
    plan_payload = generate_plan_summary(report_text)

    metrics = {
        "attendance_percentage": student.get("attendance_percentage", 0),
        "internal_marks": student.get("internal_marks", 0),
        "assignment_submission_rate": student.get("assignment_submission_rate", 0),
    }

    base_url = os.getenv("APP_BASE_URL", "http://localhost:8000")
    support_email = os.getenv("SUPPORT_EMAIL", "support@acadalert.com")

    email_data = {
        "student_name": student.get("student_name", "Student"),
        "risk_level": risk_level,
        "metrics": metrics,
        "plan_summary": plan_payload.get("summary", ""),
        "next_steps": plan_payload.get("next_steps", []),
        "report_url": f"{base_url}/api/download-report/{student_id}",
        "calendar_url": base_url,
        "support_email": support_email,
    }

    html_content = build_email_html(email_data)
    text_content = build_email_text(email_data)

    pdf_b64 = build_attachment(
        f"AcadAlert_Report_{student_id}.pdf",
        base64.b64encode(open(report_path, "rb").read()).decode("utf-8"),
    )

    ics_content = build_checkin_invite(student.get("student_name", "Student"))
    ics_b64 = build_attachment(
        "AcadAlert_Checkin.ics",
        base64.b64encode(ics_content.encode("utf-8")).decode("utf-8"),
    )

    to_list = [{"email": payload.recipient_email, "name": payload.recipient_name or ""}]
    cc_list = []
    if payload.advisor_email:
        cc_list.append({"email": payload.advisor_email, "name": "Advisor"})

    email_payload = {
        "sender": build_sender(),
        "to": to_list,
        "subject": "AcadAlert: Your Academic Risk Report and Improvement Plan",
        "htmlContent": html_content,
        "textContent": text_content,
        "attachment": [pdf_b64, ics_b64],
    }

    if cc_list:
        email_payload["cc"] = cc_list

    try:
        response = send_transactional_email(email_payload)
        message_id = response.get("messageId", "")
    except Exception as exc:
        logger.error("Brevo send failed: %s", exc)
        raise HTTPException(status_code=500, detail="Email send failed")

    await record_send(student_id, payload.recipient_email)

    return EmailReportResponse(message_id=message_id, status="sent")
