## Why

P0+P1 已实现素材上传、分类、浏览、抠图核心功能，但素材库缺乏直观的数据可视化、高效的批量操作和搜索筛选能力。P2 阶段补齐这些模块，让素材库从"能用"升级为"好用"。

## What Changes

- **报表看板**：增加图表可视化（分类占比饼图、上传趋势折线图、存储空间柱状图），替换 P0 的纯文本统计
- **批量操作**：支持多选素材，一键批量抠图、批量删除
- **搜索筛选**：按文件名搜索、按分类/抠图状态筛选、按上传时间/文件大小排序
- **桌面打包**：Electron 打包成独立 Windows 桌面应用

## Capabilities

### New Capabilities
- `dashboard-charts`: 图表可视化的报表看板，包含饼图、折线图、柱状图
- `batch-operations`: 多选素材后的批量抠图和批量删除

### Modified Capabilities
- `material-library`: 增加搜索、筛选、排序功能，增加多选模式
- `dashboard-report`: 从纯文本统计升级为图表可视化

## Impact

- 前端新增 `recharts` 图表库依赖
- 前端新增 `electron`、`electron-builder` 桌面打包依赖
- 后端新增 `GET /api/materials/search` 搜索接口（支持关键词、分类、状态、排序参数）
- 后端新增 `POST /api/materials/batch-remove-bg` 批量抠图接口
- 后端新增 `POST /api/materials/batch-delete` 批量删除接口
- 前端 `Dashboard.tsx` 重构为图表展示
- 前端 `MaterialLibrary.tsx` 增加搜索栏、筛选器、排序器、多选模式
- 新增 `frontend/electron/main.js` Electron 主进程
- 素材库界面不涉及后端数据库变更