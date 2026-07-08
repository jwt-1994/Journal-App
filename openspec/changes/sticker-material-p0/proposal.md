## Why

手账爱好者需要整理大量素材（贴纸、胶带、印章、便签、背景纸等），目前缺乏一个专门的工具来拍照上传、分类管理和浏览素材。市面上现有的素材管理工具要么收费昂贵，要么功能过于复杂。本项目旨在构建一个轻量、免费的手账素材整理工具，先以桌面端起步，后续可扩展至手机端。

## What Changes

- 新增手账素材管理桌面应用，包含前端（React + Vite）和后端（Python FastAPI）
- 图片上传功能：支持拖拽/选择图片，上传后存储原图
- 分类管理：预设贴纸、胶带、印章、便签、背景纸 5 种分类，用户可自定义添加
- 素材库浏览：网格/列表视图展示，按分类筛选，点击查看大图
- 报表看板：各分类素材数量统计、存储空间占用
- 本地 SQLite 存储元数据，本地文件系统存储图片
- 全 Docker 容器化部署：前端、后端、数据卷均通过 Docker Compose 编排
- 本阶段 P0 不含抠图功能，先以完整照片入库

## Capabilities

### New Capabilities
- `material-upload`: 素材上传功能，支持图片选择/拖拽上传，存储原图
- `category-management`: 分类管理，预设 5 种分类，支持用户自定义增删
- `material-library`: 素材库浏览，网格/列表展示，按分类筛选，查看大图
- `dashboard-report`: 报表看板，展示各分类素材数量和存储空间统计
- `docker-deployment`: Docker 容器化部署，Docker Compose 编排前端+后端，数据卷挂载

### Modified Capabilities
<!-- 首次创建，无现有规范需要修改 -->

## Impact

- 新增 `frontend/` 目录：React + Vite + Ant Design 前端
- 新增 `backend/` 目录：Python FastAPI 后端 + SQLite 数据库
- 新增 `data/` 目录：素材文件存储（originals/）
- 使用 SQLite 本地数据库，无需额外数据库服务
- 新增 `docker-compose.yml`、`Dockerfile`（前端）、`Dockerfile`（后端）
- 依赖：Python 3.10+, Node.js 20+, React 18, FastAPI, SQLAlchemy, Ant Design 5, Docker & Docker Compose