<h1 align="center">我是一只鱼</h1>

<p align="center">
  画一条鱼、留下名字，再让它游进一片共同生活的海洋。
</p>

<p align="center">
  <a href="../../README.md"><img alt="English" src="https://img.shields.io/badge/EN-English-blue?style=flat-square"></a>
  <a href="README.md"><img alt="简体中文" src="https://img.shields.io/badge/ZH-简体中文-red?style=flat-square"></a>
</p>

<p align="center">
  <img alt="版本" src="https://img.shields.io/badge/version-0.1.0-334155?style=flat-square">
  <img alt="状态" src="https://img.shields.io/badge/status-preview-d97706?style=flat-square">
  <img alt="React" src="https://img.shields.io/badge/React-18.3-61DAFB?style=flat-square&logo=react&logoColor=0b1f2a">
  <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-5.6-3178C6?style=flat-square&logo=typescript&logoColor=white">
  <img alt="FastAPI" src="https://img.shields.io/badge/FastAPI-0.115-009688?style=flat-square&logo=fastapi&logoColor=white">
  <img alt="Python" src="https://img.shields.io/badge/Python-3.11-3776AB?style=flat-square&logo=python&logoColor=white">
</p>

## 项目介绍

“我是一只鱼”会把简单的手绘笔触变成一条会游动的小鱼。每幅作品由后端保存，通过 HTML Canvas 动画呈现，并实时同步给所有在线访客。

页面支持中文和英文，用户选择的语言会保存在本地，并在下次访问时自动恢复。

## 功能特点

- 使用多种颜色和三档笔触绘制小鱼
- 支持橡皮、撤销、清空和鱼形参考线
- 将作品放入共享的动态海洋
- 通过 WebSocket 实时接收其他人的新作品
- 单击小鱼查看创作者名字
- 双击小鱼触发随机对话和快速游走动作
- 支持鼠标、触屏和高分辨率屏幕
- 帧率下降时自动减少同屏鱼数
- 支持中英文切换，并在本地保存语言偏好

## 技术栈

| 模块     | 技术                                    |
| -------- | --------------------------------------- |
| 前端     | React 18、TypeScript、Vite              |
| 绘制     | 原生 Canvas 2D、`requestAnimationFrame` |
| 后端     | FastAPI、Pydantic、Uvicorn              |
| 存储     | SQLite、aiosqlite                       |
| 实时通信 | WebSocket                               |

## 版本说明

当前项目版本为 **v0.1.0**，属于早期预览版本，重点是完成从绘制小鱼到共享海洋互动的完整体验。

版本号定义在 `frontend/package.json` 中。详细功能范围和后续版本记录请查看 [CHANGELOG.md](../../CHANGELOG.md)。

## 快速启动

### 环境要求

- Node.js 18 或更高版本
- npm
- Python 3.11
- [uv](https://docs.astral.sh/uv/)

克隆仓库并同时启动前后端：

```bash
git clone https://github.com/cyhndaugust/afish.git
cd afish
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

## 工作流程

1. 访客输入名字，在固定逻辑尺寸 `480 × 320` 的画布上绘制小鱼。
2. 前端将名字和笔触提交给 FastAPI 后端。
3. 后端把小鱼保存到 SQLite，并通过 WebSocket 广播。
4. 每个客户端把原始笔触转换成动态的 `FishSprite`。
5. 海洋引擎负责移动、转身、点击检测、名字牌、随机对话和性能调节。

## 项目结构

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

## 接口概览

| 方法      | 路径                    | 用途                     |
| --------- | ----------------------- | ------------------------ |
| `GET`     | `/api/health`           | 查看服务、鱼群和连接状态 |
| `GET`     | `/api/fishes?limit=100` | 获取最近的小鱼           |
| `POST`    | `/api/fishes`           | 保存并广播一条小鱼       |
| WebSocket | `/ws`                   | 接收新放生的小鱼         |

## 公开部署注意事项

- 小鱼提交接口按产品设计不要求登录。请勿把用户提交的名字或绘画当作可信内容。
- 后端默认限制每个 IP 每分钟提交五次。该限制保存在内存中，进程重启后会重置。
- 单次请求体大小限制为 256 KiB。
- 当前 CORS 白名单只包含本地 Vite 开发地址。如果前后端分别部署，需要加入正式前端域名。
- SQLite 适合小规模共享部署；如果服务运行在多个实例上，应改用托管存储。
- 本地数据库、虚拟环境、构建产物、环境变量文件和编辑器文件已经通过 `.gitignore` 排除。

## 参与贡献与问题反馈

欢迎通过 [GitHub Issues](https://github.com/cyhndaugust/afish/issues) 报告问题或提出改进建议。请尽量说明预期行为、实际行为和复现步骤。

## 开源许可证

项目目前尚未选择开源许可证。在添加许可证之前，代码虽然可以公开查看，但默认不授予复制、修改或分发权限。
