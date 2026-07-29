// 本地数据层：IndexedDB + Capacitor Filesystem + 抠图微服务
// 所有数据存储在手机本地，仅上传素材时调用抠图服务

import { db, initPresets } from './localDB';
import type { CollageDoc } from './localDB';
import { saveFile, readFileAsBlob, readFileAsDataUrl, deleteFile } from './localFS';
import { generateThumbnail } from './localThumbnail';
import { renderColorBg, renderTextureBg } from './localPresets';
import { removeBackground } from './removeBgService';

// ---- 初始化 ----
let initialized = false;
async function ensureInit() {
  if (!initialized) {
    await initPresets();
    initialized = true;
  }
}

// ---- 分类 ----
export async function getCategories() {
  await ensureInit();
  const cats = await db.categories.toArray();
  const enriched = await Promise.all(cats.map(async c => ({
    id: c.id!,
    name: c.name,
    is_preset: c.is_preset,
    created_at: c.created_at,
    material_count: await db.materials.where('category_id').equals(c.id!).count(),
  })));
  return { data: enriched };
}

export async function createCategory(name: string) {
  await ensureInit();
  const existing = await db.categories.where('name').equals(name).first();
  if (existing) throw new Error('该分类已存在');
  const id = await db.categories.add({
    name, is_preset: false,
    created_at: new Date().toISOString(),
  });
  return { data: { id, name, is_preset: false } };
}

export async function deleteCategory(id: number) {
  const cat = await db.categories.get(id);
  if (!cat) throw new Error('分类不存在');
  if (cat.is_preset) throw new Error('预设分类不可删除');
  const materials = await db.materials.where('category_id').equals(id).count();
  if (materials > 0) throw new Error('该分类下还有素材');
  await db.categories.delete(id);
  return { data: { message: '删除成功' } };
}

// ---- 素材 ----
export async function uploadMaterial(
  file: File,
  categoryId: number,
  autoRemoveBg = true,
  name = '',
) {
  await ensureInit();

  // 1. 抠图（如果启用）
  let resultBlob: Blob;
  if (autoRemoveBg) {
    try {
      resultBlob = await removeBackground(file);
    } catch {
      throw new Error('抠图服务不可用，请检查电脑上的抠图服务是否启动');
    }
  } else {
    resultBlob = file;
  }

  // 2. 保存到本地文件系统（只存抠图结果）
  const { uri, filename } = await saveFile(resultBlob, 'materials', 'png');

  // 3. 写入 IndexedDB
  const id = await db.materials.add({
    filename,
    original_name: name.trim() || file.name,
    category_id: categoryId,
    file_size: resultBlob.size,
    file_uri: uri,
    created_at: new Date().toISOString(),
  });

  return { data: { id, filename, original_name: name.trim() || file.name, category_id: categoryId } };
}

export async function uploadMaterialsBatch(
  files: File[],
  categoryId: number,
  autoRemoveBg = true,
  name = '',
) {
  const results: { success: boolean; id?: number; name: string; error?: string }[] = [];
  for (const file of files) {
    try {
      const res = await uploadMaterial(file, categoryId, autoRemoveBg, name);
      results.push({ success: true, id: res.data.id, name: name || file.name });
    } catch (e: any) {
      results.push({ success: false, name: file.name, error: e.message || '上传失败' });
    }
  }
  return { data: { results } };
}

export async function getMaterials(params: {
  page?: number;
  page_size?: number;
  category_id?: number;
  search?: string;
  bg_status?: string;
  sort_by?: string;
  sort_order?: string;
}) {
  await ensureInit();
  let collection = db.materials.orderBy('created_at');

  // 排序
  if (params.sort_order === 'asc') {
    collection = db.materials.orderBy('created_at');
  } else {
    collection = db.materials.reverse();
  }

  let items = await collection.toArray();

  // 分类筛选
  if (params.category_id !== undefined) {
    items = items.filter(m => m.category_id === params.category_id);
  }

  // 搜索
  if (params.search) {
    const q = params.search.toLowerCase();
    items = items.filter(m => m.original_name.toLowerCase().includes(q));
  }

  // 关联分类名称
  const categories = await db.categories.toArray();
  const catMap = new Map(categories.map(c => [c.id!, c.name]));

  const enriched = items.map(m => ({
    id: m.id!,
    filename: m.filename,
    original_name: m.original_name,
    category_id: m.category_id,
    category_name: catMap.get(m.category_id) || '',
    file_size: m.file_size,
    file_path: m.file_uri, // 兼容旧字段
    has_removed_bg: 'done', // 本地存储的都是抠图结果
    removed_bg_path: m.file_uri,
    created_at: m.created_at,
  }));

  // 分页
  const page = params.page || 1;
  const pageSize = params.page_size || 20;
  const total = enriched.length;
  const paged = enriched.slice((page - 1) * pageSize, page * pageSize);

  return { data: { total, page, page_size: pageSize, items: paged } };
}

export async function getMaterial(id: number) {
  await ensureInit();
  const m = await db.materials.get(id);
  if (!m) throw new Error('素材不存在');
  const cat = await db.categories.get(m.category_id);
  return {
    data: {
      id: m.id!,
      filename: m.filename,
      original_name: m.original_name,
      category_id: m.category_id,
      category_name: cat?.name || '',
      file_size: m.file_size,
      file_path: m.file_uri,
      has_removed_bg: 'done',
      removed_bg_path: m.file_uri,
      created_at: m.created_at,
    },
  };
}

export async function getMaterialFileUrl(id: number): Promise<string> {
  await ensureInit();
  const m = await db.materials.get(id);
  if (!m) return '';
  return readFileAsDataUrl(m.file_uri);
}

export async function getMaterialThumbUrl(id: number, size = 200): Promise<string> {
  await ensureInit();
  const m = await db.materials.get(id);
  if (!m) return '';
  return generateThumbnail(m.file_uri, size);
}

export async function getRemovedFileUrl(id: number): Promise<string> {
  return getMaterialFileUrl(id); // 本地存储的都是抠图结果
}

export async function loadMaterialImage(id: number, _useRemovedBg: boolean): Promise<string> {
  await ensureInit();
  const m = await db.materials.get(id);
  if (!m) throw new Error('素材不存在');
  const blob = await readFileAsBlob(m.file_uri);
  return URL.createObjectURL(blob);
}

export async function deleteMaterial(id: number) {
  const m = await db.materials.get(id);
  if (!m) throw new Error('素材不存在');
  await deleteFile(m.file_uri);
  await db.materials.delete(id);
  return { data: { message: '删除成功' } };
}

export async function batchDelete(ids: number[]) {
  let deleted = 0;
  for (const id of ids) {
    try {
      await deleteMaterial(id);
      deleted++;
    } catch { /* skip */ }
  }
  return { data: { deleted, total: ids.length } };
}

// 以下两个函数为兼容旧接口，本地不需要
export function getRemovalStatus(_id: number) {
  return Promise.resolve({ data: { status: 'done' } });
}
export function retryRemoval(_id: number) {
  return Promise.resolve({ data: { status: 'done' } });
}
export function batchRemoveBg(_ids: number[]) {
  return Promise.resolve({ data: { triggered: 0, total: _ids.length } });
}

// ---- 背景 ----
export async function getBackgrounds(_type?: string) {
  await ensureInit();
  const bgs = await db.backgrounds.toArray();
  return {
    data: bgs.map(b => ({
      id: b.id!,
      name: b.name,
      type: b.type,
      color: b.color || null,
      texture_type: b.texture_type || null,
      width: b.width,
      height: b.height,
      created_at: b.created_at,
    })),
  };
}

export async function getBackgroundFileUrl(id: number): Promise<string> {
  await ensureInit();
  const bg = await db.backgrounds.get(id);
  if (!bg) return '';

  // 预设纹理：Canvas 动态生成
  if (bg.type === 'preset' && bg.texture_type) {
    return renderTextureBg(bg.texture_type, bg.width, bg.height);
  }
  // 预设纯色：Canvas 动态生成
  if (bg.type === 'preset' && bg.color) {
    return renderColorBg(bg.color, bg.width, bg.height);
  }
  // 用户上传
  if (bg.texture_uri) {
    return readFileAsDataUrl(bg.texture_uri);
  }
  return '';
}

export async function createBackground(file: File) {
  await ensureInit();
  const { uri } = await saveFile(file, 'backgrounds', 'png');
  const thumb = await generateThumbnail(uri, 320);
  const id = await db.backgrounds.add({
    name: file.name.replace(/\.[^.]+$/, ''),
    type: 'user',
    texture_uri: uri,
    thumbnail_uri: thumb,
    width: 1920,
    height: 1080,
    created_at: new Date().toISOString(),
  });
  return { data: { id, name: file.name } };
}

export async function deleteBackground(id: number) {
  const bg = await db.backgrounds.get(id);
  if (!bg) throw new Error('背景不存在');
  if (bg.type === 'preset') throw new Error('内置背景不可删除');
  if (bg.texture_uri) await deleteFile(bg.texture_uri);
  await db.backgrounds.delete(id);
  return { data: { message: '删除成功' } };
}

// ---- 拼贴方案 ----
export async function getCollages() {
  await ensureInit();
  const collages = await db.collages.orderBy('updated_at').reverse().toArray();
  return { data: collages.map(c => ({ ...c, id: c.id!, background_id: c.background_id ?? null })) };
}

export async function getCollage(id: number) {
  const c = await db.collages.get(id);
  if (!c) throw new Error('方案不存在');
  return { data: { ...c, id: c.id!, background_id: c.background_id ?? null } };
}

export async function createCollage(data: {
  name: string;
  background_id?: number;
  canvas_width?: number;
  canvas_height?: number;
  layout_data?: unknown[];
}) {
  await ensureInit();
  const now = new Date().toISOString();
  const id = await db.collages.add({
    name: data.name,
    background_id: data.background_id,
    canvas_width: data.canvas_width || 1080,
    canvas_height: data.canvas_height || 1920,
    layout_data: data.layout_data || [],
    created_at: now,
    updated_at: now,
  });
  return { data: { id } };
}

export async function updateCollage(id: number, data: {
  name?: string;
  background_id?: number;
  layout_data?: unknown[];
  preview_path?: string;
}) {
  const c = await db.collages.get(id);
  if (!c) throw new Error('方案不存在');
  const updates: Partial<CollageDoc> = { updated_at: new Date().toISOString() };
  if (data.name !== undefined) updates.name = data.name;
  if (data.background_id !== undefined) updates.background_id = data.background_id;
  if (data.layout_data !== undefined) updates.layout_data = data.layout_data;
  if (data.preview_path !== undefined) updates.preview_uri = data.preview_path;
  await db.collages.update(id, updates);
  return { data: { message: '更新成功' } };
}

export async function deleteCollage(id: number) {
  await db.collages.delete(id);
  return { data: { message: '删除成功' } };
}

export async function renameCollage(id: number, name: string) {
  return updateCollage(id, { name });
}

// ---- 报表（本地简化版） ----
export async function getDashboardStats() {
  await ensureInit();
  const matCount = await db.materials.count();
  const catCount = await db.categories.count();
  const collCount = await db.collages.count();

  // 分类统计
  const cats = await db.categories.toArray();
  const category_stats = await Promise.all(
    cats.map(async c => ({
      name: c.name,
      count: await db.materials.where('category_id').equals(c.id!).count(),
    }))
  );

  // 计算总文件大小
  const allMats = await db.materials.toArray();
  const total_size_bytes = allMats.reduce((sum, m) => sum + (m.file_size || 0), 0);

  return {
    data: {
      total_materials: matCount,
      total_categories: catCount,
      total_collages: collCount,
      category_stats,
      total_size_bytes,
      bg_status_stats: { none: 0, processing: 0, done: matCount, failed: 0 },
    },
  };
}

export async function getDashboardRecent(limit = 10) {
  await ensureInit();
  const items = await db.materials.orderBy('created_at').reverse().limit(limit).toArray();
  const cats = await db.categories.toArray();
  const catMap = new Map(cats.map(c => [c.id!, c.name]));
  return {
    data: items.map(m => ({
      id: m.id!,
      filename: m.filename,
      original_name: m.original_name,
      category_name: catMap.get(m.category_id) || '',
      file_size: m.file_size,
      created_at: m.created_at,
    })),
  };
}

export async function getUploadTrend(days = 7) {
  await ensureInit();
  const result: { date: string; count: number }[] = [];
  const now = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().slice(0, 10);
    result.push({ date: dateStr, count: 0 });
  }

  // 按日期统计
  const mats = await db.materials.toArray();
  const dateCounts = new Map<string, number>();
  mats.forEach(m => {
    const date = m.created_at.slice(0, 10);
    dateCounts.set(date, (dateCounts.get(date) || 0) + 1);
  });

  result.forEach(r => {
    r.count = dateCounts.get(r.date) || 0;
  });

  return { data: result };
}