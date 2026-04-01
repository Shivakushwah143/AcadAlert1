import json
import os
from typing import List, Dict
from urllib import request, error

from dotenv import load_dotenv

load_dotenv()


def _resolve_models() -> List[str]:
    primary = os.getenv("GROK_MODEL", "grok-2-latest").strip()
    fallbacks = os.getenv("GROK_MODEL_FALLBACKS", "").strip()
    fallback_single = os.getenv("GROK_MODEL_FALLBACK", "").strip()

    models = [primary] if primary else []

    if fallbacks:
        models.extend([m.strip() for m in fallbacks.split(",") if m.strip()])
    if fallback_single:
        models.append(fallback_single)

    # De-duplicate while preserving order
    seen = set()
    ordered = []
    for model in models:
        if model in seen:
            continue
        seen.add(model)
        ordered.append(model)

    return ordered or ["grok-2-latest"]


def call_grok_chat(messages: List[Dict], temperature: float = 0.4) -> str:
    api_key = os.getenv("XAI_API_KEY") or os.getenv("GROK_API_KEY")
    if not api_key:
        raise ValueError("XAI_API_KEY is not set in the environment.")

    url = "https://api.x.ai/v1/chat/completions"

    last_error = None
    models = _resolve_models()

    for model in models:
        payload = {
            "model": model,
            "messages": messages,
            "temperature": temperature,
        }

        req = request.Request(
            url,
            data=json.dumps(payload).encode("utf-8"),
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
            },
            method="POST",
        )

        try:
            with request.urlopen(req, timeout=60) as response:
                data = json.loads(response.read().decode("utf-8"))
        except error.HTTPError as exc:
            detail = exc.read().decode("utf-8") if exc.fp else str(exc)
            last_error = RuntimeError(f"Grok API error ({model}): {detail}")
            continue
        except Exception as exc:
            last_error = RuntimeError(f"Grok API error ({model}): {exc}")
            continue

        choices = data.get("choices", [])
        if not choices:
            last_error = RuntimeError(f"Grok API returned no choices ({model}).")
            continue

        message = choices[0].get("message", {})
        content = message.get("content")
        if not content:
            last_error = RuntimeError(f"Grok API response missing content ({model}).")
            continue

        return content

    raise last_error or RuntimeError("Grok API failed for all configured models.")
