# iOS 分发方案：内网测试 → App Store 上架

## 当前目标：内网测试

用户需要先在团队内部测试，不急于上架 App Store。

---

## 1. 分发方式对比

| 方式 | 设备限制 | 证书要求 | 安装方式 | 适合场景 |
|------|---------|---------|---------|---------|
| **TestFlight** | 最多 10,000 人 | Apple Developer ($99/年) | 邮件/链接邀请 | 内测 + 公测 |
| **Ad Hoc** | 最多 100 台设备 | Apple Developer | OTA 下载或 USB 安装 | 小团队内测 |
| **Enterprise** | 无限制 | Enterprise ($299/年) | OTA 下载 | 企业内部 |
| **Xcode 直连** | 连接 Mac 的设备 | 免费 Apple ID | USB 连接 | 开发调试 |

> **推荐**：注册 Apple Developer 账号（$99/年），使用 **TestFlight** 分发，兼顾内测和未来公测。

---

## 2. 内测分发流程（TestFlight）

### 步骤 1：注册 Apple Developer
```
1. 访问 developer.apple.com
2. 注册 Apple Developer Program（$99/年）
3. 等待审核通过（通常 1-2 天）
```

### 步骤 2：证书配置
```
1. Xcode → Preferences → Accounts → 添加 Apple ID
2. Xcode 自动管理签名（Automatically manage signing）
3. 创建 App ID（Bundle ID: com.sticker.material）
```

### 步骤 3：构建并上传
```bash
# 在 Mac 上
npm run build               # Vite 构建
npx cap sync ios            # 同步到 iOS
npx cap open ios            # 打开 Xcode

# Xcode 中：
# 1. 选择目标设备为 "Any iOS Device"
# 2. Product → Archive
# 3. Distribute App → TestFlight & App Store
# 4. 上传完成后在 App Store Connect 配置
```

### 步骤 4：TestFlight 配置
```
1. 登录 appstoreconnect.apple.com
2. 进入 My Apps → 你的 App
3. TestFlight 标签页：
   - 添加内部测试员（App Store Connect 用户）
   - 添加外部测试员（通过邮件邀请）
   - 设置测试信息（反馈邮箱、测试说明）
4. 测试员收到邮件 → 安装 TestFlight App → 安装测试版本
```

### 步骤 5：内测管理
```
- 每次更新重新 Archive 上传
- 版本号递增（如 1.0.0 → 1.0.1）
- TestFlight 版本有效期 90 天
- 测试员反馈通过 TestFlight App 提交
```

---

## 3. App Store 上架流程（未来）

### 3.1 上架前提条件

| 项目 | 要求 | 状态 |
|------|------|------|
| Apple Developer 账号 | $99/年 | 需注册 |
| App 完整性 | 功能完整可运行 | P4D 完成后 |
| 隐私政策 URL | 在线可访问的隐私政策页面 | 需准备 |
| 技术支持 URL | 在线可访问的联系页面 | 需准备 |
| App 截图 | 6.7" 和 6.5" 各 5 张 | 需准备 |
| App 图标 | 1024x1024 PNG | 需准备 |

### 3.2 App Store 审核要点

**常见拒绝原因**：
- 功能不完整或崩溃
- 缺少隐私政策
- 权限请求未说明用途
- 使用私有 API
- UI 不符合 iOS 设计规范
- 加载速度过慢

**我们的 App 注意事项**：
- 相机权限：需在 Info.plist 中说明用途（"用于拍摄素材"）
- 相册权限：需说明用途（"用于选择素材图片"）
- WebView 内容：不能仅是网站包装，必须有原生功能
- 登录要求：如需账号登录，提供测试账号

### 3.3 上架步骤

```
1. App Store Connect → My Apps → 新建 App
2. 填写 App 信息（名称、描述、关键词、分类）
3. 上传截图（6.7" 和 6.5" 各 5 张）
4. 设置定价（免费或有内购）
5. 填写隐私政策 URL
6. App 审核信息（测试账号、备注）
7. 提交审核（通常 1-2 天出结果）
8. 审核通过 → 发布
```

### 3.4 所需截图清单

| 尺寸 | 设备 | 用途 |
|------|------|------|
| 6.9" | iPhone 16 Pro Max | App Store 主展示 |
| 6.7" | iPhone 14/15 Pro Max | App Store 展示 |
| 6.1" | iPhone 14/15 Pro | App Store 展示 |
| 5.5" | iPhone 8 Plus | App Store（可选） |

---

## 4. 版本管理策略

```
开发版本号规则：主版本.次版本.修订号
  1.0.0  → 首次内测
  1.0.1  → 修复内测问题
  1.1.0  → 新增功能
  2.0.0  → 正式上架

TestFlight 版本号递增规则：
  1.0.0 (build 1) → 1.0.0 (build 2) → 1.0.0 (build 3)
  每次上传 build 号自动 +1
```

---

## 5. 时间线建议

| 阶段 | 时间 | 任务 |
|------|------|------|
| 第 1 周 | P4A | 注册 Apple Developer，搭建 Capacitor 项目 |
| 第 2 周 | P4B | 第一个 Xcode Archive 构建 |
| 第 3 周 | P4C | 上传 TestFlight 内测 |
| 第 4 周 | P4D | 内测反馈修复，准备 App Store 提交 |
| 第 5 周 | 上架 | 提交 App Store 审核 |