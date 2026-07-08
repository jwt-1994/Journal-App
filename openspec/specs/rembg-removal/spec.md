# rembg-removal Specification

## Purpose
TBD - created by archiving change rembg-integration. Update Purpose after archive.
## Requirements
### Requirement: 自动抠图
系统 SHALL 在上传素材后自动执行抠图任务。

#### Scenario: 上传后自动抠图
- **WHEN** 用户上传一张图片并选择"自动抠图"（默认开启）
- **THEN** 系统在后台异步执行抠图，抠图完成后生成透明背景 PNG 存入 `data/processed/`

#### Scenario: 关闭自动抠图
- **WHEN** 用户上传时关闭"自动抠图"开关
- **THEN** 系统仅存储原图，不执行抠图

### Requirement: 抠图状态追踪
系统 SHALL 追踪每张素材的抠图状态。

#### Scenario: 抠图处理中
- **WHEN** 抠图任务正在后台执行
- **THEN** 该素材的抠图状态显示为"处理中"

#### Scenario: 抠图成功
- **WHEN** 抠图任务完成
- **THEN** 该素材的抠图状态更新为"已抠图"，`removed_bg_path` 指向抠图结果文件

#### Scenario: 抠图失败
- **WHEN** 抠图任务因异常失败
- **THEN** 该素材的抠图状态更新为"失败"，保留原图不受影响

### Requirement: 手动重试抠图
系统 SHALL 支持对抠图失败的素材手动重试。

#### Scenario: 重新抠图
- **WHEN** 用户对抠图状态为"失败"或"未抠图"的素材点击"重新抠图"
- **THEN** 系统重新执行抠图任务，状态置为"处理中"

### Requirement: 前端抠图状态展示
系统 SHALL 在前端展示素材的抠图状态。

#### Scenario: 素材列表中的状态标识
- **WHEN** 用户在素材库中浏览素材
- **THEN** 每张素材卡片上显示抠图状态标签（已抠图/处理中/未抠图/失败）

#### Scenario: 素材详情中的对比切换
- **WHEN** 用户打开已抠图素材的详情模态框
- **THEN** 系统提供"原图/抠图"切换按钮，用户可对比查看

### Requirement: 抠图错误处理
系统 SHALL 在抠图失败时优雅降级，不影响素材的浏览和使用。

#### Scenario: 抠图失败后仍可浏览
- **WHEN** 某素材的抠图失败
- **THEN** 用户仍可在素材库中正常浏览该素材的原图，并可手动重试抠图

