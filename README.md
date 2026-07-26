# 深海 · 放一条你的鱼

起名 → 画一条鱼 → 进入大海，和所有人的鱼一起游弋。

## 启动

```bash
./dev.sh
```

前端 http://localhost:5173 ，后端 http://localhost:8000 。
手机真机测试：同一局域网下访问终端里 Vite 打印的 `Network` 地址。

## 交互

- 画布固定逻辑尺寸 480×320，鱼头朝左（有虚线参考底图，不计入笔触）
- 工具：色板、3 档粗细、橡皮（整笔擦除）、撤销、清空、参考线开关
- 大海里**点一下任意一条鱼**，会弹出画它的人的名字，气泡跟着鱼游动，2.5 秒后淡出
- 别人放生新鱼时，通过 WebSocket 实时从画面边缘游入

## 结构

```
backend/   FastAPI + aiosqlite（main / db / models / ws）
frontend/  React + TS + 原生 Canvas 2D
  components/DrawCanvas.tsx   绘制画布（Pointer 事件，触屏可用）
  ocean/FishSprite.ts         鱼身逐点变形 + 包围盒命中测试
  ocean/background.ts         渐变 / 光束 / 气泡 / 水草
  ocean/engine.ts             rAF 主循环、鱼群管理、名字气泡、性能降级
```

## 注意

提交接口无鉴权（公开共创墙预期行为），已内置按 IP 限流：每分钟 5 条，
开关在 `backend/main.py` 的 `RATE_LIMIT_ENABLED`。
