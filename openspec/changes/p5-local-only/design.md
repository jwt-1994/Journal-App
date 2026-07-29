## 架构

```
┌──────────────────────────────────────────┐
│              iOS App (Capacitor)          │
│                                          │
│  ┌────────────────────────────────────┐  │
│  │  React UI                          │  │
│  └──────────────┬─────────────────────┘  │
│                 │                         │
│  ┌──────────────▼─────────────────────┐  │
│  │  localDB.ts (Dexie.js)            │  │
│  │  localFS.ts (Filesystem)          │  │
│  │  localThumbnail.ts (Canvas)       │  │
│  │  localPresets.ts (Canvas)         │  │
│  └────────────────────────────────────┘  │
│                 │                         │
│                 │ 仅抠图时                 │
│                 ▼                         │
│  ┌────────────────────────────────────┐  │
│  │  removeBgService.ts (axios)       │  │
│  │  POST /api/remove-bg              │  │
│  └────────────────────────────────────┘  │
└──────────────────────────────────────────┘
         │
         │ HTTP (仅抠图)
         ▼
┌──────────────────────────────────────────┐
│  抠图微服务 (FastAPI)                     │
│  POST /api/remove-bg                     │
│  - rembg 处理                             │
│  - 返回透明 PNG                           │
└──────────────────────────────────────────┘
```

## 数据层设计

### localDB.ts（Dexie.js）

```typescript
import Dexie, { Table } from 'dexie';

export interface CategoryDoc {
  id?: number; name: string; is_preset: boolean; created_at: string;
}
export interface MaterialDoc {
  id?: number; filename: string; original_name: string;
  category_id: number; file_size: number;
  file_uri: string;        // 本地文件路径（抠图结果PNG）
  created_at: string;
}
export interface BackgroundDoc {
  id?: number; name: string; type: 'preset' | 'user';
  color?: string;          // 纯色 hex
  texture_type?: string;   // 纹理类型标识 (kraft/grid/...)
  texture_uri?: string;    // 用户上传背景的本地路径
  thumbnail_uri?: string;  // 缩略图 base64
  width: number; height: number; created_at: string;
}
export interface CollageDoc {
  id?: number; name: string;
  background_id?: number;
  canvas_width: number; canvas_height: number;
  layout_data: any[];
  preview_uri?: string;
  created_at: string; updated_at: string;
}

class AppDB extends Dexie {
  categories!: Table<CategoryDoc, number>;
  materials!: Table<MaterialDoc, number>;
  backgrounds!: Table<BackgroundDoc, number>;
  collages!: Table<CollageDoc, number>;

  constructor() {
    super('HLogDB');
    this.version(1).stores({
      categories: '++id, name',
      materials: '++id, category_id, created_at',
      backgrounds: '++id, type',
      collages: '++id, created_at',
    });
  }
}

export const db = new AppDB();
```

### 文件存储（Capacitor Filesystem）

只存抠图结果，不存原图：

```
Documents/
  materials/
    {uuid}.png      ← 抠图结果（唯一存储的文件）
  backgrounds/
    user/
      {uuid}.png    ← 用户上传的背景
  collages/
    {uuid}.png      ← 拼贴预览图
```

### 素材上传流程

```
1. 用户拍照/选图 → 获取 File/Blob
2. 显示 loading，原图在内存中
3. 调用 removeBgService.upload(file) → 发送到抠图微服务
4. 抠图微服务返回透明 PNG (Blob)
5. 将透明 PNG 写入 Capacitor Filesystem → 得到 file_uri
6. 在 IndexedDB 插入 material 记录
7. 原图 Blob 释放（GC回收），不做任何持久化
8. 成功！素材库刷新
```

### 抠图微服务 API

**服务地址**：`http://{电脑IP}:8000/api/remove-bg`

**请求**：
```
POST /api/remove-bg
Content-Type: multipart/form-data
file: 图片文件
```

**响应**：
```
200 OK
Content-Type: image/png
{binary PNG data}
```

**错误响应**：
```
500 { "error": "抠图失败: ..." }
```

### 抠图服务配置

在 `removeBgService.ts` 中：

```typescript
// 抠图服务地址，可根据环境配置
const REMBG_URL = 'http://172.17.246.41:8000/api/remove-bg';

export async function removeBackground(file: File): Promise<Blob> {
  const formData = new FormData();
  formData.append('file', file);
  const resp = await fetch(REMBG_URL, {
    method: 'POST',
    body: formData,
  });
  if (!resp.ok) throw new Error('抠图失败');
  return resp.blob();
}
```

### api.ts 改造

保留原有的函数签名，内部改为本地操作，仅 `uploadMaterial` 涉及抠图网络请求：

```typescript
// 示例：上传素材
export async function uploadMaterial(file: File, categoryId: number) {
  // 1. 抠图
  const removedBgBlob = await removeBackground(file);
  // 2. 存到本地文件
  const fileUri = await saveToFilesystem(removedBgBlob, 'materials');
  // 3. 写入 IndexedDB
  const id = await db.materials.add({
    filename: `${uuid}.png`,
    original_name: file.name,
    category_id: categoryId,
    file_size: removedBgBlob.size,
    file_uri: fileUri,
    created_at: new Date().toISOString(),
  });
  return { id, ... };
}
```

### 预设数据初始化

首次启动时（`db.categories.count() === 0`）：

1. 插入 5 个预设分类：贴纸、胶带、印章、便签、背景纸
2. 插入 30 个预设背景：
   - 20 个纯色：存 `color` 字段（hex值），渲染时 Canvas 生成
   - 10 个纹理：存 `texture_type` 字段（kraft/grid/dots/...），渲染时 Canvas 生成

### 预设背景渲染

```typescript
// 纯色背景
function renderColorBg(hex: string, w: number, h: number): string {
  const canvas = document.createElement('canvas');
  canvas.width = w; canvas.height = h;
  canvas.getContext('2d')!.fillStyle = hex;
  canvas.getContext('2d')!.fillRect(0, 0, w, h);
  return canvas.toDataURL('image/png');
}

// 纹理背景（横线、网格、点阵等）
function renderTextureBg(type: string, w: number, h: number): string {
  // 复用 backend/api/backgrounds.py 的纹理逻辑，用 Canvas API 重写
}
```

### 缩略图生成

```typescript
async function generateThumbnail(fileUri: string, size: number): Promise<string> {
  // 从 Filesystem 读取文件 → Image → Canvas resize → toDataURL
  const contents = await Filesystem.readFile({ path: fileUri });
  const blob = new Blob([contents.data], { type: 'image/png' });
  const url = URL.createObjectURL(blob);
  const img = new Image();
  img.src = url;
  await new Promise(r => { img.onload = r; });
  const canvas = document.createElement('canvas');
  const ratio = Math.min(size / img.width, size / img.height);
  canvas.width = img.width * ratio;
  canvas.height = img.height * ratio;
  canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height);
  URL.revokeObjectURL(url);
  return canvas.toDataURL('image/jpeg', 0.75);
}
```

## 抠图微服务实现

保留 `backend/` 中最小化抠图服务：

```
backend/
  main.py          ← 仅 POST /api/remove-bg
  requirements.txt ← fastapi, uvicorn, rembg, pillow, python-multipart
```

```python
from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from rembg import remove
from PIL import Image
from io import BytesIO

app = FastAPI()
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

@app.post("/api/remove-bg")
async def remove_bg(file: UploadFile = File(...)):
    contents = await file.read()
    img = Image.open(BytesIO(contents))
    result = remove(img)
    buf = BytesIO()
    result.save(buf, format="PNG")
    buf.seek(0)
    return Response(content=buf.read(), media_type="image/png")
```

## 依赖变化

### 新增
- `dexie` - IndexedDB 封装
- `@capacitor/filesystem` - 文件系统 API

### 移除
- `axios` - 不再需要（抠图用原生 fetch）
- `rembg` 相关前端依赖 - 无

## 构建流程

GitHub Actions 只构建前端 IPA，不需要后端部署。