## ADDED Requirements

### Requirement: Docker Compose 编排
系统 SHALL 提供 `docker-compose.yml` 文件，一键编排启动前端、后端服务。

#### Scenario: 一键启动
- **WHEN** 用户在项目根目录执行 `docker-compose up -d`
- **THEN** 前端容器和后端容器同时启动，前端通过 `http://localhost:5173` 访问，后端 API 通过 `http://localhost:8000` 访问

#### Scenario: 停止服务
- **WHEN** 用户执行 `docker-compose down`
- **THEN** 所有容器停止并移除

### Requirement: 前端 Dockerfile
系统 SHALL 提供前端 Dockerfile，使用多阶段构建。

#### Scenario: 构建前端镜像
- **WHEN** 用户执行 `docker build -f frontend/Dockerfile -t sticker-frontend .`
- **THEN** 第一阶段用 `node:20-alpine` 执行 `npm run build`，第二阶段用 `nginx:alpine` 托管构建产物，暴露 80 端口

### Requirement: 后端 Dockerfile
系统 SHALL 提供后端 Dockerfile。

#### Scenario: 构建后端镜像
- **WHEN** 用户执行 `docker build -f backend/Dockerfile -t sticker-backend .`
- **THEN** 基于 `python:3.12-slim` 安装依赖，通过 uvicorn 启动 FastAPI 服务，暴露 8000 端口

### Requirement: 数据持久化
系统 SHALL 通过 Docker Volume 挂载确保数据持久化。

#### Scenario: 数据不丢失
- **WHEN** 容器重启或重建
- **THEN** SQLite 数据库和图片文件仍保留在宿主机的 `data/` 目录中

### Requirement: nginx 静态文件配置
前端容器 SHALL 提供 nginx 配置，将 `/api/` 请求反向代理到后端容器。

#### Scenario: API 代理
- **WHEN** 前端页面发起 `/api/materials` 请求
- **THEN** nginx 将请求转发到后端容器 `http://backend:8000/api/materials`