"""管理员密码哈希与短期登录会话。"""
from __future__ import annotations

import hashlib
import hmac
import secrets
import time
from typing import Dict, Optional, Tuple

PBKDF2_ITERATIONS = 310_000
SESSION_TTL_SECONDS = 8 * 60 * 60

_sessions: Dict[str, Tuple[str, float]] = {}


def hash_password(password: str, salt: Optional[str] = None) -> Tuple[str, str]:
    salt = salt or secrets.token_hex(16)
    digest = hashlib.pbkdf2_hmac(
        "sha256",
        password.encode("utf-8"),
        bytes.fromhex(salt),
        PBKDF2_ITERATIONS,
    )
    return digest.hex(), salt


def verify_password(password: str, expected_hash: str, salt: str) -> bool:
    actual_hash, _ = hash_password(password, salt)
    return hmac.compare_digest(actual_hash, expected_hash)


def create_session(username: str) -> str:
    token = secrets.token_urlsafe(32)
    _sessions[token] = (username, time.monotonic() + SESSION_TTL_SECONDS)
    return token


def validate_session(token: str) -> Optional[str]:
    session = _sessions.get(token)
    if not session:
        return None
    username, expires_at = session
    if time.monotonic() >= expires_at:
        _sessions.pop(token, None)
        return None
    return username
