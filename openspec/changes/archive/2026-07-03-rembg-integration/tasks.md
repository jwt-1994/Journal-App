## 1. 后端 — 数据模型更新

- [x] 1.1 Material 模型新增字段：`has_removed_bg`（String，默认 "none"，枚举 none/processing/done/failed）和 `removed_bg_path`（String，可空）
- [x] 1.2 创建 `data/processed/` 目录

## 2. 后端 — rembg 安装与抠图服务

- [x] 2.1 更新 `requirements.txt`，添加 `rembg` 依赖
- [x] 2.2 创建 `backend/services/removal.py`，实现 `run_removal(material_id)` 函数，调用 rembg 抠图并更新状态
- [x] 2.3 实现抠图结果的数据库更新逻辑（状态、文件路径）
- [x] 2.4 实现异常处理：抠图失败时状态置为 failed，不抛出未捕获异常

## 3. 后端 — 抠图 API

- [x] 3.1 新增 `GET /api/materials/{id}/removal-status` 接口：返回抠图状态
- [x] 3.2 新增 `POST /api/materials/{id}/retry-removal` 接口：手动重试抠图
- [x] 3.3 新增 `GET /api/materials/{id}/removed-file` 接口：返回抠图后的文件
- [x] 3.4 修改上传接口：上传完成后异步触发抠图（通过 threading.Thread）

## 4. 前端 — 抠图状态展示

- [x] 4.1 素材库卡片增加抠图状态标签（Tag 组件：已抠图=绿色、处理中=蓝色旋转、未抠图=灰色、失败=红色）
- [x] 4.2 素材详情模态框增加"原图/抠图"切换按钮和对比视图
- [x] 4.3 上传页面增加"自动抠图" Switch 开关（默认开启）

## 5. 前端 — 抠图操作

- [x] 5.1 素材库中未抠图/失败的素材增加"抠图"操作按钮
- [x] 5.2 抠图状态轮询：素材详情页轮询抠图状态直到完成

## 6. Docker 更新

- [x] 6.1 更新 `backend/Dockerfile`：预下载 rembg 模型，避免首次运行等待