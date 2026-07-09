# P4 iOS 移动端适配 - 任务分解

---

## P4A：基础架构 + 素材库移动端适配

### 1. Capacitor 项目初始化

- [x] 1.1 安装 Capacitor CLI 和 iOS 平台依赖
- [x] 1.2 配置 capacitor.config.ts（App ID、名称、webDir）
- [x] 1.3 初始化 iOS 项目（`npx cap add ios`）— 通过 GitHub Actions macOS runner
- [x] 1.4 配置 Xcode 项目（Bundle ID、版本号、签名团队）— 通过 CI 自动化
- [x] 1.5 验证 Vite 构建产物通过

### 2. 移动端 UI 框架搭建

- [x] 2.1 安装 antd-mobile 组件库
- [x] 2.2 创建 MobileLayout.tsx（底部 TabBar + SafeArea 适配）
- [x] 2.3 创建 TabBar 组件（5 个标签：素材库/拼贴/手账本/上传/设置）
- [x] 2.4 实现路由切换逻辑（App.tsx 平台检测 + 双路由）
- [x] 2.5 适配 StatusBar 和安全区域（刘海屏/灵动岛）

### 3. 代码目录重构

- [x] 3.1 创建 `pages/mobile/` 和 `components/mobile/` 目录
- [x] 3.2 保留现有桌面端页面在 `pages/` 不变
- [x] 3.3 创建移动端页面在 `pages/mobile/`
- [x] 3.4 创建移动端组件在 `components/mobile/`
- [x] 3.5 App.tsx 平台检测自动选择桌面/移动端路由

### 4. 素材库移动端适配

- [x] 4.1 创建 `pages/mobile/MaterialLibrary.tsx`
- [x] 4.2 顶部横向滚动分类标签（Tabs 组件）
- [x] 4.3 2列网格布局（适配 iPhone 屏幕宽度）
- [x] 4.4 点击素材弹出大图预览（ImageViewer）
- [x] 4.5 搜索栏适配移动端（SearchBar）
- [x] 4.6 背景分类集成到素材库标签中

### 5. 后端云端部署

- [x] 5.1 编写 Dockerfile 用于云端部署
- [x] 5.2 配置 CORS 允许移动端跨域请求
- [ ] 5.3 部署到云服务器（需实际服务器环境）
- [ ] 5.4 配置域名和 HTTPS 证书（需实际域名）
- [x] 5.5 更新前端 api.ts 支持云端/本地双 URL
- [x] 5.6 添加请求超时和离线检测机制

### 6. 本地离线存储

- [x] 6.1 安装 capacitor-community/sqlite 插件
- [x] 6.2 创建 offlineStorage.ts 离线缓存服务
- [x] 6.3 实现 localStorage 回退（Web 环境兼容）
- [x] 6.4 实现 cacheApiResponse 缓存策略
- [x] 6.5 添加网络状态检测和离线提示

---

## P4B：拼贴编辑器移动端适配 ✅ 已完成

### 7. 移动端拼贴编辑器

- [x] 7.1 创建 `pages/mobile/CollageEditor.tsx`
- [x] 7.2 画布全屏布局（占据整个屏幕，独立路由无 TabBar）
- [x] 7.3 底部浮动工具栏（半透明背景，毛玻璃效果，自动隐藏）
- [x] 7.4 素材选择底部弹出面板（BottomSheet + 搜索 + 3列网格）
- [x] 7.5 属性编辑底部弹出面板（填充/描边/文字颜色/字号编辑）
- [x] 7.6 图层面板改为底部弹出列表（可见性切换/排序）

### 8. 触控手势适配

- [x] 8.1 单指绘制适配（画笔、图形拖拽）
- [x] 8.2 双指捏合缩放画布（Pinch Zoom，20%-300%）
- [x] 8.3 双指平移画布（随缩放同步平移）
- [x] 8.4 单指拖拽移动元素（选择工具下）
- [ ] 8.5 双指旋转元素（暂未实现，Transformer 可旋转）
- [x] 8.6 长按弹出上下文菜单（属性/上移/下移/隐藏/删除）
- [x] 8.7 双击重置画布缩放（300ms 内双击复位到 100%）
- [x] 8.8 禁用 WebView 默认手势（meta viewport + touch-action: none）

### 9. 画布工具移动端适配

- [x] 9.1 选择工具：点按选中，Transformer 调整大小/旋转
- [x] 9.2 画笔工具：单指绘制，底部显示颜色和粗细滑块
- [x] 9.3 图形工具：拖拽绘制矩形/圆形/椭圆（Segmented 切换）
- [x] 9.4 文字工具：点击弹出 Dialog 输入框，确定后渲染
- [x] 9.5 颜色选择器：ColorPicker 弹出取色板
- [x] 9.6 撤销/重做：工具栏按钮（最多 30 步历史）

### 10. 画布预设适配

- [x] 10.1 新增手机屏幕比例预设（9:16=1080x1920、3:4=1200x1600）
- [x] 10.2 新建画布弹窗改为全屏面板（预设选择 + 背景选择）
- [x] 10.3 背景选择改为卡片网格显示缩略图

### 11. GitHub Actions CI/CD

- [x] 11.1 创建 `.github/workflows/ios-build.yml`
- [x] 11.2 支持 unsigned（免签名测试）和 signed（正式签名）双模式
- [x] 11.3 手动触发 workflow_dispatch 选择构建类型
- [x] 11.4 推送 main 分支自动触发 unsigned 构建
- [x] 11.5 构建产物作为 Artifact 下载（7天/30天保留）
- [x] 11.6 可选自动上传 TestFlight（需配置 App Store Connect API Key）
- [x] 11.7 创建 `frontend/ExportOptions.plist`（IPA 导出配置）
- [x] 11.8 创建根目录 `.gitignore`（排除 node_modules/dist/release4/数据库）
- [x] 11.9 更新 `frontend/.gitignore`（排除 *.asar 和 release4/）
- [x] 11.10 代码推送到 GitHub（jwt-1994/Journal-App）

---

## P4C：上传/设置/手账本 + 原生能力

### 12. 上传页面移动端适配

- [x] 12.1 创建 `pages/mobile/UploadPage.tsx`
- [ ] 12.2 集成 Capacitor Camera 插件（拍照上传）
- [x] 12.3 集成 ImageUploader 组件（相册选择，多选支持）
- [x] 12.4 上传进度条（ProgressBar）
- [x] 12.5 手动输入素材名称
- [x] 12.6 分类选择（Selector 组件）

### 13. 手账本移动端适配

- [x] 13.1 创建 `pages/mobile/JournalNotebook.tsx`
- [x] 13.2 拼贴方案卡片列表
- [x] 13.3 左滑删除/重命名操作（SwipeAction）
- [x] 13.4 点击跳转拼贴编辑器加载方案
- [ ] 13.5 分享拼贴到系统分享菜单（需 Capacitor Share）

### 14. 设置页面移动端适配

- [x] 14.1 创建 `pages/mobile/SettingsPage.tsx`
- [x] 14.2 分类管理（List + Dialog 新增/删除）
- [x] 14.3 关于页面（版本号 + 功能说明）
- [ ] 14.4 背景库管理（内置 `BackgroundLibrary` 功能）
- [ ] 14.5 云端同步设置
- [ ] 14.6 缓存管理（清除本地缓存）

### 15. iOS 原生能力集成

- [ ] 15.1 配置 Capacitor Camera 权限（Info.plist）
- [ ] 15.2 配置 Capacitor PhotoLibrary 权限
- [ ] 15.3 集成 Capacitor Share（分享拼贴图片）
- [ ] 15.4 集成 Capacitor Haptics（触觉反馈）
- [ ] 15.5 配置 App Transport Security（允许 HTTPS 请求）
- [ ] 15.6 添加启动画面（Launch Screen）
- [ ] 15.7 配置 App Icon（多尺寸）

---

## P4D：打包发布 + App Store 上架

### 16. 测试与优化

- [ ] 16.1 iPhone 真机测试（iPhone 14/15/16 Pro 系列）
- [ ] 16.2 iPad 适配测试
- [ ] 16.3 不同 iOS 版本兼容性测试（iOS 16/17/18）
- [ ] 16.4 性能优化（WebView 内存、启动速度）
- [ ] 16.5 触控体验打磨（手势灵敏度、动画流畅度）

### 17. App Store 上架准备

- [ ] 17.1 创建 Apple Developer 账号（$99/年）
- [ ] 17.2 创建 App ID 和 Provisioning Profile
- [ ] 17.3 编写隐私政策页面
- [ ] 17.4 准备 App Store 截图（iPhone 6.7" 和 6.5" 尺寸）
- [ ] 17.5 填写 App Store Connect 元数据（描述、关键词）
- [ ] 17.6 Xcode Archive → 上传到 App Store Connect
- [ ] 17.7 提交审核

### 18. 持续维护

- [x] 18.1 配置 CI/CD 自动构建（GitHub Actions）
- [ ] 18.2 云端服务监控和告警
- [ ] 18.3 用户反馈收集渠道
- [ ] 18.4 版本更新机制（强制更新 / 可选更新）

---

## P5：免费 iOS 真机测试（无需付费 Apple Developer）

> 详见 [free-signing-proposal.md](./free-signing-proposal.md)
> iPhone UDID: `00008130-000E08E434E1001C`

### 19. GitHub Actions 导出 IPA

- [ ] 19.1 添加 `xcodebuild -exportArchive` 导出 IPA 步骤
- [ ] 19.2 配置 ExportOptions.plist（development 模式）
- [ ] 19.3 上传 IPA 到 GitHub Actions Artifacts

### 20. PWA 部署（推荐，零成本）

- [ ] 20.1 创建 `manifest.json` + PWA meta 标签
- [ ] 20.2 创建 GitHub Pages 部署工作流
- [ ] 20.3 生成 App 图标（192x192 + 512x512）
- [ ] 20.4 iPhone Safari 添加到主屏幕验证

### 21. AltStore 侧载（推荐，完整原生功能）

- [ ] 21.1 Windows 安装 AltServer
- [ ] 21.2 iPhone 安装 AltStore
- [ ] 21.3 信任免费开发者证书
- [ ] 21.4 下载 IPA → AltStore 签名安装
- [ ] 21.5 验证 7 天自动刷新

### 22. 免费开发者证书 CI（可选）

- [ ] 22.1 获取 Apple ID App-Specific Password
- [ ] 22.2 配置 GitHub Secrets（FREE_APPLE_ID、FREE_APPLE_APP_PASSWORD、FREE_TEAM_ID）
- [ ] 22.3 添加自动签名构建 workflow
- [ ] 22.4 注册设备 UDID 到免费账号

---

## 优先级说明

| 阶段 | 优先级 | 预计工时 | 交付物 |
|------|--------|---------|--------|
| P4A | 🔴 高 | 5-7 天 | ✅ 可运行 iOS App + 素材库 + 云端后端 |
| P4B | 🔴 高 | 5-7 天 | ✅ 拼贴编辑器完整功能 |
| P4C | 🟡 中 | 3-5 天 | 🔄 全功能 iOS App |
| P4D | 🟢 低 | 3-5 天 | App Store 上架版本 |
| **P5** | 🔴 高 | 1-2 天 | ⬜ 免费真机测试 |

| 阶段 | 优先级 | 预计工时 | 状态 |
|------|--------|---------|------|
| P4A | 🔴 高 | 5-7 天 | ✅ 完成 |
| P4B | 🔴 高 | 5-7 天 | ✅ 完成 |
| P4C | 🟡 中 | 3-5 天 | 🔄 进行中 |
| P4D | 🟢 低 | 3-5 天 | ⏳ 待开始 |