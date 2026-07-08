## Context

P0+P1 已实现完整的前后端架构（React + FastAPI + SQLite），P2 在现有基础上增加报表可视化、批量操作、搜索筛选和 Electron 桌面打包。

## Goals / Non-Goals

**Goals:**
- 报表看板使用图表（饼图、折线图、柱状图）替代纯文本
- 素材库支持按关键词搜索、按分类/状态筛选、按时间/大小排序
- 支持多选素材后批量抠图和批量删除
- Electron 打包成独立 Windows 桌面应用
- 批量操作带确认弹窗，防止误操作

**Non-Goals:**
- 不支持拖拽排序或自定义排序规则
- 不支持高级搜索（正则、模糊匹配）
- 不实现 Electron 自动更新
- 不实现用户登录/权限系统

## Decisions

### 1. 图表库：recharts
- **理由**: React 生态最流行的图表库，组件化使用简单，内置饼图/折线图/柱状图
- **安装**: `npm install recharts`
- **替代方案**: ECharts（太重，配置复杂）、Chart.js（非 React 原生）

### 2. 批量操作交互模式
- 素材库顶部增加"批量操作"开关，开启后每张卡片出现复选框
- 选中后底部出现浮动操作栏（批量抠图、批量删除、取消）
- 批量删除弹出二次确认对话框
- 批量抠图逐个异步执行，前端轮询进度

### 3. 搜索筛选实现
- 搜索：前端输入框，后端 `GET /api/materials/search?q=keyword` 做 SQL LIKE 查询
- 筛选：分类下拉（单选）、抠图状态下拉（多选）
- 排序：上传时间（最新/最旧）、文件大小（最大/最小）
- 搜索和筛选参数合并到同一接口，减少 API 数量

### 4. 搜索接口设计
- 扩展现有 `GET /api/materials` 接口，增加查询参数：`search`、`category_id`、`bg_status`、`sort_by`、`sort_order`
- 不新建独立搜索接口，保持 API 简洁

### 5. Electron 打包
- 使用 `electron-builder` 打包为 Windows exe/msi
- 前端 `npm run build` 生成静态文件，Electron 主进程加载
- 后端作为独立进程启动（Electron main process 中 spawn Python）
- 窗口大小 1200x800，最小 900x600

## Risks / Trade-offs

- **[批量抠图耗时]**: 逐张串行抠图，10 张素材约需 2-3 分钟 → 前端显示进度（已完成 X/总数），不阻塞其他操作
- **[Electron 体积]**: 打包后约 150-200MB（含 Chromium + Python 运行时）→ 桌面应用可接受
- **[搜索性能]**: SQLite LIKE 查询在万级数据量内性能良好 → 当前阶段无需引入全文索引
- **[多选状态管理]**: 跨页切换时清空选中状态，避免用户困惑

## Open Questions

- 暂无