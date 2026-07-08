## 1. 后端：背景模版模型与 API
- [ ] 创建 `backend/models.py` 中 `Background` 模型
- [ ] 创建 `backend/schemas.py` 中 Background Pydantic 模型
- [ ] 创建 `backend/routers/backgrounds.py` 路由文件
- [ ] 实现 `GET /api/backgrounds` 列表（支持 type 筛选）
- [ ] 实现 `POST /api/backgrounds` 上传背景（图片处理 + 缩略图生成）
- [ ] 实现 `DELETE /api/backgrounds/:id` 删除背景
- [ ] 实现 `GET /api/backgrounds/:id/file` 获取背景图片
- [ ] 实现 `POST /api/backgrounds/presets/init` 初始化内置模版
- [ ] 在 `backend/main.py` 注册路由
- [ ] 数据库迁移（创建 backgrounds 表）

## 2. 后端：拼贴方案模型与 API
- [ ] 创建 `backend/models.py` 中 `Collage` 模型
- [ ] 创建 `backend/schemas.py` 中 Collage Pydantic 模型
- [ ] 创建 `backend/routers/collages.py` 路由文件
- [ ] 实现 `GET /api/collages` 列表
- [ ] 实现 `POST /api/collages` 创建方案
- [ ] 实现 `GET /api/collages/:id` 获取方案详情
- [ ] 实现 `PUT /api/collages/:id` 更新方案
- [ ] 实现 `DELETE /api/collages/:id` 删除方案
- [ ] 在 `backend/main.py` 注册路由
- [ ] 数据库迁移（创建 collages 表）

## 3. 内置背景模版资源
- [ ] 创建 `backend/assets/backgrounds/presets/` 目录结构
- [ ] 生成 20+ 纯色背景图片（Python PIL 生成）
- [ ] 生成 10+ 材质纹理背景图片（程序化生成）
- [ ] 启动时检查并自动初始化内置模版

## 4. 前端：安装依赖
- [ ] `npm install react-konva konva`
- [ ] `npm install react-window`（虚拟滚动，为 P3B 做准备）

## 5. 前端：API 层更新
- [ ] 在 `frontend/src/services/api.ts` 新增背景相关 API 调用
- [ ] 在 `frontend/src/services/api.ts` 新增拼贴相关 API 调用

## 6. 前端：背景库页面
- [ ] 创建 `frontend/src/pages/BackgroundLibrary.tsx`
- [ ] 实现背景网格展示（纯色/纹理/我的 分类 Tab）
- [ ] 实现上传自定义背景功能
- [ ] 实现背景预览（点击放大）
- [ ] 实现删除自定义背景功能

## 7. 前端：拼贴编辑器页面
- [ ] 创建 `frontend/src/pages/CollageEditor.tsx`
- [ ] 三栏布局：素材面板（左）| 画布（中）| 图层面板（右）
- [ ] 素材面板：缩略图列表 + 搜索筛选 + 分类过滤
- [ ] 画布：react-konva Stage + Layer，支持缩放平移
- [ ] 拖拽素材到画布放置
- [ ] 选中素材显示变换控件（Transformer）
- [ ] 图层面板：显示图层列表，拖拽调整顺序
- [ ] 顶部工具栏：保存、加载、导出、撤销、重做
- [ ] 方案列表弹窗（加载/删除已保存方案）
- [ ] 导出为 PNG/JPEG，支持缩放比例

## 8. 前端：路由与导航
- [ ] 在 `App.tsx` 中添加 `/backgrounds` 和 `/collage` 路由
- [ ] 在侧边导航中添加"背景库"和"拼贴"菜单项

## 9. 集成测试
- [ ] 启动前后端，验证背景库（内置/上传/删除）
- [ ] 验证拼贴画布（拖拽、变换、图层、保存/加载/导出）
- [ ] 验证 Electron 打包后功能正常