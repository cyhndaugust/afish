# 深海鱼群共创网站 · 实施计划

## 目标
用户起名 → 在固定画布上画一条鱼 → 进入「大海」页面，自己的鱼与所有人的鱼一起游弋。
支持移动端，鱼身有生动的扭动/摆尾动画，新鱼通过 WebSocket 实时游入。

## 已确认的技术决策
| 项 | 决策 |
|---|---|
| 鱼数据形式 | 矢量笔触：`strokes[{color,size,points[[x,y]...]}]` |
| 实时性 | WebSocket 广播「新鱼」事件；位置各端本地计算，不同步坐标 |
| 存储 | SQLite（aiosqlite + 原生 SQL，无 ORM） |
| 视觉风格 | 深海静谧：#0b2b3f→#041a26 渐变、漂移光束、上浮气泡、底部水草剪影 |
| 画图工具 | 基础套件：画笔(色板+3档粗细)、橡皮、撤销、清空、鱼形参考底图 |

## 关键设计

### 画布坐标系
绘制画布逻辑尺寸固定 **480×320**（CSS 用 `width:100%` 等比缩放适配手机，
内部 `ctx.scale(dpr)` 保清晰）。笔触点全部存 480×320 逻辑坐标。
大海中渲染时统一缩放系数 `scale ≈ 0.35`（按屏幕宽度微调），
所有鱼因此自动等比缩小、大小一致。

### 生动游动（核心算法）
不做整图旋转，而是**逐点重映射**，让鱼身真正扭动：

1. 每条鱼有状态 `{x, y, heading, speed, phase, wanderSeed}`。
2. 每帧对该鱼的每个笔触点 `(px, py)` 做变换：
   - `t = px / 480`（沿体轴的归一化位置，0=头 1=尾）
   - 侧向偏移 `bend = A · t² · sin(2π·(t·waves) − phase)` → 尾部摆幅大、头部几乎不动
   - 加 `yaw` 微幅偏航 + 呼吸式 `sin` 纵向浮沉
   - 再旋转到 `heading`、平移到 `(x,y)`、按 `scale` 缩放
3. 用 `quadraticCurveTo` 平滑连接变换后的点，`lineCap/lineJoin = round`。
4. 路径：Perlin-ish 噪声驱动 `heading` 缓慢转向 + 碰壁软转向（不硬反弹），
   偶发「冲刺」（speed 短暂上升，摆尾频率同步加快）。
5. 每条鱼预渲染到离屏 canvas 不可行（要变形），改为**限制活跃鱼数**：
   屏幕内最多渲染 N 条（默认 40，移动端 20），其余排队轮换游入/游出。

### 点击鱼显示作者名
- 每帧为每条鱼维护一个**包围盒**（变换后所有点的 min/max + 一点内边距），
  点击/触摸时从最上层往下做命中测试，取第一条命中的鱼。
- 命中后在鱼身上方绘制一个跟随游动的名字气泡（半透圆角底 + 圆润白字，
  带小尾巴指向鱼头），淡入 → 停留约 2.5s → 淡出；
  再次点击别的鱼会切换目标，点空白处立即淡出。
- 名字牌画在鱼层之上、不参与变形，尺寸固定，因此在移动端也清晰可读。
- 移动端命中盒外扩约 8px，避免小鱼点不中。

### 性能
- 单个 `requestAnimationFrame` 主循环，背景层（渐变/光束/水草）用离屏 canvas 缓存，
  仅气泡与鱼每帧重绘。
- 移动端 `dpr` 上限 2；帧率低于 40 时自动降低活跃鱼数。

## 目录结构
```
fishing/
├─ backend/
│  ├─ main.py            # FastAPI app、CORS、静态文件挂载
│  ├─ db.py              # aiosqlite 初始化 + 建表 + 查询
│  ├─ models.py          # Pydantic: FishCreate / FishOut（含笔触校验）
│  ├─ ws.py              # ConnectionManager 广播
│  ├─ requirements.txt
│  └─ fishes.db          # 运行时生成
└─ frontend/
   ├─ index.html
   ├─ vite.config.ts     # /api 与 /ws 代理到 :8000
   ├─ package.json
   └─ src/
      ├─ main.tsx, App.tsx          # 两个视图切换（无路由库）
      ├─ types.ts                   # Stroke / Fish 类型
      ├─ api.ts                     # fetch + WebSocket 封装
      ├─ theme.ts                   # 配色/尺寸常量
      ├─ views/CreateView.tsx       # 起名 + 画鱼
      ├─ views/OceanView.tsx        # 大海
      ├─ components/DrawCanvas.tsx  # 绘制画布（指针事件，支持触屏）
      ├─ components/Toolbar.tsx     # 色板/粗细/橡皮/撤销/清空
      ├─ ocean/FishSprite.ts        # 鱼状态 + 变形渲染
      ├─ ocean/background.ts        # 渐变/光束/气泡/水草
      └─ ocean/engine.ts            # rAF 循环 + 鱼群管理 + 自适应降级
```

## API
| 方法 | 路径 | 说明 |
|---|---|---|
| GET | `/api/fishes?limit=100` | 最近 N 条鱼（进入大海时拉取） |
| POST | `/api/fishes` | 提交 `{name, strokes}`，返回含 id 的鱼；同时 WS 广播 |
| WS | `/ws` | 收 `{type:"fish_added", fish:{...}}` |
| GET | `/api/health` | 健康检查 |

表结构：`fishes(id INTEGER PK, name TEXT, strokes TEXT/JSON, created_at TEXT)`

校验（防滥用）：name ≤ 16 字符非空；strokes ≤ 200 笔、总点数 ≤ 8000、
坐标裁剪到画布范围、color 必须匹配 `^#[0-9a-fA-F]{6}$`、payload ≤ 256KB。

> 注意：接口本身**无鉴权**，任何人可提交鱼。这是公开共创墙的预期行为，
> 但生产部署前建议加简单限流（如按 IP 每分钟 5 条），我会预留一个可开关的
> 内存限流中间件。

## 实施步骤与验证
1. **后端骨架** → `uvicorn` 启动，`curl /api/health` 返回 200。
2. **DB + POST/GET** → `curl` 提交一条假鱼后能查回，重启服务仍在。
3. **WebSocket 广播** → 两个 `websocat`/浏览器连接，POST 后双方都收到事件。
4. **前端脚手架 + 起名/画鱼界面** → 鼠标与手机触屏都能画，撤销/清空生效，
   提交后 network 面板见 201。
5. **大海背景层** → 渐变/光束/气泡/水草渲染正常，窗口 resize 不变形。
6. **鱼变形渲染** → 单条鱼摆尾自然、转向平滑、不出。
7. **接入真实数据 + WS** → 刷新页面能看到历史鱼；另一浏览器提交新鱼，
   本页面立刻有鱼游入。
8. **移动端与性能** → Chrome DevTools iPhone 模拟 + 真机，
   60 条鱼下帧率 ≥ 40，触摸绘制无滚动干扰（`touch-action:none`）。
9. **收尾** → 一条 `dev.sh` 同时起前后端；README 写启动方式。

## 需要你知道的取舍
- 不引入状态管理库、路由库、canvas 框架（konva/pixi）——纯原生 2D context 足够，
  依赖少、包体小。
- 鱼的位置不做服务端同步：每个人看到的鱼群构成相同、游动轨迹不同。
  这样省掉了实时状态服务，视觉上无差别。
- 若之后想要「鱼点击查看作者名」「鱼群排行」等，都是在此基础上加，不影响现有结构。
