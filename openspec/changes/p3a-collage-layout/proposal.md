## Why

P0-P2 已实现素材上传、分类、抠图、搜索筛选和报表看板，但素材始终停留在"管理"层面，缺乏"创作"能力。手账用户的核心需求是将素材自由组合排版，形成拼贴作品。P3A 引入拼贴画布和背景模版，让素材库从管理工具升级为创作工具。

## What Changes

- **手账背景页模版库**：新增内置背景模版（纯色 20+ 配色、材质纹理 10+），支持用户上传照片自动处理为背景，管理背景的增删改查
- **拼贴画布**：基于 Canvas 的拖拽布局画布，支持素材拖入、自由移动、缩放、旋转、图层排序，实时预览拼贴效果
- **拼贴方案保存**：将画布上的素材位置、变换、图层信息保存为 JSON 方案，支持方案的增删改查和重新加载编辑
- **拼贴作品导出**：将画布内容导出为 PNG/JPG 图片

## Capabilities

### New Capabilities
- `background-templates`: 手账背景页模版库，内置配色/纹理 + 用户上传，提供背景管理 API 和前端界面
- `collage-canvas`: 拼贴画布，拖拽布局、素材变换、图层管理、方案保存和图片导出

### Modified Capabilities
<!-- P3A 不修改现有 spec 级别行为 -->

## Impact

- 后端新增 `Background` 和 `Collage` 数据模型及对应 API 路由
- 前端新增 `BackgroundLibrary` 和 `CollageEditor` 页面
- 新增依赖 `react-konva`（Canvas 渲染库）
- 前端路由新增 `/backgrounds` 和 `/collage` 两个页面
- 数据库新增 `backgrounds` 和 `collages` 两张表
- 不涉及现有素材库/分类/报表功能变更