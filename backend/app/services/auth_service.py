import json
import os
import time
from typing import Any, Dict, Optional, Tuple
from urllib import request, error

from fastapi import HTTPException, Request, status
from jose import jwt

JWKS_CACHE: Optional[Dict[str, Any]] = None
JWKS_CACHE_EXP: float = 0
JWKS_CACHE_TTL = 60 * 10
ROLE_CACHE: Dict[str, Tuple[str, float]] = {}
ROLE_CACHE_TTL = 60 * 5


def _get_jwks_url() -> str:
    jwks_url = os.getenv("CLERK_JWKS_URL")
    if jwks_url:
        return jwks_url

    frontend_api = os.getenv("CLERK_FRONTEND_API")
    if frontend_api:
        return f"{frontend_api}/.well-known/jwks.json"

    return "https://api.clerk.com/v1/jwks"


def _fetch_jwks() -> Dict[str, Any]:
    global JWKS_CACHE, JWKS_CACHE_EXP

    now = time.time()
    if JWKS_CACHE and now < JWKS_CACHE_EXP:
        return JWKS_CACHE

    url = _get_jwks_url()
    with request.urlopen(url, timeout=15) as response:
        data = json.loads(response.read().decode("utf-8"))

    JWKS_CACHE = data
    JWKS_CACHE_EXP = now + JWKS_CACHE_TTL
    return data


def _get_token_from_request(req: Request) -> str:
    auth_header = req.headers.get("Authorization", "")
    if auth_header.startswith("Bearer "):
        return auth_header.replace("Bearer ", "", 1).strip()

    session_cookie = req.cookies.get("__session")
    if session_cookie:
        return session_cookie

    raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing auth token")


def _decode_token(token: str) -> Dict[str, Any]:
    unverified_header = jwt.get_unverified_header(token)
    kid = unverified_header.get("kid")
    jwks = _fetch_jwks()
    key = next((k for k in jwks.get("keys", []) if k.get("kid") == kid), None)
    if not key:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")

    issuer = os.getenv("CLERK_JWT_ISSUER")
    options = {"verify_aud": False}

    try:
        if issuer:
            return jwt.decode(token, key, algorithms=["RS256"], issuer=issuer, options=options)
        return jwt.decode(token, key, algorithms=["RS256"], options=options)
    except Exception:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")


def _get_role(claims: Dict[str, Any]) -> str:
    role = claims.get("role") or claims.get("ROLE")
    if role:
        return str(role).upper()

    public_meta = claims.get("public_metadata") or {}
    role = public_meta.get("role") or public_meta.get("ROLE")
    if role:
        return str(role).upper()
    return "STUDENT"


def _fetch_role_from_clerk(user_id: str) -> Optional[str]:
    secret = os.getenv("CLERK_SECRET_KEY")
    if not secret:
        return None

    cached = ROLE_CACHE.get(user_id)
    now = time.time()
    if cached and now < cached[1]:
        return cached[0]

    url = f"https://api.clerk.com/v1/users/{user_id}"
    req = request.Request(
        url,
        headers={"Authorization": f"Bearer {secret}"},
        method="GET",
    )
    try:
        with request.urlopen(req, timeout=15) as response:
            data = json.loads(response.read().decode("utf-8"))
    except error.HTTPError:
        return None

    public_meta = data.get("public_metadata") or {}
    role = public_meta.get("role") or public_meta.get("ROLE")
    if role:
        normalized = str(role).upper()
        ROLE_CACHE[user_id] = (normalized, now + ROLE_CACHE_TTL)
        return normalized
    return None


def get_auth_context(req: Request) -> Dict[str, Any]:
    token = _get_token_from_request(req)
    claims = _decode_token(token)
    user_id = claims.get("sub")
    role = _get_role(claims)
    if role == "STUDENT" and user_id:
        fetched_role = _fetch_role_from_clerk(user_id)
        if fetched_role:
            role = fetched_role

    return {
        "user_id": user_id,
        "role": role,
        "claims": claims,
    }


def require_role(*roles: str):
    allowed = {role.upper() for role in roles}

    async def _dependency(req: Request) -> Dict[str, Any]:
        ctx = get_auth_context(req)
        if ctx["role"] not in allowed:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden")
        return ctx

    return _dependency


def require_auth(req: Request) -> Dict[str, Any]:
    return get_auth_context(req)
