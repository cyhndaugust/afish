"""FastAPI 入口：鱼的提交/查询 + WebSocket 广播。

注意：接口无鉴权，任何人可提交鱼（公开共创墙的预期行为）。
生产部署建议开启下方按 IP 的简易限流。
"""
from __future__ import annotations

import time
from collections import deque
from contextlib import asynccontextmanager
from typing import Deque, Dict, List, Literal

from fastapi import Depends, FastAPI, Header, HTTPException, Query, Request, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

from auth import create_session, validate_session, verify_password
from db import (
    count_fishes,
    get_admin_user,
    hard_delete_fish,
    init_db,
    insert_fish,
    list_admin_fishes,
    list_fishes,
    record_admin_login,
    restore_fish,
    soft_delete_fish,
)
from models import AdminFishOut, AdminLogin, AdminSessionOut, FishCreate, FishOut
from ws import manager

# --- 简易内存限流：每 IP 每窗口最多 N 条 ---
RATE_LIMIT_ENABLED = True
RATE_LIMIT_MAX = 5
RATE_LIMIT_WINDOW = 60.0
_hits: Dict[str, Deque[float]] = {}
_login_hits: Dict[str, Deque[float]] = {}

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


def _check_login_rate_limit(ip: str) -> None:
    now = time.monotonic()
    q = _login_hits.setdefault(ip, deque())
    while q and now - q[0] > RATE_LIMIT_WINDOW:
        q.popleft()
    if len(q) >= RATE_LIMIT_MAX:
        raise HTTPException(status_code=429, detail="登录尝试过多，请稍后再试")
    q.append(now)


async def require_admin(
    authorization: str | None = Header(default=None),
) -> Dict[str, str]:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="需要管理员登录")
    username = validate_session(authorization.removeprefix("Bearer ").strip())
    if not username:
        raise HTTPException(status_code=401, detail="管理员登录已过期")
    user = await get_admin_user(username)
    if not user:
        raise HTTPException(status_code=401, detail="管理员账户不存在")
    return {"username": user["username"], "role": user["role"]}


@asynccontextmanager
async def lifespan(_app: FastAPI):
    await init_db()
    yield


app = FastAPI(title="afish API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=False,
    allow_methods=["GET", "POST", "DELETE"],
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
    fish = await insert_fish(payload.name, strokes, payload.author_id)
    await manager.broadcast({"type": "fish_added", "fish": fish})
    return fish


@app.post("/api/admin/login", response_model=AdminSessionOut)
async def admin_login(payload: AdminLogin, request: Request):
    _check_login_rate_limit(request.client.host if request.client else "unknown")
    user = await get_admin_user(payload.username)
    if not user or not verify_password(
        payload.password,
        user["password_hash"],
        user["password_salt"],
    ):
        raise HTTPException(status_code=401, detail="账号或密码错误")
    await record_admin_login(user["username"])
    return {
        "token": create_session(user["username"]),
        "username": user["username"],
        "role": user["role"],
    }


@app.get("/api/admin/fishes", response_model=List[AdminFishOut])
async def get_admin_fishes(_admin: Dict[str, str] = Depends(require_admin)):
    return await list_admin_fishes()


@app.delete("/api/admin/fishes/{fish_id}")
async def delete_admin_fish(
    fish_id: int,
    mode: Literal["soft", "hard"] = Query("soft"),
    _admin: Dict[str, str] = Depends(require_admin),
):
    deleted = (
        await hard_delete_fish(fish_id)
        if mode == "hard"
        else await soft_delete_fish(fish_id)
    )
    if not deleted:
        raise HTTPException(status_code=404, detail="鱼不存在或状态未改变")
    await manager.broadcast({"type": "fish_deleted", "fish_id": fish_id})
    return {"ok": True, "mode": mode}


@app.post("/api/admin/fishes/{fish_id}/restore", response_model=FishOut)
async def restore_admin_fish(
    fish_id: int,
    _admin: Dict[str, str] = Depends(require_admin),
):
    fish = await restore_fish(fish_id)
    if fish is None:
        raise HTTPException(status_code=404, detail="鱼不存在或尚未删除")
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
