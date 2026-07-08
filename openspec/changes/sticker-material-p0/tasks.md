## 1. 项目初始化

- [x] 1.1 创建 `frontend/` 目录，用 Vite 初始化 React + TypeScript 项目，安装 Ant Design 和 React Router
- [x] 1.2 创建 `backend/` 目录，初始化 Python 项目，安装 FastAPI、SQLAlchemy、Pillow、uvicorn 等依赖
- [x] 1.3 配置 Vite proxy 代理 `/api` 到 `localhost:8000`
- [x] 1.4 创建 `data/originals/` 目录结构

## 2. 后端 — 数据库模型与分类管理

- [x] 2.1 创建 SQLAlchemy 数据库模型：`Category`（id, name, is_preset, created_at）和 `Material`（id, filename, original_name, category_id, file_size, file_path, created_at）
- [x] 2.2 实现数据库初始化逻辑：首次启动自动创建 5 个预设分类（贴纸、胶带、印章、便签、背景纸）
- [x] 2.3 实现 CRUD API：`GET /api/categories`（列表）、`POST /api/categories`（新增）、`DELETE /api/categories/{id}`（删除，含校验：预设分类不可删、非空分类不可删）

## 3. 后端 — 素材上传与存储

- [x] 3.1 实现上传接口 `POST /api/materials/upload`：接收 multipart 图片，校验格式（JPG/PNG/WEBP）和大小（≤20MB），存储到 `data/originals/{category_name}/{uuid}.{ext}`，创建数据库记录
- [x] 3.2 实现批量上传逻辑：支持一次上传多张图片，返回每张的上传结果
- [x] 3.3 实现素材列表接口 `GET /api/materials`：支持分页（page, page_size）和按分类筛选（category_id 参数）

## 4. 后端 — 素材详情与删除

- [x] 4.1 实现素材详情接口 `GET /api/materials/{id}`：返回素材完整信息和图片文件流
- [x] 4.2 实现素材删除接口 `DELETE /api/materials/{id}`：删除文件系统中的图片文件和数据库记录，需事务处理
- [x] 4.3 实现图片缩略图接口 `GET /api/materials/{id}/thumbnail`：生成 200x200 缩略图用于列表展示

## 5. 后端 — 报表数据

- [x] 5.1 实现报表接口 `GET /api/dashboard/stats`：返回各分类素材数量统计、总素材数、总存储空间
- [x] 5.2 实现最近上传接口 `GET /api/dashboard/recent`：返回最近 10 条上传记录

## 6. 前端 — 页面布局与路由

- [x] 6.1 创建 App 布局框架：Ant Design Layout（侧边导航 + 内容区），侧边栏包含素材库、上传、分类管理、报表四个菜单项
- [x] 6.2 配置 React Router 路由：`/`（素材库）、`/upload`（上传）、`/categories`（分类管理）、`/dashboard`（报表）

## 7. 前端 — 上传页面

- [x] 7.1 实现上传区域组件：Ant Design Upload 组件，支持点击选择和拖拽上传，限制文件格式和大小
- [x] 7.2 上传完成后弹出分类选择器：Modal 中选择分类（下拉列表 + "暂不分类"选项），确认后调用后端接口
- [x] 7.3 显示上传进度和结果摘要

## 8. 前端 — 素材库页面

- [x] 8.1 实现网格视图：Ant Design Card 组件展示素材缩略图和名称，支持切换列表视图
- [x] 8.2 实现分类筛选：Select 下拉框选择分类，切换后重新加载列表
- [x] 8.3 实现分页加载：翻页加载素材列表
- [x] 8.4 实现素材详情模态框：点击素材弹出 Modal，展示大图、文件名、分类、大小、上传时间，支持删除操作

## 9. 前端 — 分类管理页面

- [x] 9.1 实现分类列表展示：Table 组件展示分类名称、素材数量、操作按钮
- [x] 9.2 实现新增分类：Modal 中输入分类名称，校验非空和重复
- [x] 9.3 实现删除分类：二次确认，校验非空和预设分类限制

## 10. 前端 — 报表看板页面

- [x] 10.1 实现分类统计图表：使用 Ant Design Charts 或 ECharts 展示饼图/柱状图
- [x] 10.2 实现存储空间统计卡片：展示总素材数和总存储空间
- [x] 10.3 实现最近上传列表：展示最近 10 条记录，点击跳转到素材库

## 11. Docker 容器化部署

- [x] 11.1 创建 `backend/Dockerfile`：基于 `python:3.12-slim`，安装依赖，uvicorn 启动
- [x] 11.2 创建 `frontend/Dockerfile`：多阶段构建，node 编译 + nginx 托管静态文件
- [x] 11.3 创建 `frontend/nginx.conf`：配置 `/api/` 反向代理到后端容器
- [x] 11.4 创建 `docker-compose.yml`：编排 frontend + backend 服务，挂载 `data/` 数据卷
- [x] 11.5 创建 `.dockerignore` 文件，排除 node_modules 等不必要文件