## Context

P3.1 重构已上线，当前拼贴编辑器支持 select/brush/rect/text 四种工具，但图形只有矩形，所有工具颜色固定。素材库卡片展示过多信息（分类标签、文件大小），且导航切换时拼贴状态丢失。

## Goals / Non-Goals

**Goals:**
- 素材卡片只显示名称、居中
- 拼贴新增圆形和椭圆工具
- 所有绘制工具（画笔、矩形、圆形、文字）支持颜色选择
- 拼贴页面路由切换后再返回时状态保持
- 背景选择器显示缩略图参考

**Non-Goals:**
- 不改变拼贴方案的保存/加载逻辑
- 不新增更多图形类型（三角形、多边形等）

## Decisions

### 1. 拼贴状态保持方案

**决定：** 将 CollageEditor 的 `showCanvasSetup` 状态改为 sessionStorage 持久化，画布状态（elements、canvasW/H等）使用 React state 配合路由守卫保持。

**具体做法：** 在 AppLayout 中不对 CollageEditor 路由使用 `<Outlet />` 的默认卸载行为。改为在 CollageEditor 组件内使用 `useRef` 存储关键状态，或在 App.tsx 中将 CollageEditor 挂在 Layout 外部（始终渲染，CSS 控制显示）。

**备选方案：** 使用 Redux/Zustand 全局状态 → 过度设计，当前只需一个组件保持渲染即可。

**实际方案：** 将 CollageEditor 移出 `<Outlet />` 路由，在 AppLayout 中独立渲染，用 `location.pathname` 控制 visible。这样切换路由时组件不卸载，状态自然保持。

### 2. 图形扩展

**决定：** 在现有 rect 工具基础上新增 circle 工具，统一为一个 `shape` 工具 + 子类型选择器（矩形/圆形/椭圆）。

Tool 列表更新为：select / brush / shape / text

Shape 工具选中后，右侧属性面板或工具栏显示子类型：矩形 | 圆形 | 椭圆。

### 3. 颜色选择器

**决定：** 工具栏增加全局颜色选择器（ColorPicker），所有绘制工具（brush、shape、text）共用当前颜色。选中已有元素时，属性面板可单独修改该元素的颜色。

工具栏布局调整为：
```
[select] [brush] [shape] [text] | [颜色选择器] [线宽] | [撤销] [重做] | [+素材] [背景] [保存] [导出]
```

### 4. 背景选择预览

**决定：** 背景选择从 Select 下拉改为 Radio 卡片组，每个卡片显示：
- 缩略图（请求 backgrounds API 返回的图片）
- 名称

画布创建界面和编辑器内背景切换都使用此组件。

## Risks / Trade-offs

- **风险：** CollageEditor 移出 Outlet 后，路由结构变化可能影响其他页面 → **缓解：** 在 AppLayout 中单独处理 CollageEditor 的显示，其余页面仍走 Outlet