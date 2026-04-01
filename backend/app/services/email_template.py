from typing import Dict, List


def build_email_html(data: Dict) -> str:
    risk_color = {
        "HIGH": "#d64545",
        "MEDIUM": "#f0b429",
        "LOW": "#2ecc71",
    }.get(data.get("risk_level", ""), "#6b7280")

    metrics = data.get("metrics", {})
    plan_summary = data.get("plan_summary", "")
    next_steps = data.get("next_steps", [])
    student_name = data.get("student_name", "Student")
    report_url = data.get("report_url", "#")
    calendar_url = data.get("calendar_url", "#")

    steps_html = "".join(
        f"<li style='margin-bottom:8px;color:#374151;'>{step}</li>"
        for step in next_steps
    )

    return f"""
<!DOCTYPE html>
<html>
  <head>
    <meta charset='utf-8'>
    <meta name='viewport' content='width=device-width, initial-scale=1.0'>
    <title>AcadAlert Report</title>
  </head>
  <body style='margin:0;padding:0;background:#f3f4f6;font-family:Arial,sans-serif;'>
    <table role='presentation' width='100%' cellpadding='0' cellspacing='0' style='background:#f3f4f6;padding:24px;'>
      <tr>
        <td align='center'>
          <table role='presentation' width='600' cellpadding='0' cellspacing='0' style='background:#ffffff;border-radius:12px;overflow:hidden;'>
            <tr>
              <td style='background:#1f3a8a;color:#ffffff;padding:24px;'>
                <h1 style='margin:0;font-size:22px;'>AcadAlert Student Report</h1>
                <p style='margin:6px 0 0;font-size:13px;'>Personalized risk assessment and improvement plan</p>
              </td>
            </tr>
            <tr>
              <td style='padding:24px;'>
                <h2 style='margin:0 0 8px;color:#111827;'>Hello {student_name},</h2>
                <p style='margin:0 0 16px;color:#4b5563;'>Here is your updated academic risk report and improvement plan.</p>

                <div style='border:1px solid #e5e7eb;border-radius:10px;padding:16px;margin-bottom:16px;'>
                  <p style='margin:0 0 6px;font-weight:bold;color:#111827;'>Risk Level</p>
                  <span style='display:inline-block;padding:6px 12px;border-radius:999px;background:{risk_color};color:#ffffff;font-size:12px;'>
                    {data.get("risk_level", "UNKNOWN")}
                  </span>
                </div>

                <h3 style='margin:16px 0 8px;color:#111827;'>Key Metrics</h3>
                <table role='presentation' width='100%' cellpadding='0' cellspacing='0' style='border-collapse:collapse;'>
                  <tr>
                    <td style='padding:10px;border:1px solid #e5e7eb;'>Attendance</td>
                    <td style='padding:10px;border:1px solid #e5e7eb;'>{metrics.get("attendance_percentage", 0)}%</td>
                  </tr>
                  <tr>
                    <td style='padding:10px;border:1px solid #e5e7eb;'>Internal Marks</td>
                    <td style='padding:10px;border:1px solid #e5e7eb;'>{metrics.get("internal_marks", 0)}/100</td>
                  </tr>
                  <tr>
                    <td style='padding:10px;border:1px solid #e5e7eb;'>Assignment Submission</td>
                    <td style='padding:10px;border:1px solid #e5e7eb;'>{metrics.get("assignment_submission_rate", 0)}%</td>
                  </tr>
                </table>

                <h3 style='margin:20px 0 8px;color:#111827;'>AI Improvement Plan Summary</h3>
                <p style='margin:0 0 12px;color:#374151;'>{plan_summary}</p>

                <h3 style='margin:20px 0 8px;color:#111827;'>Actionable Next Steps</h3>
                <ul style='margin:0;padding-left:18px;'>
                  {steps_html}
                </ul>

                <div style='margin:24px 0;display:flex;gap:12px;flex-wrap:wrap;'>
                  <a href='{report_url}' style='background:#2563eb;color:#ffffff;text-decoration:none;padding:10px 16px;border-radius:6px;font-size:14px;'>Download Report</a>
                  <a href='{calendar_url}' style='background:#111827;color:#ffffff;text-decoration:none;padding:10px 16px;border-radius:6px;font-size:14px;'>Add Calendar Check-in</a>
                </div>

                <p style='margin:0;color:#6b7280;font-size:12px;'>This report is intended for students and academic advisors for improvement planning.</p>
              </td>
            </tr>
            <tr>
              <td style='background:#f9fafb;padding:16px;text-align:center;color:#6b7280;font-size:12px;'>
                Need help? Contact support at {data.get("support_email", "support@acadalert.com")}.
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
"""


def build_email_text(data: Dict) -> str:
    metrics = data.get("metrics", {})
    next_steps = "\n".join([f"- {step}" for step in data.get("next_steps", [])])
    return (
        f"AcadAlert Student Report\n\n"
        f"Student: {data.get('student_name', 'Student')}\n"
        f"Risk Level: {data.get('risk_level', 'UNKNOWN')}\n\n"
        "Key Metrics:\n"
        f"Attendance: {metrics.get('attendance_percentage', 0)}%\n"
        f"Internal Marks: {metrics.get('internal_marks', 0)}/100\n"
        f"Assignment Submission: {metrics.get('assignment_submission_rate', 0)}%\n\n"
        "AI Plan Summary:\n"
        f"{data.get('plan_summary', '')}\n\n"
        "Next Steps:\n"
        f"{next_steps}\n"
    )
