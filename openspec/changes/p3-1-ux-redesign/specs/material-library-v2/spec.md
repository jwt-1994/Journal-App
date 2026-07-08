## ADDED Requirements

### Requirement: 分类标签页预览
素材库页面 SHALL 使用标签页按分类展示素材，每个分类一个 Tab，外加"全部"Tab 和"背景"Tab。

#### Scenario: 切换分类标签
- **WHEN** 用户点击某个分类标签页
- **THEN** 系统只展示该分类下已抠图成功的素材，以缩略图网格显示

#### Scenario: 全部标签页
- **WHEN** 用户选择"全部"标签页
- **THEN** 系统展示所有已抠图成功的素材，不受分类限制

#### Scenario: 背景标签页
- **WHEN** 用户选择"背景"标签页
- **THEN** 系统展示背景库中的背景素材，同样以缩略图网格显示

### Requirement: 仅展示抠图后素材
素材库 SHALL 默认只显示 `has_removed_bg === 'done'` 的素材。

#### Scenario: 未抠图素材不显示
- **WHEN** 素材的抠图状态为"未处理"、"处理中"或"失败"
- **THEN** 该素材在素材库标签页中不显示

### Requirement: 缩略图大图预览
素材库 SHALL 支持点击缩略图弹出大图预览。

#### Scenario: 点击缩略图
- **WHEN** 用户点击某个素材的缩略图
- **THEN** 系统弹出 Modal 显示该素材的大图（最大 600px 宽），并显示素材名称

#### Scenario: 关闭大图预览
- **WHEN** 用户点击预览 Modal 的关闭按钮或遮罩
- **THEN** 预览 Modal 关闭

### Requirement: 素材搜索和排序
素材库 SHALL 保留搜索输入框和排序下拉框，在任意标签页内均可使用。

#### Scenario: 搜索素材
- **WHEN** 用户在搜索框输入关键词
- **THEN** 当前标签页的素材实时按名称过滤

#### Scenario: 排序切换
- **WHEN** 用户选择排序方式
- **THEN** 当前标签页的素材按所选方式重新排列