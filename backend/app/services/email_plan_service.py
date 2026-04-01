import json
from typing import Dict, List

from app.services.grok_service import call_grok_chat


def _clean_json(text: str) -> str:
    cleaned = text.strip()
    if cleaned.startswith("```"):
        cleaned = cleaned.strip("`")
        cleaned = cleaned.replace("json", "", 1).strip()
    return cleaned


def generate_plan_summary(report_text: str) -> Dict[str, List[str]]:
    prompt = (
        "Summarize the student's improvement plan in JSON with fields: "
        "summary (string) and next_steps (array of 3 short actionable steps). "
        "Use the report context below. Return JSON only.\n\n"
        f"Report Context:\n{report_text}"
    )

    messages = [
        {"role": "system", "content": "You are an academic advisor writing concise plans."},
        {"role": "user", "content": prompt},
    ]

    try:
        response = call_grok_chat(messages, temperature=0.2)
        parsed = json.loads(_clean_json(response))
        if "summary" in parsed and "next_steps" in parsed:
            return parsed
    except Exception:
        pass

    return {
        "summary": "Focus on improving attendance, assignment completion, and internal marks over the next few weeks.",
        "next_steps": [
            "Attend every class this week and track attendance daily.",
            "Submit all assignments at least 24 hours before deadlines.",
            "Complete one targeted practice set each day.",
        ],
    }
