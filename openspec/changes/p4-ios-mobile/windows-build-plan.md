# Windows 本机打包 iOS 版本方案

## 核心问题

Capacitor iOS 构建最终需要 **Xcode**（仅 macOS），用户当前使用 Windows 开发。需要解决"在 Windows 开发，生成 iOS 可用包"的问题。

---

## 方案对比

| 方案 | 成本 | 复杂度 | 推荐度 | 状态 |
|------|------|--------|--------|------|
| **A: GitHub Actions** | 免费（公开仓库） | 中 | ⭐⭐⭐⭐⭐ | ✅ 已采用 |
| **B: 远程 Mac 服务** | $20-100/月 | 低 | ⭐⭐⭐⭐ | 备选 |
| **C: 本地 Mac 设备** | 硬件成本 | 低 | ⭐⭐⭐⭐ | 备选 |
| **D: Hackintosh** | 时间成本 | 极高 | ⭐ | 不推荐 |

---

## 方案 A：GitHub Actions 自动构建（✅ 已采用）

### 仓库信息

| 项目 | 值 |
|------|-----|
| 仓库地址 | https://github.com/jwt-1994/Journal-App |
| Workflow | `.github/workflows/ios-build.yml` |
| 构建状态 | 已推送，首次构建已触发 |
| 构建方式 | unsigned（免签名）/ signed（加密签名）双模式 |

### 整体流程

```
Windows 开发机                    GitHub                     App Store / TestFlight
┌──────────┐    git push    ┌──────────────┐   自动上传   ┌──────────────────┐
│ 编写代码  │ ────────────→ │ GitHub Actions│ ──────────→ │  App Store Connect│
│ Vite 构建 │               │ (macOS Runner)│             │  TestFlight 分发  │
└──────────┘               └──────────────┘             └──────────────────┘
```

### 构建触发方式

| 触发方式 | 构建类型 | 说明 |
|---------|---------|------|
| `git push main` | unsigned | 自动触发，验证编译通过 |
| 手动触发 `workflow_dispatch` | unsigned / signed | 可选 build_type 和 upload_testflight |

### 已创建的 CI/CD 文件

| 文件 | 用途 |
|------|------|
| `.github/workflows/ios-build.yml` | GitHub Actions 工作流（macOS runner, Xcode 16） |
| `frontend/ExportOptions.plist` | IPA 导出配置（development/ad-hoc） |
| `.gitignore` | 排除 node_modules/dist/release4/数据库/证书 |
| `frontend/.gitignore` | 排除 *.asar 和 release4/ |

### 初始化步骤（已完成）

```bash
cd C:\Users\AI\Documents\trae_projects\app_project
git init
git add .
git commit -m "init: 手账素材库"
git remote add origin https://github.com/jwt-1994/Journal-App.git
git push -u origin main
```

### 签名配置（需要时再执行）

详细步骤见 [signing-and-testing.md](signing-and-testing.md)：

1. 注册 Apple Developer ($99/年)
2. Windows 上用 OpenSSL 生成 CSR
3. 上传 CSR 到 Apple Developer 获取证书
4. 导出 .p12 + 创建 Provisioning Profile
5. 配置 GitHub Secrets（IOS_P12_BASE64 等）
6. 手动触发 signed 构建

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

## 无 Mac 开发完整流程

```
Windows 开发 → Chrome DevTools 移动模拟调试
     │
     │ git push
     ▼
GitHub → macOS Runner 自动构建 iOS
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

## 方案对比总结

| 方案 | 成本 | 自动化 | 证书管理 | 状态 |
|------|------|--------|---------|------|
| **GitHub Actions** | 免费 | ✅ | 手动 | ✅ 已采用 |
| Codemagic | 500分钟/月免费 | ✅ | 内置 | 备选 |
| Ionic Appflow | 100次/月免费 | ✅ | 内置 | 备选 |
| 云 Mac 租赁 | $20-100/月 | 手动 | 手动 | 备选 |
| 本地 Mac | ¥2,000+ | 手动 | 手动 | 备选 |

---

## 签名与本地测试

详见 [signing-and-testing.md](signing-and-testing.md)，包含：
- OpenSSL CSR 生成步骤
- Apple Developer 证书创建流程
- GitHub Secrets 配置
- IPA 安装到 iPhone 真机的三种方式
- 本地开发调试方案
- 常见问题排查