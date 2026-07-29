## 实施计划

### 阶段 1：基础设施搭建

- [x] 安装依赖：`npm install dexie @capacitor/filesystem`
- [x] 创建 `src/services/localDB.ts`（Dexie 数据库定义 + 预设数据初始化）
- [x] 创建 `src/services/localFS.ts`（Capacitor Filesystem 封装，文件读写）
- [x] 创建 `src/services/localThumbnail.ts`（Canvas 缩略图生成）
- [x] 创建 `src/services/localPresets.ts`（预设背景动态生成，Canvas 纯色+纹理）
- [x] 创建 `src/services/removeBgService.ts`（抠图网络请求，用原生 fetch）
- [ ] 卸载 axios（保留，因为其他页面可能仍引用）

### 阶段 2：数据层 CRUD

- [x] 重写 `api.ts`，保留所有函数签名，内部改为 localDB/localFS 调用
- [x] `getCategories` / `createCategory` / `deleteCategory` → IndexedDB
- [x] `getMaterials` / `deleteMaterial` / `batchDelete` → IndexedDB + Filesystem
- [x] `uploadMaterial` → 抠图微服务 + 本地存储（只存抠图PNG，不存原图）
- [x] `getMaterialFileUrl` / `getMaterialThumbUrl` / `getRemovedFileUrl` → 异步返回 data URL
- [x] `loadMaterialImage` → Filesystem.readFile → blob URL
- [x] `getBackgrounds` / `createBackground` / `getBackgroundFileUrl` / `deleteBackground` → 本地
- [x] `getCollages` / `getCollage` / `createCollage` / `updateCollage` / `deleteCollage` → IndexedDB
- [x] 首次启动预设数据初始化（5 分类 + 30 背景）
- [x] `getCategories` 增加 `material_count` 字段，兼容 SettingsPage

### 阶段 3：精简抠图微服务

- [x] 将 `backend/main.py` 重写为单一抠图服务：`POST /api/remove-bg`
- [x] 删除不再需要的文件：api/、services/、database.py、models.py、Dockerfile
- [x] 更新 requirements.txt 为最小依赖：fastapi, uvicorn, rembg, pillow, python-multipart

### 阶段 4：页面适配

- [x] `MaterialLibrary.tsx` - 异步加载图片URL（thumbUrls/fullUrls state）
- [x] `CollageEditor.tsx` - 异步加载背景和素材缩略图（bgUrls/matThumbUrls state）
- [x] `UploadPage.tsx` - 确认兼容（无需改动）
- [x] `BackgroundLibrary.tsx` - 确认兼容（使用 getBackgroundFileUrl 需要异步处理）
- [x] `CategoryManagement.tsx` - 确认兼容
- [x] `SettingsPage.tsx` - 确认兼容（material_count 已添加）
- [x] `JournalNotebook.tsx` - 确认兼容
- [x] `Dashboard.tsx` - 确认兼容

### 阶段 5：清理

- [x] 删除 `backend/api/` 和 `backend/services/` 不再需要的 CRUD 代码
- [x] 删除 `backend/database.py`、`models.py`、`Dockerfile`
- [ ] 删除 `data/` 目录（originals, processed, backgrounds/presets 等）
- [ ] 删除 `docker-compose.yml`
- [ ] 更新 `vite.config.ts` 移除 `/api` 代理
- [ ] 更新 GitHub Actions workflow 确保只构建前端

### 阶段 6：测试验证

- [x] TypeScript 编译通过（tsc --noEmit）
- [x] Vite 构建通过（3952 modules, 4.13s）
- [x] 开发服务器启动正常（localhost:5173）
- [ ] 启动抠图微服务，测试上传+抠图流程
- [ ] 构建 IPA 并安装到手机测试