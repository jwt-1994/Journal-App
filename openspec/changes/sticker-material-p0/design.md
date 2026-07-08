## Context

项目从零开始构建手账素材整理工具，无现有代码库。P0 阶段聚焦核心功能：上传、分类、浏览、报表。抠图（rembg）将在 P1 阶段引入。整体采用前后端分离架构，前端 React + Vite，后端 Python FastAPI，本地 SQLite 存储元数据。

## Goals / Non-Goals

**Goals:**
- 实现素材图片上传与存储（原图）
- 实现分类管理（预设 5 种 + 用户自定义）
- 实现素材库网格/列表浏览，按分类筛选
- 实现报表看板（分类统计 + 存储空间）
- 前后端分离，RESTful API 通信
- 全 Docker 容器化部署，docker-compose 一键启动

**Non-Goals:**
- 本阶段不包含抠图功能（rembg 留到 P1）
- 不包含用户认证/多用户
- 不包含 Electron 打包（P3）
- 不包含手机端适配
- 不包含批量操作和搜索
- 不包含生产级 Nginx 反向代理（本机单用户场景直接暴露端口即可）

## Decisions

### 1. 前端：React + Vite + Ant Design
- **理由**: Vite 开发体验好，Ant Design 组件丰富适合后台管理类界面
- **替代方案**: Next.js（太重，不需要 SSR），Vue（用户偏好 React）

### 2. 后端：Python FastAPI + SQLite + SQLAlchemy
- **理由**: FastAPI 轻量快速，自带 Swagger 文档；SQLite 零配置适合本地桌面应用；SQLAlchemy ORM 便于后续迁移
- **替代方案**: Django（太重），Electron 主进程直接操作（后期打包时再考虑）

### 3. 图片存储：本地文件系统
- **理由**: 桌面应用无需对象存储，按分类分文件夹简单直观
- **目录结构**: `data/originals/{category_name}/{uuid}.{ext}`
- 文件命名使用 UUID 避免冲突

### 4. API 设计
- 前端开发阶段通过 Vite proxy 代理到后端 `localhost:8000`
- 上传接口使用 multipart/form-data
- 列表接口支持分页和分类筛选

### 5. 前端路由

### 6. Docker 容器化部署
- **理由**: 统一开发与运行环境，避免"在我机器上能跑"问题；docker-compose 一键编排前后端+数据卷
- **前端容器**: 基于 `node:20-alpine` 多阶段构建，第一阶段用 `npm run build` 产出静态文件，第二阶段用 `nginx:alpine` 提供静态服务
- **后端容器**: 基于 `python:3.12-slim`，安装 FastAPI 依赖后用 uvicorn 启动，暴露 8000 端口
- **数据卷**: `data/` 目录挂载到宿主机，确保 SQLite 数据库和图片文件持久化
- **端口映射**: 前端 `5173:80`（开发阶段 Vite dev server 走 5173，生产构建后 nginx 走 80），后端 `8000:8000`
- **替代方案**: 直接本机运行（开发阶段仍可用，但最终交付以 docker-compose 为准）

### 7. 前端路由
- `/` — 素材库主页（默认网格视图）
- `/upload` — 上传页面
- `/categories` — 分类管理
- `/dashboard` — 报表看板

## Risks / Trade-offs

- **[SQLite 并发限制]**: 单用户桌面应用无并发问题，风险低
- **[图片文件管理]**: 删除素材时需同步删除文件和数据库记录，需事务处理
- **[大量素材性能]**: 图片列表使用虚拟滚动或分页加载，避免一次性加载所有图片
- **[分类删除]**: 删除分类时，该分类下的素材需要处理（迁移到"未分类"或阻止删除）—— 选择阻止删除非空分类
- **[Docker 环境依赖]**: 用户需安装 Docker Desktop，增加了 2-3GB 磁盘占用 —— 可接受，Docker 桌面端开发已普及

## Open Questions

- 暂无