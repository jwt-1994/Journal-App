## Why

当前手账素材库为 Electron 桌面应用（Windows），用户希望将其移植到 iPhone（iOS），方便随时随地使用素材管理和拼贴功能。桌面端布局（侧边栏导航、大画布、右键菜单）完全不适合手机操作，需要从交互模式到底层架构进行全面适配。

## What Changes

### 核心策略：Capacitor 混合方案

采用 **Capacitor + React** 技术栈，将现有 Web 前端包装为 iOS 原生应用，同时针对移动端全面重构 UI/UX：

- **架构变更**：Electron → Capacitor（iOS），Python 后端 → 云部署 + 本地轻量存储
- **UI 重构**：侧边栏导航 → 底部 TabBar 导航，桌面布局 → 移动端触控友好布局
- **交互适配**：鼠标操作 → 触控手势（点按、长按、滑动、捏合缩放），右键菜单 → 长按菜单
- **拼贴编辑器**：大画布 → 触控优化画布（捏合缩放、双指平移、Apple Pencil 支持）
- **后端迁移**：本地 Python FastAPI → 云端部署（Vercel/自建服务器），保留本地 SQLite 用于离线模式
- **原生能力**：调用 iOS 相机拍照上传、相册选取、文件共享、iCloud 同步

### 分阶段实施

| 阶段 | 内容 | 目标 |
|------|------|------|
| **P4A** | 基础架构 + 素材库移动端适配 | 可运行 iOS App，素材库可用 |
| **P4B** | 拼贴编辑器移动端适配 | 触控拼贴功能完整 |
| **P4C** | 上传/设置/手账本 + 原生能力 | 全功能 iOS App |
| **P4D** | 打包发布 + App Store 上架 | 正式发布 |

## Capabilities

### New Capabilities
- `ios-app-shell`: Capacitor iOS 壳工程 - Xcode 项目、原生配置、签名
- `mobile-ui-layout`: 移动端 UI 布局 - 底部 TabBar、触控优化组件
- `mobile-collage-editor`: 移动端拼贴编辑器 - 触控手势、捏合缩放
- `cloud-backend`: 云端后端部署 - FastAPI 部署到服务器
- `ios-native-features`: iOS 原生能力 - 相机、相册、iCloud、分享

### Modified Capabilities
- `material-library-v2`: 素材库适配移动端网格布局和触控交互
- `background-picker-preview`: 背景选择适配移动端底部弹出面板
- `collage-canvas-presets`: 画布预设适配手机屏幕尺寸

## Impact

- **前端**：全面重构 UI 层（保留业务逻辑），新增 Capacitor 配置和原生插件
- **后端**：从本地部署改为云部署，新增 Dockerfile 云部署配置，本地保留 SQLite 离线回退
- **数据**：新增 iCloud 同步方案，本地数据与云端数据合并策略
- **无破坏性变更**：桌面端 Electron 版本继续保留，与移动端共享核心业务代码