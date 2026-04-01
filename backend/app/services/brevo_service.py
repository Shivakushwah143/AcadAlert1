import base64
import json
import os
from typing import List, Dict
from urllib import request, error

from dotenv import load_dotenv

load_dotenv()


def send_transactional_email(payload: Dict) -> Dict:
    api_key = os.getenv("BREVO_API_KEY")
    if not api_key:
        raise ValueError("BREVO_API_KEY is not set in the environment.")

    url = "https://api.brevo.com/v3/smtp/email"
    req = request.Request(
        url,
        data=json.dumps(payload).encode("utf-8"),
        headers={
            "api-key": api_key,
            "content-type": "application/json",
            "accept": "application/json",
        },
        method="POST",
    )

    try:
        with request.urlopen(req, timeout=60) as response:
            return json.loads(response.read().decode("utf-8"))
    except error.HTTPError as exc:
        detail = exc.read().decode("utf-8") if exc.fp else str(exc)
        raise RuntimeError(f"Brevo API error: {detail}") from exc


def encode_file_to_base64(path: str) -> str:
    with open(path, "rb") as file:
        return base64.b64encode(file.read()).decode("utf-8")


def build_attachment(name: str, content_b64: str) -> Dict:
    return {
        "name": name,
        "content": content_b64,
    }


def build_sender() -> Dict:
    sender_email = os.getenv("BREVO_SENDER_EMAIL", "no-reply@acadalert.com")
    sender_name = os.getenv("BREVO_SENDER_NAME", "AcadAlert")
    return {"email": sender_email, "name": sender_name}
