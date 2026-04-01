import json
import os
import time
from typing import List, Dict
from urllib import request, error

from dotenv import load_dotenv

load_dotenv()


_MODEL_CACHE_TTL_SECONDS = 600
_MODEL_CACHE: Dict[str, object] = {"ts": 0.0, "models": []}


def _fetch_available_models(api_key: str) -> List[str]:
    endpoints = [
        "https://api.x.ai/v1/language-models",
        "https://api.x.ai/v1/models",
    ]

    for url in endpoints:
        req = request.Request(
            url,
            headers={"Authorization": f"Bearer {api_key}"},
            method="GET",
        )
        try:
            with request.urlopen(req, timeout=30) as response:
                data = json.loads(response.read().decode("utf-8"))
        except Exception:
            continue

        items = data.get("data", [])
        model_ids = []
        for item in items:
            model_id = item.get("id") or item.get("model_id")
            if model_id:
                model_ids.append(model_id)
        if model_ids:
            return model_ids

    return []


def _get_available_models(api_key: str) -> List[str]:
    now = time.time()
    cached_models = _MODEL_CACHE.get("models", [])
    cached_ts = _MODEL_CACHE.get("ts", 0.0)
    if cached_models and (now - cached_ts) < _MODEL_CACHE_TTL_SECONDS:
        return list(cached_models)

    models = _fetch_available_models(api_key)
    if models:
        _MODEL_CACHE["models"] = models
        _MODEL_CACHE["ts"] = now
    return models


def _resolve_models(api_key: str) -> List[str]:
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

    available = _get_available_models(api_key)
    if available:
        filtered = [model for model in ordered if model in available]
        if filtered:
            return filtered
        return [available[0]]

    return ordered or ["grok-2-latest"]


def call_grok_chat(messages: List[Dict], temperature: float = 0.4) -> str:
    api_key = os.getenv("XAI_API_KEY") or os.getenv("GROK_API_KEY")
    if not api_key:
        raise ValueError("XAI_API_KEY is not set in the environment.")

    url = "https://api.x.ai/v1/chat/completions"

    last_error = None
    models = _resolve_models(api_key)

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
