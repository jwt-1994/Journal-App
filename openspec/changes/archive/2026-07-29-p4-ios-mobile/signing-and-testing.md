# iOS 签名与本地测试方案

> 适用场景：Windows 开发环境，无 Mac，通过 GitHub Actions 云端构建

---

## 一、整体流程总览

```
┌──────────────────────────────────────────────────────────────────┐
│                    Windows 开发机                                 │
│                                                                  │
│  1. 生成 CSR 证书请求 (OpenSSL)                                   │
│  2. 上传 CSR 到 Apple Developer → 下载 .cer 证书                  │
│  3. 导出 .p12 私钥证书 (Windows 证书管理器)                        │
│  4. 下载 .mobileprovision 描述文件                                 │
│  5. 将证书和描述文件配置到 GitHub Secrets                          │
│  6. git push → GitHub Actions 自动构建签名 IPA                     │
│  7. 下载 IPA → 安装到 iPhone 真机测试                              │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

---

## 二、前置条件

| 条件 | 说明 |
|------|------|
| Apple ID | 普通 Apple ID 即可（免费） |
| Apple Developer 账号 | $99/年，用于签名分发 |
| iPhone 真机 | iOS 16+ 用于测试 |
| Windows 安装 OpenSSL | 用于生成 CSR 证书 |
| GitHub 仓库 | 已推送代码 |

---

## 三、签名证书获取（Windows 操作）

### 步骤 1：安装 OpenSSL

下载 Win64 OpenSSL：https://slproweb.com/products/Win32OpenSSL.html

选择 **Win64 OpenSSL v3.x Light** (EXE)，安装到默认路径（`C:\Program Files\OpenSSL-Win64\bin`）。

验证安装：

```powershell
& "C:\Program Files\OpenSSL-Win64\bin\openssl.exe" version
```

### 步骤 2：生成 CSR 证书请求

```powershell
# 创建证书目录
mkdir C:\Users\AI\Documents\trae_projects\app_project\certs

# 生成 2048 位 RSA 私钥
& "C:\Program Files\OpenSSL-Win64\bin\openssl.exe" genrsa `
  -out C:\Users\AI\Documents\trae_projects\app_project\certs\ios_distribution.key 2048

# 生成 CSR 证书签名请求
& "C:\Program Files\OpenSSL-Win64\bin\openssl.exe" req -new `
  -key C:\Users\AI\Documents\trae_projects\app_project\certs\ios_distribution.key `
  -out C:\Users\AI\Documents\trae_projects\app_project\certs\ios_distribution.csr `
  -subj "/emailAddress=jwt19940124@gmail.com/CN=JWT/OU=Development/C=CN"
```

得到两个文件：
- `certs/ios_distribution.key` — 私钥（**妥善保管，不要提交到 Git**）
- `certs/ios_distribution.csr` — 证书签名请求

### 步骤 3：在 Apple Developer 创建证书

1. 登录 https://developer.apple.com/account/resources/certificates
2. 点击 **+** 创建新证书
3. 选择 **iOS Distribution (App Store and Ad Hoc)** → Continue
4. 上传刚才生成的 `ios_distribution.csr` 文件
5. 下载 `.cer` 证书文件到 `certs/` 目录

### 步骤 4：安装证书到 Windows 并导出 p12

```powershell
# 双击下载的 .cer 文件，安装到"当前用户"→"个人"存储

# 或者用命令行安装
certutil -user -addstore "My" C:\Users\AI\Documents\trae_projects\app_project\certs\ios_distribution.cer
```

安装后导出 p12：

```powershell
# 1. 打开证书管理器
certmgr.msc

# 2. 导航到：个人 → 证书
# 3. 找到刚安装的证书（Issued To: JWT）
# 4. 右键 → 所有任务 → 导出
# 5. 选择"是，导出私钥"
# 6. 格式选"个人信息交换 - PKCS #12 (.PFX)"
# 7. 勾选"如果可能，则包括证书路径中的所有证书"
# 8. 设置密码（牢记，后面需要用到）
# 9. 保存为 certs/ios_distribution.p12
```

### 步骤 5：创建 App ID

1. 打开 https://developer.apple.com/account/resources/identifiers
2. 点击 **+** → App IDs
3. Type: **App**
4. Description: `Journal App`
5. Bundle ID: **Explicit** → `com.sticker.material`
6. 勾选需要的 Capabilities（至少勾选 Push Notifications 如果后期需要）
7. 点击 Continue → Register

### 步骤 6：添加测试设备 UDID

1. 在 iPhone 上获取 UDID：
   - 用数据线连接 iPhone 到 Windows
   - 打开 iTunes（Windows 版）→ 点击设备图标 → 点击序列号切换到 UDID
   - 或访问 https://get.udid.io/ 用 Safari 打开获取
2. 登录 https://developer.apple.com/account/resources/devices
3. 点击 **+** → 输入设备名称和 UDID → Continue

### 步骤 7：创建 Provisioning Profile

**开发测试用（Ad Hoc）：**

1. 打开 https://developer.apple.com/account/resources/profiles
2. 点击 **+** → 选择 **iOS App Development**（开发测试）
3. 选择 App ID: `com.sticker.material`
4. 选择证书（刚才创建的）
5. 选择测试设备（刚才添加的）
6. 命名: `Journal App Development`
7. 下载 `.mobileprovision` 文件到 `certs/`

---

## 四、配置 GitHub Actions 签名

### 步骤 8：将证书转为 Base64

```powershell
# p12 证书 Base64
certutil -encode C:\Users\AI\Documents\trae_projects\app_project\certs\ios_distribution.p12 C:\Users\AI\Documents\trae_projects\app_project\certs\ios_distribution.p12.b64
# 复制 .b64 文件内容（去掉 ----BEGIN/END CERTIFICATE---- 行，合并为一行）

# mobileprovision 描述文件 Base64
certutil -encode C:\Users\AI\Documents\trae_projects\app_project\certs\Journal_App_Development.mobileprovision C:\Users\AI\Documents\trae_projects\app_project\certs\profile.b64
# 复制 .b64 文件内容
```

### 步骤 9：添加 GitHub Secrets

打开 https://github.com/jwt-1994/Journal-App/settings/secrets/actions

| Secret Name | 值 | 说明 |
|---|---|---|
| `IOS_P12_BASE64` | p12 文件的 base64 内容 | 证书 |
| `IOS_P12_PASSWORD` | 导出 p12 时设置的密码 | 证书密码 |
| `IOS_PROVISIONING_PROFILE_BASE64` | mobileprovision 的 base64 内容 | 描述文件 |
| `IOS_PROVISIONING_PROFILE_NAME` | 文件名（如 `Journal_App_Development`） | 描述文件名称 |
| `IOS_CODE_SIGN_IDENTITY` | 证书名称 | 见下方说明 |
| `IOS_TEAM_ID` | Apple Developer Team ID | 见下方说明 |

**如何获取 Team ID：**
- 登录 https://developer.apple.com/account
- 在 Membership 页面查看 Team ID

**如何获取 Code Sign Identity：**
```powershell
certutil -store My
# 找到 "颁发给" 字段，如 "iPhone Distribution: JWT (XXXXXXXXXX)"
# 完整复制这个名称
```

### 步骤 10：触发签名构建

1. 打开 https://github.com/jwt-1994/Journal-App/actions
2. 点击 **Build iOS** → **Run workflow**
3. `build_type` 选择 **signed**
4. 点击 **Run workflow**
5. 等待 10-15 分钟
6. 在构建完成的 run 页面底部下载 `ios-signed-ipa` Artifact
7. 解压得到 `.ipa` 文件

---

## 五、iPhone 真机安装测试

### 方式 A：Apple Configurator（推荐，免费）

1. 在 Windows 安装 **Apple Devices** App（Microsoft Store 搜索）
2. 数据线连接 iPhone 到电脑
3. 在 iPhone 上信任此电脑
4. 打开 Apple Devices → 选择设备 → 安装 App → 选择 `.ipa` 文件
5. 安装完成后，在 iPhone 上：
   - 设置 → 通用 → VPN 与设备管理
   - 点击开发者证书 → 信任
6. 回到桌面，点击 App 图标启动

### 方式 B：OTA 无线分发（通过 HTTPS）

1. 将 `.ipa` 和 `.mobileprovision` 上传到支持 HTTPS 的服务器
2. 创建 `manifest.plist`：

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>items</key>
    <array>
        <dict>
            <key>assets</key>
            <array>
                <dict>
                    <key>kind</key>
                    <string>software-package</string>
                    <key>url</key>
                    <string>https://your-server.com/App.ipa</string>
                </dict>
            </array>
            <key>metadata</key>
            <dict>
                <key>bundle-identifier</key>
                <string>com.sticker.material</string>
                <key>bundle-version</key>
                <string>1.0.0</string>
                <key>kind</key>
                <string>software</string>
                <key>title</key>
                <string>手账素材库</string>
            </dict>
        </dict>
    </array>
</dict>
</plist>
```

3. 生成安装链接：
```
itms-services://?action=download-manifest&url=https://your-server.com/manifest.plist
```

4. iPhone 用 Safari 打开链接即可安装

### 方式 C：TestFlight（正式分发，推荐）

1. 构建时选择 `upload_to_testflight: true`
2. 配置 App Store Connect API Key（见附录）
3. 构建完成后自动上传到 TestFlight
4. 在 App Store Connect 添加测试人员邮箱
5. 测试人员在 iPhone 安装 TestFlight App 接收邀请

---

## 六、本地开发调试（无需 Mac）

### 6.1 Chrome DevTools 移动模拟（主力调试）

```
F12 → Toggle Device Toolbar (Ctrl+Shift+M)
→ 选择 iPhone 15 Pro (390×844)
→ 打开 Touch 模拟（鼠标模拟触控）
```

可调试内容：
- 所有 UI 布局和样式
- 触控手势（单击/双击/长按/双指）
- 网络请求和离线检测
- localStorage 存储
- 页面路由切换

### 6.2 Vite 局域网访问（手机浏览器预览）

```powershell
cd C:\Users\AI\Documents\trae_projects\app_project\frontend
npm run dev -- --host 0.0.0.0
```

然后在 iPhone Safari 打开 `http://你的IP:5173` 即可在手机上预览 Web 版。

**确保手机和电脑在同一 WiFi 下。**

### 6.3 无法在浏览器调试的功能

以下功能必须通过真机 IPC 测试：
- 原生相机拍照
- 系统相册选择
- 触觉反馈（Haptics）
- 状态栏样式
- 启动画面

---

## 七、常见问题

### Q1: 证书过期了怎么办？

Apple Developer 证书有效期 1 年。过期前：
1. 重新生成 CSR → 创建新证书 → 导出新 p12
2. 更新 GitHub Secrets
3. 重新触发构建

### Q2: 设备 UDID 没注册，安装失败

每次添加新测试设备都需要：
1. 在 Apple Developer 添加设备 UDID
2. 重新生成 Provisioning Profile（包含新设备）
3. 更新 GitHub Secrets 中的 `IOS_PROVISIONING_PROFILE_BASE64`
4. 重新构建 IPA

### Q3: "Untrusted Developer" 无法打开 App

iPhone 上：设置 → 通用 → VPN 与设备管理 → 点击证书 → 信任

### Q4: GitHub Actions 构建失败 "Code Signing Error"

检查：
- `IOS_P12_PASSWORD` 是否正确
- `IOS_CODE_SIGN_IDENTITY` 是否与证书完全匹配
- `IOS_TEAM_ID` 是否正确
- Provisioning Profile 是否包含 App ID 和当前设备 UDID

### Q5: Windows 没有 iTunes 怎么连 iPhone？

安装 **Apple Devices** App（Microsoft Store 免费），替代 iTunes 管理设备。

---

## 八、附录：App Store Connect API Key 配置

用于自动上传 TestFlight，可选。

### 创建 API Key

1. 登录 https://appstoreconnect.apple.com
2. Users and Access → Integrations → Keys
3. 点击 **+** → 命名 `CI/CD` → 选择 **Developer** 权限
4. 下载 `.p8` 文件

### 添加 GitHub Secrets

| Secret Name | 值 |
|---|---|
| `APP_STORE_CONNECT_KEY_ID` | Key ID（如 `ABC1234567`） |
| `APP_STORE_CONNECT_ISSUER_ID` | Issuer ID（在 Keys 页面顶部） |
| `APP_STORE_CONNECT_KEY` | `.p8` 文件全部内容 |

配置后，构建时设置 `upload_to_testflight: true` 即可自动上传。

---

## 九、快速参考卡片

```
证书获取流程（一次性）：
Register Apple Developer ($99) → Generate CSR → Upload CSR → 
Download .cer → Install + Export .p12 → Create App ID → 
Add Device UDID → Create Provisioning Profile → Download .mobileprovision

每次构建流程：
Base64 Encode .p12 + .mobileprovision → Set GitHub Secrets →
git push → GitHub Actions Build → Download IPA → Install to iPhone

新增测试设备：
Add Device UDID → Regenerate Provisioning Profile → 
Update GitHub Secrets → Rebuild IPA
```