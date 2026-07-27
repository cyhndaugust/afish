# I Am a Fish / 我是一只鱼

An interactive shared ocean where everyone can draw a fish, give it a name, and watch it swim with other people's creations.

一个可以共同创作的互动海洋：画一条鱼、留下名字，再看它和其他人的作品一起游动。

[English](#english) · [中文](#中文)

---

## English

### About

I Am a Fish turns simple freehand drawings into animated fish. Each drawing is stored by the backend, rendered on an HTML Canvas, and shared with every connected visitor in real time.

The interface supports English and Chinese. The selected language is saved locally and restored on the next visit.

### Features

- Draw a fish with multiple colors and three brush sizes
- Erase, undo, clear, and toggle the fish-shaped drawing guide
- Release drawings into a shared animated ocean
- Receive newly released fish in real time through WebSocket
- Tap a fish to see its creator's name
- Double-tap a fish to trigger a random line of dialogue and a quick dash
- Responsive mouse, touch, and high-DPI canvas support
- Automatic fish-count reduction when frame rate drops
- English and Chinese interface with locally persisted language preference

### Tech stack

| Area | Technology |
| --- | --- |
| Frontend | React 18, TypeScript, Vite |
| Rendering | Native Canvas 2D, `requestAnimationFrame` |
| Backend | FastAPI, Pydantic, Uvicorn |
| Storage | SQLite via aiosqlite |
| Real-time updates | WebSocket |

### Quick start

#### Requirements

- Node.js 18 or newer
- npm
- Python 3.11
- [uv](https://docs.astral.sh/uv/)

Clone the repository and start both services:

```bash
git clone https://github.com/cyhndaugust/fishing.git
cd fishing
./dev.sh
```

Open:

- Frontend: <http://localhost:5173>
- Backend health check: <http://localhost:8000/api/health>

For testing on a phone, connect it to the same local network and open the `Network` address printed by Vite.

### Run services separately

Backend:

```bash
cd backend
uv venv .venv --python 3.11
uv pip install -r requirements.txt -p .venv/bin/python
.venv/bin/python -m uvicorn main:app --reload --port 8000
```

Frontend:

```bash
cd frontend
npm install
npm run dev
```

Create a production frontend build:

```bash
cd frontend
npm run build
```

### How it works

1. The visitor enters a name and draws on a logical `480 × 320` canvas.
2. The frontend sends the name and strokes to the FastAPI backend.
3. The backend stores the fish in SQLite and broadcasts it over WebSocket.
4. Each client turns the original strokes into an animated `FishSprite`.
5. The ocean engine handles movement, turning, hit testing, labels, dialogue, and performance scaling.

### Project structure

```text
backend/
  main.py                 HTTP API, WebSocket endpoint, rate limiting
  db.py                   SQLite setup and queries
  models.py               Request and response models
  ws.py                   WebSocket connection manager

frontend/src/
  components/
    DrawCanvas.tsx        Pointer-based drawing canvas
    LanguageSwitch.tsx    English and Chinese language control
    Toolbar.tsx           Drawing tools
  ocean/
    background.ts         Water, light, bubbles, seabed, and seagrass
    FishSprite.ts         Fish deformation, movement, and hit testing
    engine.ts             Render loop, fish groups, labels, and dialogue
  views/
    CreateView.tsx        Fish creation screen
    OceanView.tsx         Shared ocean screen
  i18n.ts                 English and Chinese interface copy
```

### API overview

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/api/health` | Service, fish, and connection status |
| `GET` | `/api/fishes?limit=100` | Fetch recent fish |
| `POST` | `/api/fishes` | Store and broadcast a fish |
| WebSocket | `/ws` | Receive newly released fish |

### Public deployment notes

- Fish submission is intentionally unauthenticated. Do not treat submitted names or drawings as trusted content.
- The backend limits each IP address to five submissions per minute. This is an in-memory limit and resets when the process restarts.
- Request bodies are limited to 256 KiB.
- The current CORS allowlist only includes the local Vite development addresses. Add the production frontend origin before deploying the API separately.
- SQLite is suitable for a small shared installation. Use managed storage if the service will run across multiple instances.
- Local databases, virtual environments, build output, environment files, and editor files are excluded by `.gitignore`.

### Contributing and support

Bug reports and improvement proposals are welcome through [GitHub Issues](https://github.com/cyhndaugust/fishing/issues). Please describe the expected behavior, actual behavior, and reproduction steps.

### License

No open-source license has been selected yet. Until a license is added, the source is publicly viewable but no reuse rights are granted by default.

---

## 中文

### 项目介绍

“我是一只鱼”会把简单的手绘笔触变成一条会游动的小鱼。每幅作品由后端保存，通过 HTML Canvas 动画呈现，并实时同步给所有在线访客。

页面支持中文和英文，用户选择的语言会保存在本地，并在下次访问时自动恢复。

### 功能特点

- 使用多种颜色和三档笔触绘制小鱼
- 支持橡皮、撤销、清空和鱼形参考线
- 将作品放入共享的动态海洋
- 通过 WebSocket 实时接收其他人的新作品
- 单击小鱼查看创作者名字
- 双击小鱼触发随机对话和快速游走动作
- 支持鼠标、触屏和高分辨率屏幕
- 帧率下降时自动减少同屏鱼数
- 支持中英文切换，并在本地保存语言偏好

### 技术栈

| 模块 | 技术 |
| --- | --- |
| 前端 | React 18、TypeScript、Vite |
| 绘制 | 原生 Canvas 2D、`requestAnimationFrame` |
| 后端 | FastAPI、Pydantic、Uvicorn |
| 存储 | SQLite、aiosqlite |
| 实时通信 | WebSocket |

### 快速启动

#### 环境要求

- Node.js 18 或更高版本
- npm
- Python 3.11
- [uv](https://docs.astral.sh/uv/)

克隆仓库并同时启动前后端：

```bash
git clone https://github.com/cyhndaugust/fishing.git
cd fishing
./dev.sh
```

启动后访问：

- 前端：<http://localhost:5173>
- 后端健康检查：<http://localhost:8000/api/health>

手机测试时，请让手机与电脑连接同一局域网，然后访问 Vite 输出的 `Network` 地址。

### 分别启动服务

后端：

```bash
cd backend
uv venv .venv --python 3.11
uv pip install -r requirements.txt -p .venv/bin/python
.venv/bin/python -m uvicorn main:app --reload --port 8000
```

前端：

```bash
cd frontend
npm install
npm run dev
```

构建生产版本：

```bash
cd frontend
npm run build
```

### 工作流程

1. 访客输入名字，在固定逻辑尺寸 `480 × 320` 的画布上绘制小鱼。
2. 前端将名字和笔触提交给 FastAPI 后端。
3. 后端把小鱼保存到 SQLite，并通过 WebSocket 广播。
4. 每个客户端把原始笔触转换成动态的 `FishSprite`。
5. 海洋引擎负责移动、转身、点击检测、名字牌、随机对话和性能调节。

### 项目结构

```text
backend/
  main.py                 HTTP API、WebSocket 入口和限流
  db.py                   SQLite 初始化与查询
  models.py               请求与响应数据模型
  ws.py                   WebSocket 连接管理

frontend/src/
  components/
    DrawCanvas.tsx        基于 Pointer 事件的绘制画布
    LanguageSwitch.tsx    中英文切换控件
    Toolbar.tsx           绘画工具栏
  ocean/
    background.ts         海水、光线、气泡、海床和海草
    FishSprite.ts         小鱼变形、移动与点击检测
    engine.ts             渲染循环、鱼群、名字牌和对话
  views/
    CreateView.tsx        小鱼创建页面
    OceanView.tsx         共享海洋页面
  i18n.ts                 中英文界面文案
```

### 接口概览

| 方法 | 路径 | 用途 |
| --- | --- | --- |
| `GET` | `/api/health` | 查看服务、鱼群和连接状态 |
| `GET` | `/api/fishes?limit=100` | 获取最近的小鱼 |
| `POST` | `/api/fishes` | 保存并广播一条小鱼 |
| WebSocket | `/ws` | 接收新放生的小鱼 |

### 公开部署注意事项

- 小鱼提交接口按产品设计不要求登录。请勿把用户提交的名字或绘画当作可信内容。
- 后端默认限制每个 IP 每分钟提交五次。该限制保存在内存中，进程重启后会重置。
- 单次请求体大小限制为 256 KiB。
- 当前 CORS 白名单只包含本地 Vite 开发地址。如果前后端分别部署，需要加入正式前端域名。
- SQLite 适合小规模共享部署；如果服务运行在多个实例上，应改用托管存储。
- 本地数据库、虚拟环境、构建产物、环境变量文件和编辑器文件已经通过 `.gitignore` 排除。

### 参与贡献与问题反馈

欢迎通过 [GitHub Issues](https://github.com/cyhndaugust/fishing/issues) 报告问题或提出改进建议。请尽量说明预期行为、实际行为和复现步骤。

### 开源许可证

项目目前尚未选择开源许可证。在添加许可证之前，代码虽然可以公开查看，但默认不授予复制、修改或分发权限。
