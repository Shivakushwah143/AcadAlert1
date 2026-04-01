from typing import Dict, List


def build_urgent_risk_html(data: Dict) -> str:
    metrics = data.get("metrics", {})
    student_name = data.get("student_name", "Student")
    plan_summary = data.get("plan_summary", "")
    next_steps = data.get("next_steps", [])

    steps_html = "".join(
        f"<li style='margin-bottom:8px;color:#7f1d1d;'>{step}</li>" for step in next_steps
    )

    return f"""
<!DOCTYPE html>
<html>
  <head>
    <meta charset='utf-8'>
    <meta name='viewport' content='width=device-width, initial-scale=1.0'>
    <title>Urgent Risk Alert</title>
  </head>
  <body style='margin:0;padding:0;background:#fff1f2;font-family:Arial,sans-serif;'>
    <table role='presentation' width='100%' cellpadding='0' cellspacing='0' style='background:#fff1f2;padding:24px;'>
      <tr>
        <td align='center'>
          <table role='presentation' width='600' cellpadding='0' cellspacing='0' style='background:#ffffff;border-radius:12px;overflow:hidden;'>
            <tr>
              <td style='background:#b91c1c;color:#ffffff;padding:24px;'>
                <h1 style='margin:0;font-size:22px;'>AcadAlert Urgent Risk Alert</h1>
                <p style='margin:6px 0 0;font-size:13px;'>Immediate attention required</p>
              </td>
            </tr>
            <tr>
              <td style='padding:24px;'>
                <h2 style='margin:0 0 8px;color:#7f1d1d;'>Hello {student_name},</h2>
                <p style='margin:0 0 16px;color:#991b1b;'>Your current academic risk level is HIGH. Please review the critical metrics below.</p>

                <table role='presentation' width='100%' cellpadding='0' cellspacing='0' style='border-collapse:collapse;'>
                  <tr>
                    <td style='padding:10px;border:1px solid #fecaca;'>Attendance</td>
                    <td style='padding:10px;border:1px solid #fecaca;color:#b91c1c;'><strong>{metrics.get("attendance_percentage", 0)}%</strong></td>
                  </tr>
                  <tr>
                    <td style='padding:10px;border:1px solid #fecaca;'>Internal Marks</td>
                    <td style='padding:10px;border:1px solid #fecaca;color:#b91c1c;'><strong>{metrics.get("internal_marks", 0)}/100</strong></td>
                  </tr>
                  <tr>
                    <td style='padding:10px;border:1px solid #fecaca;'>Assignment Submission</td>
                    <td style='padding:10px;border:1px solid #fecaca;color:#b91c1c;'><strong>{metrics.get("assignment_submission_rate", 0)}%</strong></td>
                  </tr>
                </table>

                <h3 style='margin:20px 0 8px;color:#7f1d1d;'>Immediate Improvement Plan</h3>
                <p style='margin:0 0 12px;color:#7f1d1d;'>{plan_summary}</p>

                <ul style='margin:0;padding-left:18px;'>
                  {steps_html}
                </ul>

                <div style='margin-top:20px;'>
                  <a href='{data.get("support_url", "#")}' style='background:#b91c1c;color:#ffffff;text-decoration:none;padding:10px 16px;border-radius:6px;font-size:14px;'>Book Advisor Check-in</a>
                </div>
              </td>
            </tr>
            <tr>
              <td style='background:#fff5f5;padding:16px;text-align:center;color:#991b1b;font-size:12px;'>
                Need help immediately? Contact {data.get("support_email", "support@acadalert.com")}.
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
"""


def build_full_report_html(data: Dict) -> str:
    risk_color = "#b91c1c" if data.get("risk_level") == "HIGH" else "#1f2933"
    student_name = data.get("student_name", "Student")

    return f"""
<!DOCTYPE html>
<html>
  <head>
    <meta charset='utf-8'>
    <meta name='viewport' content='width=device-width, initial-scale=1.0'>
    <title>AcadAlert Full Report</title>
  </head>
  <body style='margin:0;padding:0;background:#f3f4f6;font-family:Arial,sans-serif;'>
    <table role='presentation' width='100%' cellpadding='0' cellspacing='0' style='background:#f3f4f6;padding:24px;'>
      <tr>
        <td align='center'>
          <table role='presentation' width='600' cellpadding='0' cellspacing='0' style='background:#ffffff;border-radius:12px;overflow:hidden;'>
            <tr>
              <td style='background:#1f3a8a;color:#ffffff;padding:24px;'>
                <h1 style='margin:0;font-size:22px;'>AcadAlert Report & Calendar Invite</h1>
                <p style='margin:6px 0 0;font-size:13px;'>Download your detailed report and schedule</p>
              </td>
            </tr>
            <tr>
              <td style='padding:24px;'>
                <h2 style='margin:0 0 8px;color:#111827;'>Hello {student_name},</h2>
                <p style='margin:0 0 16px;color:#4b5563;'>Attached is your full PDF report and a 6-week calendar invite.</p>

                <div style='border:1px solid #e5e7eb;border-radius:10px;padding:16px;margin-bottom:16px;'>
                  <p style='margin:0 0 6px;font-weight:bold;color:#111827;'>Risk Level</p>
                  <span style='display:inline-block;padding:6px 12px;border-radius:999px;background:{risk_color};color:#ffffff;font-size:12px;'>
                    {data.get("risk_level", "UNKNOWN")}
                  </span>
                </div>

                <div style='margin-top:16px;'>
                  <a href='{data.get("report_url", "#")}' style='background:#2563eb;color:#ffffff;text-decoration:none;padding:10px 16px;border-radius:6px;font-size:14px;'>Download Report</a>
                </div>
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


def build_full_report_text(data: Dict) -> str:
    return (
        "AcadAlert Full Report\n\n"
        f"Student: {data.get('student_name', 'Student')}\n"
        f"Risk Level: {data.get('risk_level', 'UNKNOWN')}\n"
        "Full report and 6-week calendar invite are attached.\n"
    )
