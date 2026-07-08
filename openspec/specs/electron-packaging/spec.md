# electron-packaging

## 概述
使用 Electron + electron-builder 将应用打包为独立 Windows 桌面应用。

## 需求

### 1. Electron 主进程
- 创建 `frontend/electron/main.js`
- 窗口大小 1200x800，最小 900x600
- 加载 Vite 构建产物（dist/index.html）
- 自动 spawn Python FastAPI 后端进程（uvicorn）
- 应用关闭时自动终止后端进程

### 2. 打包配置
- 使用 electron-builder
- 打包为 Windows NSIS 安装程序
- 包含前端 dist 目录、Electron 主进程、后端 Python 代码、data 目录
- 应用名：手账素材库
- 支持自定义安装目录

### 3. 构建命令
- `npm run electron:build`：构建前端 + 打包 Electron 应用
- vite.config.ts 设置 `base: './'` 以支持本地文件加载