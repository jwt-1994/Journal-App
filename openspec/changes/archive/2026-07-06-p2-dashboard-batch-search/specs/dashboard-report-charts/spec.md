# dashboard-report (modified)

## 概述
将 P0 的纯文本统计报表升级为图表可视化报表。

## 修改内容

### 1. 后端接口扩展
- `GET /api/dashboard/stats` 新增 `bg_status_stats` 字段，返回各抠图状态的数量统计
- 新增 `GET /api/dashboard/upload-trend?days=30` 接口，返回每日上传数量

### 2. 前端图表替换
- 纯文本分类统计卡片 → 分类占比饼图 (PieChart)
- 新增抠图状态分布柱状图 (BarChart)
- 新增上传趋势折线图 (LineChart)
- 保留概览统计卡片和最近上传表格