"""请求/响应模型与笔触校验。"""
from __future__ import annotations

import re
from typing import List

from pydantic import BaseModel, Field, field_validator

# 绘制画布的逻辑尺寸，前后端必须一致
CANVAS_W = 480
CANVAS_H = 320

MAX_STROKES = 200
MAX_POINTS_TOTAL = 8000
MAX_POINTS_PER_STROKE = 2000
HEX_COLOR = re.compile(r"^#[0-9a-fA-F]{6}$")


class Stroke(BaseModel):
    color: str
    size: float = Field(gt=0, le=64)
    points: List[List[float]]

    @field_validator("color")
    @classmethod
    def _color_ok(cls, v: str) -> str:
        if not HEX_COLOR.match(v):
            raise ValueError("color 必须是 #RRGGBB 形式")
        return v.lower()

    @field_validator("points")
    @classmethod
    def _points_ok(cls, v: List[List[float]]) -> List[List[float]]:
        if not v:
            raise ValueError("笔触至少要有一个点")
        if len(v) > MAX_POINTS_PER_STROKE:
            raise ValueError("单笔点数过多")
        out = []
        for p in v:
            if len(p) != 2:
                raise ValueError("点必须是 [x, y]")
            x, y = float(p[0]), float(p[1])
            # 裁剪到画布范围，避免恶意超大坐标撑爆渲染
            out.append([min(max(x, 0.0), CANVAS_W), min(max(y, 0.0), CANVAS_H)])
        return out


class FishCreate(BaseModel):
    name: str = Field(min_length=1, max_length=16)
    strokes: List[Stroke]

    @field_validator("name")
    @classmethod
    def _name_ok(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("名字不能为空")
        return v

    @field_validator("strokes")
    @classmethod
    def _strokes_ok(cls, v: List[Stroke]) -> List[Stroke]:
        if not v:
            raise ValueError("请先画一条鱼")
        if len(v) > MAX_STROKES:
            raise ValueError("笔触过多")
        if sum(len(s.points) for s in v) > MAX_POINTS_TOTAL:
            raise ValueError("总点数过多")
        return v


class FishOut(BaseModel):
    id: int
    name: str
    strokes: List[Stroke]
    created_at: str
