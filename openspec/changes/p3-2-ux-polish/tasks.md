## 1. 素材卡片精简

- [x] 1.1 MaterialLibrary.tsx 移除分类 Tag 标签和文件大小显示
- [x] 1.2 名称居中显示，单行溢出省略

## 2. 拼贴图形和颜色

- [x] 2.1 CollageEditor.tsx 新增 shape 工具，子类型：矩形/圆形/椭圆
- [x] 2.2 工具栏新增全局颜色选择器（Ant Design ColorPicker）
- [x] 2.3 画笔、图形、文字绘制时使用全局颜色
- [x] 2.4 右侧属性面板支持修改选中元素的颜色
- [x] 2.5 圆形和椭圆元素支持保存/加载（添加到 layout_data）
- [x] 2.6 实现圆形和椭圆的 Konva 渲染（Circle + Ellipse）
- [x] 2.7 实现圆形和椭圆的 Transformer 变换（缩放/旋转）

## 3. 拼贴状态保持

- [x] 3.1 修改 App.tsx 和 AppLayout.tsx，CollageEditor 移出 Outlet 路由
- [x] 3.2 AppLayout 中根据 location.pathname 控制 CollageEditor 的 display
- [x] 3.3 验证：切换导航后返回拼贴，画布状态不丢失

## 4. 背景选择预览

- [x] 4.1 画布创建界面：背景选择改为卡片网格 + 缩略图
- [x] 4.2 编辑器内背景切换：改为 Popover + 卡片网格

## 5. 构建验证

- [x] 5.1 TypeScript 编译检查
- [x] 5.2 Vite 构建成功
- [x] 5.3 Electron 打包成功