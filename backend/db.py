"""SQLite 存取：建表、写入、读取最近的鱼。"""
from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List

import aiosqlite

DB_PATH = Path(__file__).parent / "fishes.db"

_SCHEMA = """
CREATE TABLE IF NOT EXISTS fishes (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    name       TEXT NOT NULL,
    strokes    TEXT NOT NULL,
    created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_fishes_id_desc ON fishes (id DESC);
"""


async def init_db() -> None:
    async with aiosqlite.connect(DB_PATH) as db:
        await db.executescript(_SCHEMA)
        await db.commit()


def _row_to_fish(row: aiosqlite.Row) -> Dict[str, Any]:
    return {
        "id": row["id"],
        "name": row["name"],
        "strokes": json.loads(row["strokes"]),
        "created_at": row["created_at"],
    }


async def insert_fish(name: str, strokes: List[Dict[str, Any]]) -> Dict[str, Any]:
    created_at = datetime.now(timezone.utc).isoformat()
    async with aiosqlite.connect(DB_PATH) as db:
        cur = await db.execute(
            "INSERT INTO fishes (name, strokes, created_at) VALUES (?, ?, ?)",
            (name, json.dumps(strokes, separators=(",", ":")), created_at),
        )
        await db.commit()
        fish_id = cur.lastrowid
    return {"id": fish_id, "name": name, "strokes": strokes, "created_at": created_at}


async def list_fishes(limit: int = 100) -> List[Dict[str, Any]]:
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        cur = await db.execute(
            "SELECT id, name, strokes, created_at FROM fishes ORDER BY id DESC LIMIT ?",
            (limit,),
        )
        rows = await cur.fetchall()
    # 返回按时间正序，方便前端按加入顺序铺开
    return [_row_to_fish(r) for r in reversed(rows)]


async def count_fishes() -> int:
    async with aiosqlite.connect(DB_PATH) as db:
        cur = await db.execute("SELECT COUNT(*) FROM fishes")
        (n,) = await cur.fetchone()
    return int(n)
