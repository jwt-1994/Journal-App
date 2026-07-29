# 免费 iOS 真机测试方案

> 用户无付费 Apple Developer 账号（$99/年），iPhone UDID: `00008130-000E08E434E1001C`

---

## 方案对比总结

| 方案 | 安装方式 | 有效期 | 证书 | 限制 | 推荐度 |
|------|---------|--------|------|------|--------|
| **A: PWA** | Safari → 添加到主屏幕 | 永久 | 无 | 无原生插件 | ⭐⭐⭐⭐⭐ |
| **B: AltStore** | AltServer + AltStore | 7 天（需刷新） | 免费 Apple ID | 最多 3 个 App | ⭐⭐⭐⭐ |
| **C: Sideloadly** | USB 直连 | 7 天（需刷新） | 免费 Apple ID | 最多 3 个 App | ⭐⭐⭐ |
| **D: 免费开发者证书** | Xcode 自动签名 | 7 天 | 免费 Apple ID | 需 Mac | ⭐⭐⭐ |

> **强烈推荐 A+B 组合：日常用 PWA 快速预览，真机测试原生功能用 AltStore。**

---

## 方案 A：PWA（Progressive Web App）— 零成本零限制

### 原理
直接将 Web 应用在 Safari 中打开，通过"添加到主屏幕"变成独立 App。

### 优势
- 无需任何证书、签名、Apple ID
- 无 7 天过期限制
- 更新即时生效（刷新页面即可）
- 支持离线缓存

### 步骤

**1. 启用 PWA 支持**

在 `frontend/index.html` 中确保有 PWA manifest：

```html
<link rel="manifest" href="/manifest.json" />
<meta name="apple-mobile-web-app-capable" content="yes" />
<meta name="apple-mobile-web-app-status-bar-style" content="default" />
<meta name="apple-mobile-web-app-title" content="手账素材库" />
<link rel="apple-touch-icon" href="/icon-192.png" />
```

**2. 部署到公网**

使用 GitHub Pages（免费）：
```yaml
# .github/workflows/deploy-pwa.yml
name: Deploy PWA to GitHub Pages
on:
  push:
    branches: [main]
  workflow_dispatch:

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '22'
      - run: cd frontend && npm ci && npm run build
      - uses: peaceiris/actions-gh-pages@v4
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./frontend/dist
```

**3. iPhone 安装**

1. Safari 打开 `https://jwt-1994.github.io/Journal-App`
2. 底部工具栏 → 分享按钮 → **添加到主屏幕**
3. 命名 → 添加
4. 主屏幕出现独立 App 图标

### 限制
- 无法使用 Capacitor 原生插件（相机、文件系统、触觉反馈等）
- 但 Web 版已有 `localStorage` 存储、HTML5 文件上传等替代方案

---

## 方案 B：AltStore — 免费签名侧载

### 原理
1. Windows 安装 AltServer
2. AltServer 用你的免费 Apple ID 对 IPA 签名
3. iPhone 通过 WiFi/USB 从 AltServer 安装 App

### 完整步骤

**步骤 1：Windows 安装 AltServer**

1. 下载 AltServer：https://altstore.io
2. 安装并运行 AltServer（任务栏会有图标）
3. 用 USB 连接 iPhone 到 Windows
4. 确保 iTunes / Apple Devices 已安装并识别 iPhone

**步骤 2：iPhone 安装 AltStore**

1. 在 Windows 任务栏点击 AltServer 图标
2. 选择 "Install AltStore" → 选择你的 iPhone
3. 输入免费 Apple ID 和密码
4. AltStore 出现在 iPhone 主屏幕

**步骤 3：信任证书**

1. iPhone → 设置 → 通用 → VPN 与设备管理
2. 点击你的 Apple ID
3. 信任证书

**步骤 4：下载 IPA 并安装**

1. 从 GitHub Actions 下载构建好的 IPA（unsigned 模式）
2. 将 IPA 文件传到 iPhone（AirDrop / 微信 / iCloud）
3. iPhone 打开 AltStore → My Apps → + → 选择 IPA
4. AltStore 自动签名并安装

**步骤 5：7 天刷新**

- AltStore 会在后台自动刷新签名（需 iPhone 和 AltServer 在同一 WiFi）
- 或手动：AltStore → My Apps → Refresh All

### 优势
- 完全免费，只需 Apple ID
- 可使用所有 Capacitor 原生插件
- AltStore 自动刷新，无需手动重签

### 限制
- 免费 Apple ID 最多侧载 3 个 App
- 每 7 天需刷新一次（AltStore 可自动刷新）
- AltServer 必须运行在后台（Windows）

---

## 方案 C：Sideloadly — 替代侧载方案

### 原理
与 AltStore 类似，但更简单——直接 USB 安装，无需 iPhone 上的 AltStore 客户端。

### 步骤

1. 下载 Sideloadly：https://sideloadly.io
2. 用 USB 连接 iPhone
3. 拖入 IPA 文件
4. 输入 Apple ID
5. 点击 Start
6. iPhone 上信任证书

### 优势
- 更简单直接，无需手机端 App
- 支持 Windows 和 macOS

### 限制
- 每次安装需 USB 连接
- 7 天过期后需重新安装
- 不会自动刷新

---

## 方案 D：免费开发者证书 + Xcode 自动签名

### 原理
使用免费 Apple ID 在 Xcode 中创建免费的 Provisioning Profile，通过 GitHub Actions 构建。

### 关键信息

| 项目 | 值 |
|------|-----|
| 团队类型 | Individual（免费） |
| 限制 | 最多 3 个 App，7 天过期 |
| 设备 UDID | `00008130-000E08E434E1001C` |

### GitHub Actions 工作流修改

免费开发者账号无法创建 API Key，因此需要：
- 使用 `CODE_SIGN_STYLE=Automatic`
- 提供 Apple ID 和 App-Specific Password
- Xcode 自动管理签名

```yaml
# 免费签名构建
- name: Build with Free Provisioning
  env:
    DEVELOPER_APPLE_ID: ${{ secrets.FREE_APPLE_ID }}
    DEVELOPER_APPLE_PASSWORD: ${{ secrets.FREE_APPLE_APP_PASSWORD }}
  run: |
    cd frontend/ios/App
    xcodebuild archive \
      -workspace App.xcworkspace \
      -scheme App \
      -archivePath ./build/App.xcarchive \
      -destination 'generic/platform=iOS' \
      -allowProvisioningUpdates \
      -authenticationKeyIssuerID "" \
      -authenticationKeyID "" \
      -authenticationKeyPath "" \
      DEVELOPMENT_TEAM=${{ secrets.FREE_TEAM_ID }} \
      CODE_SIGN_STYLE=Automatic
```

### 获取 App-Specific Password

1. 登录 https://appleid.apple.com
2. 登录与安全 → App 专用密码 → 生成
3. 添加到 GitHub Secrets: `FREE_APPLE_APP_PASSWORD`

### 获取 Team ID

1. 登录 https://developer.apple.com/account
2. Membership → Team ID（10 位字符串）
3. 添加到 GitHub Secrets: `FREE_TEAM_ID`

### 限制
- 需要手动注册设备 UDID（通过 Xcode 或 Apple Configurator）
- 7 天过期
- 无法通过 TestFlight 分发
- Xcode 自动签名在 CI 环境下可能不稳定

---

## 推荐实施路径

```
Phase 1（立即）: PWA 部署
  ├── 创建 GitHub Pages 部署工作流
  ├── 添加 PWA manifest + 图标
  └── iPhone Safari 添加主屏幕 → 立即可用

Phase 2（本周）: AltStore 侧载
  ├── Windows 安装 AltServer
  ├── iPhone 安装 AltStore
  ├── 下载 GitHub Actions 构建的 IPA
  └── AltStore 签名安装 → 完整原生功能

Phase 3（可选）: 免费开发者证书 CI
  └── 配置 GitHub Secrets → 自动签名构建
```

---

## 当前工作流修改

当前 `ios-build.yml` 的 unsigned 构建已生成可用的 `.xcarchive`，但需要导出为 `.ipa` 才能被 AltStore/Sideloadly 使用。

需要添加导出 IPA 步骤：

```yaml
- name: Export IPA
  run: |
    cd frontend/ios/App
    xcodebuild -exportArchive \
      -archivePath ./build/App.xcarchive \
      -exportPath ./build/export \
      -exportOptionsPlist ../../ExportOptions.plist

- name: Upload IPA
  uses: actions/upload-artifact@v4
  with:
    name: ios-ipa
    path: frontend/ios/App/build/export/*.ipa
    retention-days: 7
```