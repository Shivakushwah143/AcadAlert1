import json
import logging
import os
from datetime import datetime
from typing import Any, Dict, List, Optional

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.platypus import (
    Flowable,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)

from app.services.grok_service import call_grok_chat

logger = logging.getLogger(__name__)

REPORTS_DIR = "./reports"
os.makedirs(REPORTS_DIR, exist_ok=True)

BRAND = {
    "ink": colors.HexColor("#0f172a"),
    "muted": colors.HexColor("#64748b"),
    "accent": colors.HexColor("#1d4ed8"),
    "accent_soft": colors.HexColor("#dbeafe"),
    "card": colors.HexColor("#f8fafc"),
    "line": colors.HexColor("#e2e8f0"),
}


class ProgressBar(Flowable):
    def __init__(self, width: float, height: float, percent: float, fill_color):
        super().__init__()
        self.width = width
        self.height = height
        self.percent = max(0.0, min(1.0, percent))
        self.fill_color = fill_color

    def draw(self):
        self.canv.setStrokeColor(colors.lightgrey)
        self.canv.setFillColor(colors.lightgrey)
        self.canv.rect(0, 0, self.width, self.height, fill=1, stroke=0)

        self.canv.setFillColor(self.fill_color)
        self.canv.rect(0, 0, self.width * self.percent, self.height, fill=1, stroke=0)


def _risk_level_color(level: str):
    return {
        "HIGH": colors.HexColor("#d64545"),
        "MEDIUM": colors.HexColor("#f0b429"),
        "LOW": colors.HexColor("#2ecc71"),
    }.get(level, colors.grey)


def _risk_factors_from_student(student_data: dict) -> List[Dict[str, Any]]:
    factors = []
    attendance = float(student_data.get("attendance_percentage", 0))
    internal_marks = float(student_data.get("internal_marks", 0))
    assignment_rate = float(student_data.get("assignment_submission_rate", 0))

    if attendance < 75:
        factors.append(
            {
                "factor_name": "Attendance",
                "current_value": attendance,
                "threshold": 75,
                "impact": "high",
            }
        )
    if internal_marks < 60:
        factors.append(
            {
                "factor_name": "Internal Marks",
                "current_value": internal_marks,
                "threshold": 60,
                "impact": "high",
            }
        )
    if assignment_rate < 70:
        factors.append(
            {
                "factor_name": "Assignment Submission",
                "current_value": assignment_rate,
                "threshold": 70,
                "impact": "medium",
            }
        )

    return factors


def _default_plan(student_data: dict, risk_factors: List[Dict[str, Any]]) -> Dict[str, Any]:
    attendance = float(student_data.get("attendance_percentage", 0))
    internal_marks = float(student_data.get("internal_marks", 0))
    assignment_rate = float(student_data.get("assignment_submission_rate", 0))

    focus_areas = []
    if attendance < 75:
        focus_areas.append("attendance")
    if internal_marks < 60:
        focus_areas.append("internal marks")
    if assignment_rate < 70:
        focus_areas.append("assignment submissions")

    summary = (
        "Focus on improving "
        + ", ".join(focus_areas)
        + " over the next six weeks with structured routines and weekly check-ins."
        if focus_areas
        else "Maintain current performance and reinforce consistent study habits."
    )

    weeks = []
    for week in range(1, 7):
        if week <= 2:
            goal = "Stabilize routines and improve attendance consistency."
            daily_tasks = [
                "Attend all scheduled classes and log attendance daily.",
                "Review lecture notes for 30 minutes each day.",
                "Submit all assignments before deadlines.",
            ]
            success_metrics = [
                "Attendance at or above 85% for the week.",
                "All assignments submitted on time.",
            ]
            resources = [
                "Timetable planner",
                "Peer accountability partner",
            ]
        elif week <= 4:
            goal = "Raise internal marks with focused practice."
            daily_tasks = [
                "Complete one targeted practice set daily.",
                "Review weak topics for 45 minutes.",
                "Attend one faculty office hour or doubt session.",
            ]
            success_metrics = [
                "Practice completion rate above 90%.",
                "Improved quiz scores or mock test results.",
            ]
            resources = [
                "Department tutorials",
                "Past question papers",
            ]
        else:
            goal = "Consolidate gains and prepare for evaluations."
            daily_tasks = [
                "Follow a 2-hour focused study block.",
                "Maintain assignment submission streak.",
                "Review attendance and adjust schedule.",
            ]
            success_metrics = [
                "Attendance above 90%.",
                "Internal marks trending upward.",
            ]
            resources = [
                "Study group sessions",
                "Advisor check-in",
            ]

        weeks.append(
            {
                "week": week,
                "goal": goal,
                "daily_tasks": daily_tasks,
                "success_metrics": success_metrics,
                "resources": resources,
            }
        )

    return {
        "summary": summary,
        "weeks": weeks,
    }


def _clean_json(text: str) -> str:
    cleaned = text.strip()
    if cleaned.startswith("```"):
        cleaned = cleaned.strip("`")
        cleaned = cleaned.replace("json", "", 1).strip()
    return cleaned


def _ai_plan(student_data: dict, risk_factors: List[Dict[str, Any]]) -> Dict[str, Any]:
    risk_text = ", ".join([f["factor_name"] for f in risk_factors]) or "None"
    prompt = (
        "Create a 6-week improvement plan in JSON with fields: "
        "summary (string) and weeks (array of 6 objects). "
        "Each week object must include: week (number), goal (string), "
        "daily_tasks (array of 3 short strings), success_metrics (array of 2 short strings), "
        "resources (array of 2 short strings). "
        "Use the student data and risk factors below. "
        "Return JSON only."
        f"\nStudent Data: {student_data}\nRisk Factors: {risk_text}"
    )

    messages = [
        {
            "role": "system",
            "content": "You are an academic coach creating structured improvement plans.",
        },
        {"role": "user", "content": prompt},
    ]

    try:
        response = call_grok_chat(messages, temperature=0.2)
        parsed = json.loads(_clean_json(response))
        if "weeks" in parsed and isinstance(parsed["weeks"], list):
            return parsed
    except Exception as exc:
        logger.warning("AI plan generation failed, using fallback: %s", exc)

    return _default_plan(student_data, risk_factors)


def generate_student_report(
    student_data: dict,
    prediction_data: dict,
    risk_factors: Optional[List[Dict[str, Any]]] = None,
    suggestions: Optional[List[str]] = None,
) -> str:
    """Generate PDF report for a student"""
    try:
        student_id = student_data.get("student_id", "unknown")
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"report_{student_id}_{timestamp}.pdf"
        filepath = os.path.join(REPORTS_DIR, filename)

        if risk_factors is None or not risk_factors:
            risk_factors = _risk_factors_from_student(student_data)

        plan = _ai_plan(student_data, risk_factors)

        doc = SimpleDocTemplate(
            filepath,
            pagesize=A4,
            rightMargin=48,
            leftMargin=48,
            topMargin=48,
            bottomMargin=36,
        )

        story: List[Any] = []

        styles = getSampleStyleSheet()
        title_style = ParagraphStyle(
            "Title",
            parent=styles["Heading1"],
            fontSize=24,
            textColor=BRAND["ink"],
            spaceAfter=4,
            alignment=TA_LEFT,
        )
        subtitle_style = ParagraphStyle(
            "Subtitle",
            parent=styles["Normal"],
            fontSize=10,
            textColor=BRAND["muted"],
            spaceAfter=16,
            alignment=TA_LEFT,
        )
        heading_style = ParagraphStyle(
            "Heading",
            parent=styles["Heading2"],
            fontSize=13,
            textColor=BRAND["ink"],
            spaceAfter=8,
            spaceBefore=14,
        )
        normal_style = ParagraphStyle(
            "Normal",
            parent=styles["Normal"],
            fontSize=10,
            textColor=BRAND["ink"],
            spaceAfter=6,
            alignment=TA_LEFT,
            leading=14,
        )
        small_style = ParagraphStyle(
            "Small",
            parent=styles["Normal"],
            fontSize=9,
            textColor=BRAND["muted"],
            spaceAfter=4,
            alignment=TA_LEFT,
            leading=12,
        )

        story.append(Paragraph("AcadAlert Risk Assessment Report", title_style))
        story.append(
            Paragraph(
                f"{student_data.get('student_name', 'N/A')} • {student_id} • {datetime.now().strftime('%B %d, %Y')}",
                subtitle_style,
            )
        )

        story.append(Paragraph("Executive Summary", heading_style))
        risk_level = prediction_data.get("risk_level", "UNKNOWN")
        risk_score = prediction_data.get("risk_score", 0)
        summary_text = (
            f"<b>Semester:</b> {student_data.get('semester', 'N/A')} • "
            f"<b>Overall Risk:</b> {risk_level} • "
            f"<b>Risk Score:</b> {risk_score:.2f}"
        )
        story.append(Paragraph(summary_text, normal_style))

        indicator_table = Table(
            [["Current Risk Level", risk_level]],
            colWidths=[150, 330],
        )
        indicator_table.setStyle(
            TableStyle(
                [
                    ("BACKGROUND", (0, 0), (-1, -1), BRAND["card"]),
                    ("BOX", (0, 0), (-1, -1), 0.6, BRAND["line"]),
                    ("INNERGRID", (0, 0), (-1, -1), 0.4, BRAND["line"]),
                    ("BACKGROUND", (1, 0), (1, 0), _risk_level_color(risk_level)),
                    ("TEXTCOLOR", (1, 0), (1, 0), colors.white),
                    ("FONTNAME", (0, 0), (-1, -1), "Helvetica-Bold"),
                    ("ALIGN", (0, 0), (-1, -1), "CENTER"),
                    ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                    ("TOPPADDING", (0, 0), (-1, -1), 8),
                    ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
                ]
            )
        )
        story.append(Spacer(1, 8))
        story.append(indicator_table)
        story.append(Spacer(1, 12))

        story.append(Paragraph("Performance Dashboard", heading_style))
        dashboard_rows = [
            ["Metric", "Value", "Threshold", "Status", "Progress"],
        ]

        metrics = [
            (
                "Attendance",
                float(student_data.get("attendance_percentage", 0)),
                75,
            ),
            (
                "Internal Marks",
                float(student_data.get("internal_marks", 0)),
                60,
            ),
            (
                "Assignment Submission",
                float(student_data.get("assignment_submission_rate", 0)),
                70,
            ),
        ]

        progress_bars = []
        for name, value, threshold in metrics:
            status = "On Track" if value >= threshold else "Needs Attention"
            progress = min(max(value / 100, 0), 1)
            color = colors.HexColor("#2ecc71") if value >= threshold else colors.HexColor("#f0b429")
            dashboard_rows.append([name, f"{value:.1f}", f">= {threshold}", status, ""])
            progress_bars.append(ProgressBar(90, 8, progress, color))

        dashboard_table = Table(dashboard_rows, colWidths=[140, 70, 80, 100, 90])
        dashboard_table.setStyle(
            TableStyle(
                [
                    ("BACKGROUND", (0, 0), (-1, 0), BRAND["accent_soft"]),
                    ("GRID", (0, 0), (-1, -1), 0.4, BRAND["line"]),
                    ("ALIGN", (1, 1), (-2, -1), "CENTER"),
                    ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                    ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                    ("TEXTCOLOR", (0, 0), (-1, 0), BRAND["ink"]),
                    ("BACKGROUND", (0, 1), (-1, -1), colors.white),
                ]
            )
        )
        story.append(dashboard_table)
        for bar in progress_bars:
            story.append(Spacer(1, 4))
            story.append(bar)
        story.append(Spacer(1, 12))

        story.append(Paragraph("Risk Factor Analysis", heading_style))
        if risk_factors:
            risk_table_rows = [["Factor", "Current", "Threshold", "Impact"]]
            for factor in risk_factors:
                risk_table_rows.append(
                    [
                        factor["factor_name"],
                        f"{factor['current_value']}",
                        f"{factor['threshold']}",
                        factor["impact"].capitalize(),
                    ]
                )
            risk_table = Table(risk_table_rows, colWidths=[180, 90, 90, 90])
            risk_table.setStyle(
                TableStyle(
                    [
                        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#fef3c7")),
                        ("GRID", (0, 0), (-1, -1), 0.4, colors.HexColor("#f59e0b")),
                        ("ALIGN", (1, 1), (-1, -1), "CENTER"),
                        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                        ("BACKGROUND", (0, 1), (-1, -1), colors.white),
                    ]
                )
            )
            story.append(risk_table)
        else:
            story.append(Paragraph("No critical risk factors detected.", small_style))

        story.append(Spacer(1, 12))

        story.append(Paragraph("AI Improvement Plan (6 Weeks)", heading_style))
        story.append(Paragraph(plan.get("summary", ""), normal_style))
        story.append(Spacer(1, 6))

        for week in plan.get("weeks", []):
            week_title = f"Week {week.get('week', '')}: {week.get('goal', '')}"
            story.append(Paragraph(week_title, normal_style))

            tasks = "<br/>".join([f"- {task}" for task in week.get("daily_tasks", [])])
            metrics = "<br/>".join([f"- {metric}" for metric in week.get("success_metrics", [])])
            resources = "<br/>".join([f"- {res}" for res in week.get("resources", [])])

            block_rows = [
                ["Daily Tasks", tasks or "—"],
                ["Success Metrics", metrics or "—"],
                ["Resources", resources or "—"],
            ]

            block_table = Table(block_rows, colWidths=[120, 350])
            block_table.setStyle(
                TableStyle(
                    [
                        ("BACKGROUND", (0, 0), (-1, -1), BRAND["card"]),
                        ("BOX", (0, 0), (-1, -1), 0.5, BRAND["line"]),
                        ("INNERGRID", (0, 0), (-1, -1), 0.3, BRAND["line"]),
                        ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"),
                        ("TEXTCOLOR", (0, 0), (0, -1), BRAND["ink"]),
                        ("VALIGN", (0, 0), (-1, -1), "TOP"),
                        ("LEFTPADDING", (0, 0), (-1, -1), 8),
                        ("RIGHTPADDING", (0, 0), (-1, -1), 8),
                        ("TOPPADDING", (0, 0), (-1, -1), 6),
                        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
                    ]
                )
            )
            story.append(block_table)
            story.append(Spacer(1, 8))

        story.append(Paragraph("Resources & Support", heading_style))
        resources_text = (
            "Recommended support resources:<br/>"
            "- Academic advisor weekly check-ins<br/>"
            "- Department tutoring sessions and study groups<br/>"
            "- Time management planner and reminders<br/>"
            "- Peer mentoring for accountability"
        )
        story.append(Paragraph(resources_text, small_style))

        doc.build(story)

        logger.info("PDF report generated: %s", filename)
        return filepath

    except Exception as exc:
        logger.error("Error generating PDF: %s", exc)
        raise Exception(f"Failed to generate PDF report: {str(exc)}")
