# P2 Tasks: 报表看板 + 批量操作 + 搜索筛选 + 桌面打包

## 1. 后端：扩展搜索/筛选/排序
- [x] `GET /api/materials` 新增 `search`、`bg_status`、`sort_by`、`sort_order` 参数
- [x] 验证：搜索 `original_name` 模糊匹配，抠图状态筛选，按时间/大小排序

## 2. 后端：批量操作接口
- [x] `POST /api/materials/batch-remove-bg` 批量抠图
- [x] `POST /api/materials/batch-delete` 批量删除（含文件清理）
- [x] 验证：批量抠图跳过已抠图/处理中，批量删除清理文件

## 3. 后端：报表趋势接口
- [x] `GET /api/dashboard/stats` 新增 `bg_status_stats` 字段
- [x] `GET /api/dashboard/upload-trend` 近 N 天每日上传数量
- [x] 验证：趋势数据按日期分组

## 4. 前端：安装 recharts
- [x] `npm install recharts`
- [x] 验证：package.json 包含 recharts 依赖

## 5. 前端：重构 Dashboard 为图表
- [x] 分类占比饼图 (PieChart)
- [x] 抠图状态柱状图 (BarChart)
- [x] 上传趋势折线图 (LineChart)
- [x] 保留概览统计卡片和最近上传表格
- [x] 验证：TypeScript 编译通过

## 6. 前端：升级 MaterialLibrary 搜索/筛选/排序/批量
- [x] 搜索输入框
- [x] 抠图状态下拉筛选
- [x] 排序下拉选择器
- [x] 批量操作模式切换（复选框 + 全选）
- [x] 底部浮动操作栏（批量抠图、批量删除）
- [x] 确认弹窗防误操作
- [x] 验证：TypeScript 编译通过

## 7. 前端：API 层更新
- [x] `getMaterials` 支持新参数
- [x] 新增 `batchRemoveBg`、`batchDelete`
- [x] 新增 `getUploadTrend`
- [x] 验证：TypeScript 编译通过

## 8. Electron 桌面打包
- [x] 创建 `frontend/electron/main.js`
- [x] 更新 `package.json`（electron、electron-builder 依赖 + 打包脚本）
- [x] 更新 `vite.config.ts`（base: './'）
- [x] 验证：`npm run electron:build` 生成 Windows 安装包和 win-unpacked
- [x] Bug 修复：`fetch('/api/categories')` → `getCategories()` 修复 Electron 下分类下拉无数据
- [x] Bug 修复：`main.cjs` 使用 `app.isPackaged` 判断后端路径，`waitForBackend()` 轮询等待后端就绪
- [x] 优化：后端绑定 `127.0.0.1` 避免 Windows 防火墙弹窗

## 9. 集成测试
- [x] 启动前后端，验证报表图表正常渲染
- [x] 验证搜索/筛选/排序功能
- [x] 验证批量选择和批量抠图/删除
- [x] 验证 Electron 打包及运行