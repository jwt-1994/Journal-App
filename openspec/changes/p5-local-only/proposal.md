## Why

当前 App 采用客户端-服务端架构，iOS App 通过 HTTP 请求远端的 FastAPI 后端获取数据。这意味着：
- 用户必须有后端服务运行（本地电脑或云服务器）
- 所有用户的数据混在同一个后端数据库中
- 没有网络就无法使用 App

对于一个面向个人使用的素材管理 App，除了抠图需要算力外，其他数据完全不需要服务端。用户自己拍照、上传素材，数据就应该存自己手机里。

## What Changes

### 核心策略：本地存储 + 轻量抠图微服务

- **数据库**：Dexie.js（IndexedDB）替代 SQLite
- **文件存储**：Capacitor Filesystem，只存抠图结果（透明PNG），不存原图
- **抠图**：保留 FastAPI + rembg 微服务，部署在电脑/云服务器，仅暴露抠图API
- **图片处理**：Canvas API 前端缩略图

### 数据模型（本地 IndexedDB）

| 表 | 字段 | 说明 |
|---|---|---|
| categories | id, name, is_preset, created_at | 分类 |
| materials | id, filename, original_name, category_id, file_size, file_uri, created_at | 素材（只存抠图结果） |
| backgrounds | id, name, type, color, texture_uri, thumbnail_uri, width, height, created_at | 背景 |
| collages | id, name, background_id, canvas_width, canvas_height, layout_data, preview_uri, created_at, updated_at | 拼贴方案 |

### 素材上传流程

```
拍照/选图 → 原图暂存内存 → 发送到抠图服务 → 拿回透明PNG → 存手机本地 → 删除内存原图
```

- 原图只在内存中短暂存在，等待抠图完成
- 抠图完成后只保存透明PNG到 Capacitor Filesystem
- 抠图失败则提示用户，不保存任何文件

### 抠图微服务

保留 FastAPI + rembg，精简为单一抠图API：

```
POST /api/remove-bg
  file: 图片文件
  → 返回: 透明PNG (image/png)
```

- 部署地址可配置（当前用电脑IP，后续改云服务器IP）
- 抠图服务不可用时，素材也能正常浏览（已抠好的在本地）

### 移除的内容

- `backend/` 中 categories、materials、backgrounds、collages、dashboard 等 CRUD API
- `docker-compose.yml`
- `data/` 目录（originals、processed、stickers.db）
- `CLOUD_API_URL` 配置

### 保留的内容

- 抠图微服务（精简后的 FastAPI + rembg）
- 所有 UI 组件和页面逻辑
- 拼贴编辑器（Konva）
- GitHub Actions IPA 构建流程
- 内置预设背景（前端 Canvas 动态生成）

## Capabilities

### New Capabilities
- `local-db`: Dexie.js IndexedDB 数据层
- `local-filesystem`: Capacitor Filesystem 文件存储
- `local-thumbnail`: Canvas API 前端缩略图生成
- `remove-bg-service`: 精简抠图微服务（独立部署）

### Removed Capabilities
- `cloud-backend`: 完整后端不再需要，仅保留抠图API

## Impact

- **前端**：api.ts 完全重写，数据走本地，仅抠图走网络
- **后端**：精简为单一抠图微服务，其余代码删除
- **构建**：GitHub Actions 只构建前端 IPA
- **用户体验**：无网络也能浏览素材，仅上传新素材时需要抠图服务