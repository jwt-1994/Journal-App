## MODIFIED Requirements

### Requirement: 文件名搜索
- 素材库顶部增加搜索输入框（带搜索图标）
- 输入关键词后实时过滤，后端使用 SQL LIKE 模糊匹配 `original_name`
- 支持清空搜索
- **搜索在分类标签页切换时保持独立生效**

### Requirement: 排序
- 增加排序下拉选择器
- 支持四种排序方式：上传时间最新/最旧、文件大小最大/最小
- 默认按上传时间最新排序
- **排序在分类标签页切换时保持独立生效**

### Requirement: 素材库默认展示
- 素材库 SHALL 默认只显示 `has_removed_bg === 'done'` 的素材
- 素材以缩略图网格形式展示，每张缩略图 120px 宽
- 点击缩略图弹出大图预览 Modal

## REMOVED Requirements

### Requirement: 抠图状态筛选
**Reason**: 素材库升级为只展示抠图后的素材，无需状态筛选
**Migration**: 用户可在上传页面查看素材的抠图状态