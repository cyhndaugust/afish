"""FastAPI 入口：鱼的提交/查询 + WebSocket 广播。

注意：接口无鉴权，任何人可提交鱼（公开共创墙的预期行为）。
生产部署建议开启下方按 IP 的简易限流。
"""
from __future__ import annotations

import time
from collections import deque
from contextlib import asynccontextmanager
from typing import Deque, Dict, List

from fastapi import FastAPI, HTTPException, Query, Request, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

from db import count_fishes, init_db, insert_fish, list_fishes
from models import FishCreate, FishOut
from ws import manager

# --- 简易内存限流：每 IP 每窗口最多 N 条 ---
RATE_LIMIT_ENABLED = True
RATE_LIMIT_MAX = 5
RATE_LIMIT_WINDOW = 60.0
_hits: Dict[str, Deque[float]] = {}

MAX_BODY_BYTES = 256 * 1024


def _check_rate_limit(ip: str) -> None:
    if not RATE_LIMIT_ENABLED:
        return
    now = time.monotonic()
    q = _hits.setdefault(ip, deque())
    while q and now - q[0] > RATE_LIMIT_WINDOW:
        q.popleft()
    if len(q) >= RATE_LIMIT_MAX:
        raise HTTPException(status_code=429, detail="画得太快啦，歇一会儿再放生下一条鱼")
    q.append(now)


@asynccontextmanager
async def lifespan(_app: FastAPI):
    await init_db()
    yield


app = FastAPI(title="afish API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)


@app.get("/api/health")
async def health() -> Dict[str, object]:
    return {"ok": True, "fishes": await count_fishes(), "clients": manager.count}


@app.get("/api/fishes", response_model=List[FishOut])
async def get_fishes(limit: int = Query(100, ge=1, le=300)):
    return await list_fishes(limit)


@app.post("/api/fishes", response_model=FishOut, status_code=201)
async def create_fish(payload: FishCreate, request: Request):
    cl = request.headers.get("content-length")
    if cl and int(cl) > MAX_BODY_BYTES:
        raise HTTPException(status_code=413, detail="这条鱼的数据太大了")
    _check_rate_limit(request.client.host if request.client else "unknown")

    strokes = [s.model_dump() for s in payload.strokes]
    fish = await insert_fish(payload.name, strokes)
    await manager.broadcast({"type": "fish_added", "fish": fish})
    return fish


@app.websocket("/ws")
async def ws_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            # 客户端只接收，这里仅用于保持连接与检测断开
            await websocket.receive_text()
    except WebSocketDisconnect:
        pass
    except Exception:
        pass
    finally:
        await manager.disconnect(websocket)
