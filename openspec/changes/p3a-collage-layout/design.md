## Context

P0-P2 已实现完整素材管理（上传、分类、抠图、搜索、报表、Electron 打包）。P3A 在现有基础上增加拼贴创作能力：背景模版库和画布拖拽布局。

## Goals / Non-Goals

**Goals:**
- 内置手账背景模版库（纯色 + 材质纹理），支持用户上传背景照片
- 画布拖拽布局：素材拖入画布后可自由移动、缩放、旋转、调整图层顺序
- 拼贴方案保存为 JSON，可重新加载编辑
- 画布内容导出为 PNG/JPG 图片
- 新增 `react-konva` 作为 Canvas 渲染库

**Non-Goals:**
- 不实现文本/贴纸/画笔等高级编辑功能
- 不实现多页拼贴方案
- 不实现拼贴分享/打印功能
- 不实现 AI 增强（相似搜索、智能标签，留给 P3B）

## Decisions

### 1. Canvas 渲染：react-konva
- **理由**: Canvas 原生支持图层、变换矩阵、高性能渲染，react-konva 提供声明式 React API
- **安装**: `npm install react-konva konva`
- **替代方案**: react-rnd（DOM 方案，大数据量性能差）、Fabric.js（体积大、React 集成需自行封装）

### 2. 背景模版库设计
- 内置模版分为两类：纯色（HEX 色值存储）和材质纹理（图片文件存储）
- 用户上传的背景照片自动缩放到标准尺寸（1920x1080），生成缩略图
- 数据库表 `backgrounds` 存储元数据，文件存储在 `data/backgrounds/`

### 3. 拼贴方案存储
- 方案数据以 JSON 格式存储：`[{material_id, x, y, width, height, rotation, zIndex}]`
- 支持命名、保存、更新、删除、列表查询
- 生成预览缩略图（通过 Canvas toDataURL 导出）

### 4. 画布交互设计
- 素材库侧边栏：显示可拖拽的素材缩略图列表
- 画布区域：react-konva Stage/Layer，支持缩放和平移
- 选中素材后显示变换控件（Transformer 节点）
- 图层面板：显示当前所有素材的图层顺序，支持拖拽调整

### 5. 导出方案
- Canvas toDataURL 导出为 PNG（默认）或 JPEG
- 导出尺寸为画布原始尺寸，支持自定义缩放比例

## Data Models

### backgrounds
| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER PK | |
| name | TEXT | 背景名称 |
| type | TEXT | 'preset' 或 'user' |
| color | TEXT | 纯色 HEX（纹理为 NULL） |
| texture_path | TEXT | 纹理文件路径（纯色为 NULL） |
| thumbnail_path | TEXT | 缩略图路径 |
| width | INTEGER | 默认 1920 |
| height | INTEGER | 默认 1080 |
| created_at | DATETIME | |

### collages
| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER PK | |
| name | TEXT | 方案名称 |
| background_id | INTEGER FK | 关联背景 |
| canvas_width | INTEGER | 画布宽度 |
| canvas_height | INTEGER | 画布高度 |
| layout_data | TEXT | JSON 布局数据 |
| preview_path | TEXT | 预览图路径 |
| created_at | DATETIME | |
| updated_at | DATETIME | |

## API Design

### 背景 API (`/api/backgrounds`)
- `GET /api/backgrounds` — 列表（支持 type 筛选）
- `POST /api/backgrounds` — 创建用户背景（上传图片）
- `DELETE /api/backgrounds/:id` — 删除（仅自定义）
- `GET /api/backgrounds/:id/file` — 获取背景图片文件
- `POST /api/backgrounds/presets/init` — 初始化内置模版

### 拼贴 API (`/api/collages`)
- `GET /api/collages` — 列表
- `POST /api/collages` — 创建方案
- `GET /api/collages/:id` — 获取方案详情
- `PUT /api/collages/:id` — 更新方案
- `DELETE /api/collages/:id` — 删除方案

## Risks / Trade-offs

- **[react-konva 体积]**: 约 200KB gzipped，在 Electron 桌面应用中可接受
- **[Canvas 性能]**: 单画布 50+ 素材时可能出现性能下降 → 后续可加虚拟化/视口裁剪
- **[背景图片存储]**: 用户上传背景可能较大 → 统一缩放至 1920x1080，限制 5MB
- **[拼贴方案兼容性]**: JSON 存储的素材 ID 依赖素材存在 → 删除素材时提示关联方案