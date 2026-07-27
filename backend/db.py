"""SQLite 存取：建表、写入、读取最近的鱼。"""
from __future__ import annotations

import json
import os
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List

import aiosqlite

from auth import hash_password

DB_PATH = Path(os.getenv("AFISH_DB_PATH") or Path(__file__).parent / "fishes.db")

_SCHEMA = """
CREATE TABLE IF NOT EXISTS fishes (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    name       TEXT NOT NULL,
    strokes    TEXT NOT NULL,
    created_at TEXT NOT NULL,
    author_id  TEXT,
    deleted_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_fishes_id_desc ON fishes (id DESC);

CREATE TABLE IF NOT EXISTS admin_users (
    id             INTEGER PRIMARY KEY AUTOINCREMENT,
    username       TEXT NOT NULL UNIQUE,
    password_hash  TEXT NOT NULL,
    password_salt  TEXT NOT NULL,
    role           TEXT NOT NULL,
    created_at     TEXT NOT NULL,
    last_login_at  TEXT
);
"""


async def init_db() -> None:
    async with aiosqlite.connect(DB_PATH) as db:
        await db.executescript(_SCHEMA)
        columns = {
            row[1]
            for row in await (await db.execute("PRAGMA table_info(fishes)")).fetchall()
        }
        if "author_id" not in columns:
            await db.execute("ALTER TABLE fishes ADD COLUMN author_id TEXT")
        if "deleted_at" not in columns:
            await db.execute("ALTER TABLE fishes ADD COLUMN deleted_at TEXT")

        admin_username = "admin"
        admin_password = os.getenv("AFISH_ADMIN_PASSWORD", "123")
        password_hash, password_salt = hash_password(admin_password)
        await db.execute(
            """
            INSERT INTO admin_users
                (username, password_hash, password_salt, role, created_at)
            VALUES (?, ?, ?, 'superadmin', ?)
            ON CONFLICT(username) DO UPDATE SET
                password_hash = excluded.password_hash,
                password_salt = excluded.password_salt,
                role = 'superadmin'
            """,
            (admin_username, password_hash, password_salt, _now()),
        )
        await db.commit()


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _row_to_fish(row: aiosqlite.Row) -> Dict[str, Any]:
    return {
        "id": row["id"],
        "name": row["name"],
        "strokes": json.loads(row["strokes"]),
        "created_at": row["created_at"],
    }


async def insert_fish(
    name: str,
    strokes: List[Dict[str, Any]],
    author_id: str | None,
) -> Dict[str, Any]:
    created_at = _now()
    async with aiosqlite.connect(DB_PATH) as db:
        cur = await db.execute(
            "INSERT INTO fishes (name, strokes, created_at, author_id) VALUES (?, ?, ?, ?)",
            (name, json.dumps(strokes, separators=(",", ":")), created_at, author_id),
        )
        await db.commit()
        fish_id = cur.lastrowid
    return {"id": fish_id, "name": name, "strokes": strokes, "created_at": created_at}


async def list_fishes(limit: int = 100) -> List[Dict[str, Any]]:
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        cur = await db.execute(
            """
            SELECT id, name, strokes, created_at
            FROM fishes
            WHERE deleted_at IS NULL
            ORDER BY id DESC
            LIMIT ?
            """,
            (limit,),
        )
        rows = list(await cur.fetchall())
    # 返回按时间正序，方便前端按加入顺序铺开
    return [_row_to_fish(r) for r in reversed(rows)]


async def count_fishes() -> int:
    async with aiosqlite.connect(DB_PATH) as db:
        cur = await db.execute("SELECT COUNT(*) FROM fishes WHERE deleted_at IS NULL")
        row = await cur.fetchone()
        assert row is not None
    return int(row[0])


async def get_admin_user(username: str) -> Dict[str, Any] | None:
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        row = await (
            await db.execute(
                """
                SELECT username, password_hash, password_salt, role
                FROM admin_users
                WHERE username = ?
                """,
                (username,),
            )
        ).fetchone()
    return dict(row) if row is not None else None


async def record_admin_login(username: str) -> None:
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute(
            "UPDATE admin_users SET last_login_at = ? WHERE username = ?",
            (_now(), username),
        )
        await db.commit()


async def list_admin_fishes() -> List[Dict[str, Any]]:
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        rows = await (
            await db.execute(
                """
                SELECT id, name, strokes, created_at, author_id, deleted_at
                FROM fishes
                ORDER BY id DESC
                """
            )
        ).fetchall()
    return [
        {
            **_row_to_fish(row),
            "author_id": row["author_id"],
            "deleted_at": row["deleted_at"],
        }
        for row in rows
    ]


async def soft_delete_fish(fish_id: int) -> bool:
    async with aiosqlite.connect(DB_PATH) as db:
        cur = await db.execute(
            "UPDATE fishes SET deleted_at = ? WHERE id = ? AND deleted_at IS NULL",
            (_now(), fish_id),
        )
        await db.commit()
    return cur.rowcount > 0


async def hard_delete_fish(fish_id: int) -> bool:
    async with aiosqlite.connect(DB_PATH) as db:
        cur = await db.execute("DELETE FROM fishes WHERE id = ?", (fish_id,))
        await db.commit()
    return cur.rowcount > 0


async def restore_fish(fish_id: int) -> Dict[str, Any] | None:
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        cur = await db.execute(
            "UPDATE fishes SET deleted_at = NULL WHERE id = ? AND deleted_at IS NOT NULL",
            (fish_id,),
        )
        if cur.rowcount == 0:
            return None
        await db.commit()
        row = await (
            await db.execute(
                "SELECT id, name, strokes, created_at FROM fishes WHERE id = ?",
                (fish_id,),
            )
        ).fetchone()
    return _row_to_fish(row) if row is not None else None
