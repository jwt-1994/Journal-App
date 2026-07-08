## 1. 导航重构

- [x] 1.1 修改 AppLayout.tsx：移除"分类管理"、"背景库"、"报表看板"菜单项，新增"手账本"菜单项，将"拼贴"菜单项保留
- [x] 1.2 修改 App.tsx 路由：移除BackgroundLibrary、CategoryManagement、Dashboard 路由，新增 JournalNotebook 路由
- [x] 1.3 添加路由重定向：/ 默认跳转到 /materials

## 2. 素材库 v2

- [x] 2.1 重写 MaterialLibrary.tsx：分类标签页（Tabs）+ 搜索栏 + 排序下拉
- [x] 2.2 实现仅展示抠图后素材（has_removed_bg === 'done'），缩略图 120px 网格
- [x] 2.3 实现点击缩略图弹出大图预览 Modal（max 600px）
- [x] 2.4 实现"背景"Tab：请求 backgrounds API，展示背景缩略图
- [x] 2.5 更新 api.ts：getMaterials 默认参数 has_removed_bg=done

## 3. 上传增强

- [x] 3.1 UploadPage.tsx 增加素材名称输入框（可选）
- [x] 3.2 上传时将 name 参数传给后端 POST /api/materials

## 4. 后端适配

- [x] 4.1 POST /api/materials 支持 name 参数，存入 original_name
- [x] 4.2 GET /api/materials 默认 has_removed_bg=done（当参数未指定时）

## 5. 拼贴画布预设

- [x] 5.1 CollageEditor.tsx 画布创建界面改为预设选择器（M5/A6/A5/TN标准/TN护照/B6/方形/自定义）
- [x] 5.2 选择预设时自动填入宽高，自定义时显示输入框

## 6. 手账本

- [x] 6.1 创建 JournalNotebook.tsx：拼贴方案卡片列表
- [x] 6.2 实现方案卡片展示（名称、缩略图、创建时间、操作按钮）
- [x] 6.3 实现方案加载（点击"打开"跳转拼贴编辑器）
- [x] 6.4 实现方案删除（确认弹窗）
- [x] 6.5 实现方案重命名（内联编辑或弹窗）

## 7. 分类管理整合

- [x] 7.1 将分类管理功能（增删改查）集成到 SettingsPage.tsx

## 8. 构建验证

- [x] 8.1 TypeScript 编译检查无错误
- [x] 8.2 Vite 构建成功
- [x] 8.3 Electron 打包成功（win-unpacked）