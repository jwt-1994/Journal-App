# Windows 本机打包 iOS 版本方案

## 核心问题

Capacitor iOS 构建最终需要 **Xcode**（仅 macOS），用户当前使用 Windows 开发。需要解决"在 Windows 开发，生成 iOS 可用包"的问题。

---

## 方案对比

| 方案 | 成本 | 复杂度 | 推荐度 | 说明 |
|------|------|--------|--------|------|
| **A: GitHub Actions** | 免费（公开仓库） | 中 | ⭐⭐⭐⭐⭐ | 推送代码自动构建 iOS |
| **B: 远程 Mac 服务** | $20-100/月 | 低 | ⭐⭐⭐⭐ | 租用云端 Mac 手动操作 |
| **C: 本地 Mac 设备** | 硬件成本 | 低 | ⭐⭐⭐⭐ | 买 Mac mini 或 MacBook |
| **D: Hackintosh** | 时间成本 | 极高 | ⭐ | 不推荐，不稳定 |

> **强烈推荐方案 A：GitHub Actions**，免费且自动化。

---

## 方案 A：GitHub Actions 自动构建（推荐）

### 整体流程

```
Windows 开发机                    GitHub                     App Store / TestFlight
┌──────────┐    git push    ┌──────────────┐   自动上传   ┌──────────────────┐
│ 编写代码  │ ────────────→ │ GitHub Actions│ ──────────→ │  App Store Connect│
│ Vite 构建 │               │ (macOS Runner)│             │  TestFlight 分发  │
│ 本地测试  │               │ Xcode Archive │             │                  │
└──────────┘               └──────────────┘             └──────────────────┘
```

### 步骤 1：创建 GitHub 仓库

```bash
cd C:\Users\AI\Documents\trae_projects\app_project
git init
git add .
git commit -m "init: 手账素材库"
git remote add origin https://github.com/YOUR_USERNAME/sticker-material.git
git push -u origin main
```

### 步骤 2：配置 GitHub Actions Workflow

在项目根目录创建 `.github/workflows/ios-build.yml`：

```yaml
name: Build iOS

on:
  push:
    branches: [main]
  workflow_dispatch:  # 手动触发

jobs:
  build:
    runs-on: macos-latest
    
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install Dependencies
        run: |
          cd frontend
          npm ci

      - name: Build Web App
        run: |
          cd frontend
          npm run build

      - name: Install Capacitor CLI
        run: |
          cd frontend
          npm install @capacitor/cli @capacitor/ios @capacitor/core
          npm install @capacitor/camera @capacitor/filesystem @capacitor/share @capacitor/haptics @capacitor/status-bar @capacitor-community/sqlite

      - name: Setup Capacitor iOS
        run: |
          cd frontend
          npx cap init "手账素材库" "com.sticker.material" --web-dir=dist
          npx cap add ios

      - name: Setup Xcode
        uses: maxim-lobanov/setup-xcode@v1
        with:
          xcode-version: '16.0'

      - name: Build iOS Archive
        run: |
          cd frontend/ios
          xcodebuild archive \
            -workspace App.xcworkspace \
            -scheme App \
            -archivePath ./build/App.xcarchive \
            -destination 'generic/platform=iOS' \
            CODE_SIGN_IDENTITY="" \
            CODE_SIGNING_REQUIRED=NO \
            CODE_SIGNING_ALLOWED=NO

      - name: Upload Archive
        uses: actions/upload-artifact@v4
        with:
          name: ios-archive
          path: frontend/ios/build/App.xcarchive

      - name: Export IPA (unsigned)
        run: |
          cd frontend/ios
          xcodebuild -exportArchive \
            -archivePath ./build/App.xcarchive \
            -exportPath ./build/export \
            -exportOptionsPlist ./build/exportOptions.plist
```

### 步骤 3：导出 IPA 配置

创建 `frontend/ios/exportOptions.plist`：

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>method</key>
    <string>development</string>
    <key>teamID</key>
    <string>YOUR_TEAM_ID</string>
    <key>compileBitcode</key>
    <false/>
</dict>
</plist>
```

### 步骤 4：配置 App Store Connect API Key

1. 登录 App Store Connect → Users and Access → Keys
2. 生成 API Key（下载 p8 文件）
3. 在 GitHub 仓库 Settings → Secrets 中添加：
   - `APP_STORE_CONNECT_KEY_ID`：Key ID
   - `APP_STORE_CONNECT_ISSUER_ID`：Issuer ID
   - `APP_STORE_CONNECT_KEY`：p8 文件内容

### 步骤 5：自动上传到 TestFlight

在 workflow 中添加上传步骤：

```yaml
- name: Upload to TestFlight
  uses: Apple-Actions/upload-testflight-build@v1
  with:
    app-path: frontend/ios/build/export/App.ipa
    issuer-id: ${{ secrets.APP_STORE_CONNECT_ISSUER_ID }}
    api-key-id: ${{ secrets.APP_STORE_CONNECT_KEY_ID }}
    api-private-key: ${{ secrets.APP_STORE_CONNECT_KEY }}
```

---

## 方案 B：远程 Mac 服务（手动操作）

如果不想用 GitHub Actions，可以租用云端 Mac 手动操作。

### 服务商

| 服务商 | 价格 | 特点 |
|--------|------|------|
| MacStadium | $109/月起 | 专业 Mac 云服务 |
| MacinCloud | $20/月起 | 按小时/月租用 |
| Amazon EC2 Mac | $1.083/小时 | AWS 生态 |

### 操作流程

```
1. 租用 Mac 云服务（SSH 或 VNC 远程连接）
2. 安装 Node.js、Xcode
3. git clone 代码
4. npm install && npm run build
5. npx cap add ios && npx cap sync ios
6. Xcode Archive → 导出 IPA
7. 下载 IPA 到本地，通过 TestFlight 或 OTA 分发
```

---

## 方案 C：本地 Mac 设备

如果预算允许，购买一台 Mac 用于打包：

| 设备 | 参考价格 | 推荐 |
|------|---------|------|
| Mac mini M4 | ¥3,499 起 | ⭐⭐⭐⭐⭐ 性价比最高 |
| MacBook Air M4 | ¥7,999 起 | ⭐⭐⭐⭐ 便携 |
| 二手 Mac mini M1 | ¥2,000 左右 | ⭐⭐⭐ 预算有限 |

---

## 开发阶段推荐方案

### 当前阶段（开发 + 内测）

```
Windows 开发 → GitHub Actions 自动构建 → TestFlight 分发
```

- 代码推送到 GitHub → Actions 自动构建 iOS 包
- 构建结果通过 TestFlight 分发给测试人员
- 测试人员用 iPhone 安装 TestFlight App 测试

### 开发阶段本地调试

由于 Windows 无法直接运行 iOS 模拟器，建议：

1. **Chrome DevTools 移动模式**：在 Windows 上用 Chrome 模拟 iPhone 屏幕
   ```
   打开 Chrome DevTools (F12) → Toggle Device Toolbar (Ctrl+Shift+M)
   → 选择 iPhone 14 Pro 或 iPhone 15 Pro
   ```
   这可以调试大部分 UI 和交互逻辑。

2. **Capacitor Live Reload**：配置 Capacitor 的 livereload 到本地开发服务器
   ```typescript
   // capacitor.config.ts
   const config: CapacitorConfig = {
     appId: 'com.sticker.material',
     appName: '手账素材库',
     webDir: 'dist',
     server: {
       url: 'http://192.168.1.xxx:5173',  // 本地开发服务器 IP
       cleartext: true,
     },
   };
   ```
   然后在 Mac 上运行 `npx cap sync ios`，Xcode 中运行 App 会加载 Windows 上的开发服务器，实现热更新调试。

3. **云 Mac 附加服务**：需要测试原生功能时（相机、文件系统等），租用云端 Mac 进行真机测试。

---

## 方案 D：Ionic Appflow（Capacitor 官方云构建）

**无需 Mac，完全在云端构建 iOS**，且对 Capacitor 项目有原生支持。

| 项目 | 说明 |
|------|------|
| 免费额度 | 每月 100 次构建（Hobby 计划） |
| 付费计划 | $42/月起（含自动化部署） |
| 支持平台 | iOS、Android 同时构建 |
| 操作方式 | Web 控制台或 CLI 命令 |

### 使用流程

```bash
# 1. 安装 Appflow CLI
npm install -g @ionic/cli

# 2. 登录
ionic login

# 3. 连接项目
ionic link

# 4. 推送代码到 Appflow
git push ionic main

# 5. 在 Web 控制台配置构建
#   - 选择 iOS 平台
#   - 配置签名证书（上传 .p12 和 provisioning profile）
#   - 点击构建
# 6. 构建完成后下载 IPA 文件
```

### 优势
- Capacitor 官方出品，对 Capacitor 项目支持最好
- 无需 GitHub 仓库
- 提供证书管理功能
- 支持 Live Update（热更新，无需重新审核）

---

## 方案 E：Codemagic（跨平台 CI/CD）

**免费额度慷慨，支持 Capacitor 项目**。

| 项目 | 说明 |
|------|------|
| 免费额度 | 每月 500 分钟（macOS M1 标准机） |
| 付费计划 | $49/月起 |
| 支持平台 | iOS、Android、Flutter、React Native |

### 使用流程

```bash
# 1. 在 codemagic.io 注册账号
# 2. 连接 GitHub/GitLab 仓库
# 3. 在项目根目录创建 codemagic.yaml
```

```yaml
# codemagic.yaml
workflows:
  ios-build:
    name: iOS Build
    instance_type: mac_mini_m1
    max_build_duration: 60
    environment:
      node: 20.0.0
      xcode: 16.0
    scripts:
      - name: Install dependencies
        script: cd frontend && npm ci
      - name: Build web
        script: cd frontend && npm run build
      - name: Setup Capacitor
        script: |
          cd frontend
          npx cap init "手账素材库" "com.sticker.material" --web-dir=dist
          npx cap add ios
      - name: Build iOS
        script: |
          cd frontend/ios/App
          xcodebuild archive -workspace App.xcworkspace -scheme App \
            -archivePath build/App.xcarchive \
            -destination 'generic/platform=iOS' \
            CODE_SIGN_STYLE=Manual
    artifacts:
      - frontend/ios/App/build/App.xcarchive
```

### 优势
- 每月 500 分钟免费，对个人开发者足够
- 支持 macOS M1 机器，构建速度快
- 与 Git 仓库集成，推送自动构建
- 提供 Webhook 通知

---

## 方案对比总结

| 方案 | 成本 | 自动化 | 证书管理 | 推荐度 |
|------|------|--------|---------|--------|
| GitHub Actions | 免费 | ✅ | 手动 | ⭐⭐⭐⭐⭐ |
| **Codemagic** | 500分钟/月免费 | ✅ | 内置 | ⭐⭐⭐⭐⭐ |
| Ionic Appflow | 100次/月免费 | ✅ | 内置 | ⭐⭐⭐⭐ |
| 云 Mac 租赁 | $20-100/月 | 手动 | 手动 | ⭐⭐⭐ |
| 本地 Mac | ¥2,000+ | 手动 | 手动 | ⭐⭐⭐ |

> **无 Mac 最佳方案**：**Codemagic**（免费额度 500 分钟/月，内置证书管理，无需任何 Mac 设备）

---

## 无 Mac 开发完整流程

```
Windows 开发 → Chrome DevTools 移动模拟调试
     │
     │ git push
     ▼
GitHub / Codemagic → 云端 macOS 自动构建 iOS
     │
     │ API 上传
     ▼
App Store Connect → TestFlight 内测分发
     │
     ▼
测试人员 iPhone → TestFlight App 安装测试
```

### 本地调试方案

1. **Chrome DevTools 移动模拟**（主力）
   ```
   F12 → Toggle Device Toolbar (Ctrl+Shift+M)
   → 选择 iPhone 15 Pro
   ```
   可以调试 90% 的 UI 和交互逻辑，包括触控事件。

2. **Vite 开发服务器 + 局域网访问**
   ```
   npm run dev -- --host 0.0.0.0
   ```
   在手机上用浏览器访问 `http://你的IP:5173` 即可预览 Web 版本。

3. **Capacitor Live Reload**（需 Mac 设备）
   如果有借用的 Mac 或云 Mac，配置 livereload 到 Windows 开发服务器。

### 证书获取（无 Mac 也可操作）

1. 注册 Apple Developer 账号（$99/年）
2. 登录 developer.apple.com
3. 在 Certificates, Identifiers & Profiles 中：
   - 创建 App ID
   - 创建 iOS Distribution 证书（CSR 可用 OpenSSL 在 Windows 生成）
   - 创建 Provisioning Profile
4. 将证书和 Profile 上传到 Codemagic/GitHub Secrets

### Windows 生成 CSR 证书

```powershell
# 安装 OpenSSL（如未安装）
# 下载 https://slproweb.com/products/Win32OpenSSL.html

# 生成私钥
openssl genrsa -out ios_distribution.key 2048

# 生成 CSR
openssl req -new -key ios_distribution.key -out ios_distribution.csr -subj "/emailAddress=your@email.com/CN=Your Name"

# 将 CSR 上传到 Apple Developer 网站获取证书
```

---

## 总结

| 阶段 | 工具 | 说明 |
|------|------|------|
| 日常开发 | Windows + Chrome DevTools | 移动端模拟调试 |
| 构建打包 | **Codemagic**（推荐）或 GitHub Actions | 云端自动构建 IPA |
| 内测分发 | TestFlight | 邀请测试人员 |
| 证书管理 | Apple Developer + Codemagic | 云端管理证书 |
| 原生功能测试 | 云端 Mac 或借用 Mac | 真机调试