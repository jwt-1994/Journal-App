# P4 iOS 移动端适配 - 任务分解

---

## P4A：基础架构 + 素材库移动端适配

### 1. Capacitor 项目初始化

- [x] 1.1 安装 Capacitor CLI 和 iOS 平台依赖
- [x] 1.2 配置 capacitor.config.ts（App ID、名称、webDir）
- [ ] 1.3 初始化 iOS 项目（`npx cap add ios`）— 需 macOS 环境
- [ ] 1.4 配置 Xcode 项目（Bundle ID、版本号、签名团队）— 需 macOS 环境
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

## P4B：拼贴编辑器移动端适配

### 7. 移动端拼贴编辑器

- [ ] 7.1 创建 `pages/mobile/CollageEditor.tsx`
- [ ] 7.2 画布全屏布局（占据整个屏幕）
- [ ] 7.3 底部浮动工具栏（半透明背景，自动隐藏）
- [ ] 7.4 素材选择底部弹出面板（BottomSheet）
- [ ] 7.5 属性编辑底部弹出面板
- [ ] 7.6 图层面板改为底部弹出列表

### 8. 触控手势适配

- [ ] 8.1 单指绘制适配（画笔、图形拖拽）
- [ ] 8.2 双指捏合缩放画布（Pinch Zoom）
- [ ] 8.3 双指平移画布
- [ ] 8.4 单指拖拽移动元素
- [ ] 8.5 双指旋转元素
- [ ] 8.6 长按弹出上下文菜单（替代右键菜单）
- [ ] 8.7 双击重置画布缩放
- [ ] 8.8 禁用 WebView 默认手势冲突（双击缩放、边缘滑动）

### 9. 画布工具移动端适配

- [ ] 9.1 选择工具：点按选中，支持多选
- [ ] 9.2 画笔工具：单指绘制，工具栏显示颜色和粗细
- [ ] 9.3 图形工具：拖拽绘制矩形/圆形/椭圆
- [ ] 9.4 文字工具：点击弹出输入框，预览实时渲染
- [ ] 9.5 颜色选择器：移动端友好的底部弹出取色板
- [ ] 9.6 撤销/重做：工具栏按钮 + 双指点击撤销

### 10. 画布预设适配

- [ ] 10.1 新增手机屏幕比例预设（9:16、3:4 等）
- [ ] 10.2 新建画布弹窗改为底部弹出面板
- [ ] 10.3 背景选择改为横向滚动卡片

---

## P4C：上传/设置/手账本 + 原生能力

### 11. 上传页面移动端适配

- [ ] 11.1 创建 `pages/mobile/UploadPage.tsx`
- [ ] 11.2 集成 Capacitor Camera 插件（拍照上传）
- [ ] 11.3 集成 Capacitor 相册选择（多选支持）
- [ ] 11.4 上传进度条（移动端友好）
- [ ] 11.5 手动输入素材名称
- [ ] 11.6 分类选择（底部弹出 ActionSheet）

### 12. 手账本移动端适配

- [ ] 12.1 创建 `pages/mobile/JournalNotebook.tsx`
- [ ] 12.2 拼贴方案卡片列表
- [ ] 12.3 左滑删除/重命名操作
- [ ] 12.4 点击预览拼贴大图
- [ ] 12.5 分享拼贴到系统分享菜单

### 13. 设置页面移动端适配

- [ ] 13.1 创建 `pages/mobile/SettingsPage.tsx`
- [ ] 13.2 分类管理（内置 `CategoryManagement` 功能）
- [ ] 13.3 背景库管理（内置 `BackgroundLibrary` 功能）
- [ ] 13.4 云端同步设置
- [ ] 13.5 缓存管理（清除本地缓存）
- [ ] 13.6 关于页面

### 14. iOS 原生能力集成

- [ ] 14.1 配置 Capacitor Camera 权限（Info.plist）
- [ ] 14.2 配置 Capacitor PhotoLibrary 权限
- [ ] 14.3 集成 Capacitor Share（分享拼贴图片）
- [ ] 14.4 集成 Capacitor Haptics（触觉反馈）
- [ ] 14.5 配置 App Transport Security（允许 HTTPS 请求）
- [ ] 14.6 添加启动画面（Launch Screen）
- [ ] 14.7 配置 App Icon（多尺寸）

---

## P4D：打包发布 + App Store 上架

### 15. 测试与优化

- [ ] 15.1 iPhone 真机测试（iPhone 14/15/16 Pro 系列）
- [ ] 15.2 iPad 适配测试
- [ ] 15.3 不同 iOS 版本兼容性测试（iOS 16/17/18）
- [ ] 15.4 性能优化（WebView 内存、启动速度）
- [ ] 15.5 触控体验打磨（手势灵敏度、动画流畅度）

### 16. App Store 上架准备

- [ ] 16.1 创建 Apple Developer 账号（$99/年）
- [ ] 16.2 创建 App ID 和 Provisioning Profile
- [ ] 16.3 编写隐私政策页面
- [ ] 16.4 准备 App Store 截图（iPhone 6.7" 和 6.5" 尺寸）
- [ ] 16.5 填写 App Store Connect 元数据（描述、关键词）
- [ ] 16.6 Xcode Archive → 上传到 App Store Connect
- [ ] 16.7 提交审核

### 17. 持续维护

- [ ] 17.1 配置 CI/CD 自动构建（GitHub Actions + Fastlane）
- [ ] 17.2 云端服务监控和告警
- [ ] 17.3 用户反馈收集渠道
- [ ] 17.4 版本更新机制（强制更新 / 可选更新）

---

## 优先级说明

| 阶段 | 优先级 | 预计工时 | 交付物 |
|------|--------|---------|--------|
| P4A | 🔴 高 | 5-7 天 | 可运行的 iOS App + 素材库可用 + 云端后端 |
| P4B | 🔴 高 | 5-7 天 | 拼贴编辑器完整功能 |
| P4C | 🟡 中 | 3-5 天 | 全功能 iOS App |
| P4D | 🟢 低 | 3-5 天 | App Store 上架版本 |