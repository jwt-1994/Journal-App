## REMOVED Requirements

### Requirement: 报表看板菜单入口
**Reason**: 报表看板从独立菜单栏移除，简化导航
**Migration**: 后端 API 保留不动，后续可在设置页增加数据统计入口；用户通过浏览器直接访问 /api/dashboard/stats 仍可获取数据

### Requirement: 报表看板图表展示
**Reason**: 报表查看不是核心操作流程，暂不暴露在导航栏
**Migration**: 后端 `GET /api/dashboard/stats` 和 `GET /api/dashboard/upload-trend` 接口保留，可在未来需要时重新接入