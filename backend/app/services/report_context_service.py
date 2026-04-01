import glob
import os
from typing import Optional

from pypdf import PdfReader

REPORTS_DIR = "./reports"


def find_latest_report_path(student_id: str) -> Optional[str]:
    pattern = f"report_{student_id}_*.pdf"
    reports = glob.glob(os.path.join(REPORTS_DIR, pattern))
    if not reports:
        return None
    return max(reports, key=os.path.getctime)


def extract_report_text(report_path: str) -> str:
    reader = PdfReader(report_path)
    pages_text = []
    for page in reader.pages:
        text = page.extract_text() or ""
        pages_text.append(text)
    return "\n".join(pages_text)


def get_report_context(student_id: str) -> Optional[str]:
    report_path = find_latest_report_path(student_id)
    if not report_path:
        return None
    return extract_report_text(report_path)
