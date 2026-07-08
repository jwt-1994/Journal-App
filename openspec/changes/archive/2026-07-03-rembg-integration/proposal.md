## Why

手账素材的核心需求是将拍照的素材自动抠图，去掉背景，只保留素材主体。P0 阶段已实现完整的素材上传和浏览功能，但抠图尚未实现。P1 阶段引入 rembg（开源免费离线抠图引擎），为素材库增加自动抠图能力，提升素材整理效率。

## What Changes

- 后端新增 `rembg` 抠图服务，基于 U²-Net 模型
- Material 模型新增字段：`has_removed_bg`（是否已抠图）、`removed_bg_path`（抠图后文件路径）
- 上传后自动触发抠图（异步），抠图结果存入 `data/processed/`
- 新增抠图状态查询接口和手动重试接口
- 前端素材库增加抠图状态标识（已抠图/未抠图/处理中/失败）
- 前端素材详情增加原图/抠图对比切换
- Docker 后端镜像增加 rembg 模型预下载

## Capabilities

### New Capabilities
- `rembg-removal`: 基于 rembg 的自动抠图功能，包括异步抠图、状态追踪、重试机制

### Modified Capabilities
- `material-upload`: 上传流程增加"是否自动抠图"选项，上传后自动触发抠图任务
- `material-library`: 素材列表和详情页增加抠图状态展示和原图/抠图对比切换

## Impact

- 后端 `requirements.txt` 新增 `rembg` 依赖
- 后端新增 `services/removal.py` 抠图服务
- 后端 `models.py` Material 表新增 `has_removed_bg`、`removed_bg_path` 字段
- 后端 `api/materials.py` 上传接口增加抠图触发逻辑
- 后端新增 `api/removal.py` 抠图状态/重试接口
- 前端 `MaterialLibrary.tsx` 增加抠图状态标识和对比切换
- 前端 `UploadPage.tsx` 增加"自动抠图"开关
- `data/processed/` 目录存储抠图结果
- Docker 后端镜像体积增大（rembg 模型约 176MB）