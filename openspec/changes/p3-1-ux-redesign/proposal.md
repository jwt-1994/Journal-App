## Why

P3A 拼贴排版功能已实现，但整体 UI 结构不合理：菜单项过多分散用户注意力，素材库与背景库割裂导致操作不连贯，素材库展示原图而非抠图后结果不符合用户实际使用场景，拼贴画布缺乏常见手账本尺寸预设。本次重构整合导航结构、优化素材库体验、统一拼贴画布尺寸，为 P3B AI 增强和性能优化打好基础。

## What Changes

- **导航重构**：移除"分类管理"独立菜单，集成到设置页；移除"报表看板"菜单；新增"手账本"菜单作为拼贴方案入口
- **素材库升级**：按分类标签页预览素材，仅展示抠图后图案，小图缩略图 + 点击大图预览；保留搜索和排序筛选；上传时可手动输入素材名称
- **背景库合并**：背景库作为素材库的一个分类标签页（"背景"），不再独立菜单
- **拼贴画布预设**：新建画布时选择预设尺寸类型（M5、A6、A5、TN标准、TN护照、B6、方形），不再手动输入宽高
- **手账本**：拼贴方案的保存/加载/管理入口，替代原"拼贴"菜单项

## Capabilities

### New Capabilities
- `journal-notebook`: 手账本 - 拼贴方案的集中管理入口，列表展示、加载、删除、重命名保存方案
- `material-library-v2`: 素材库 v2 - 分类标签页预览、仅抠图展示、缩略图+大图预览、可手动输入名称
- `collage-canvas-presets`: 拼贴画布预设尺寸 - 新建画布时选择常见手账尺寸类型

### Modified Capabilities
- `material-library-search`: 保留搜索和排序，但外部调整为分类标签页预览模式
- `dashboard-report-charts`: 报表看板菜单移除，后端接口保留可用于未来数据导出

## Impact

- 前端：`App.tsx` 导航菜单重构，`MaterialLibrary.tsx` 全面重写，`CollageEditor.tsx` 画布创建改为预设选择，`UploadPage.tsx` 增加名称输入，`AppLayout.tsx` 移除多余菜单项
- 后端：`POST /api/materials` 支持 `name` 参数；`GET /api/materials` 增加 `has_removed_bg` 默认筛选
- 移除：`BackgroundLibrary.tsx` 不再独立存在，`CategoryManagement.tsx` 不再独立存在，`Dashboard.tsx` 不再独立菜单入口