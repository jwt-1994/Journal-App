## MODIFIED Requirements

### Requirement: 素材卡片展示
素材卡片 SHALL 仅显示素材名称，居中显示，不显示分类标签和文件大小。

#### Scenario: 素材卡片布局
- **WHEN** 素材库展示素材
- **THEN** 每张卡片包含缩略图（120px高）和下方的名称文字（居中、12px、单行溢出省略）

#### Scenario: 不再显示分类标签
- **WHEN** 素材卡片渲染
- **THEN** 卡片不显示分类 Tag 标签

#### Scenario: 不再显示文件大小
- **WHEN** 素材卡片渲染
- **THEN** 卡片不显示文件大小文本