import Dexie, { Table } from 'dexie';

export interface CategoryDoc {
  id?: number;
  name: string;
  is_preset: boolean;
  created_at: string;
}

export interface MaterialDoc {
  id?: number;
  filename: string;
  original_name: string;
  category_id: number;
  file_size: number;
  file_uri: string; // 本地文件路径（抠图结果PNG）
  created_at: string;
}

export interface BackgroundDoc {
  id?: number;
  name: string;
  type: 'preset' | 'user';
  color?: string; // 纯色 hex
  texture_type?: string; // 纹理类型标识，如 kraft/grid/dots
  texture_uri?: string; // 用户上传背景的本地路径
  thumbnail_uri?: string; // 缩略图 base64
  width: number;
  height: number;
  created_at: string;
}

export interface CollageDoc {
  id?: number;
  name: string;
  background_id?: number;
  canvas_width: number;
  canvas_height: number;
  layout_data: unknown[];
  preview_uri?: string;
  created_at: string;
  updated_at: string;
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

// ---- 预设数据初始化 ----

const PRESET_CATEGORIES = ['贴纸', '胶带', '印章', '便签', '背景纸'];

const PRESET_COLORS: [string, string][] = [
  ['纯白', '#FFFFFF'], ['米白', '#FAF8F5'], ['浅粉', '#FFE4E1'],
  ['樱花粉', '#FFB7C5'], ['浅蓝', '#E0F0FF'], ['天空蓝', '#B3D9FF'],
  ['牛油果绿', '#E8F5E9'], ['薄荷绿', '#C8E6C9'], ['奶油黄', '#FFF9C4'],
  ['薰衣草紫', '#F3E5F5'], ['浅灰', '#F5F5F5'], ['暖灰', '#E8E5E0'],
  ['卡其', '#F5F0E8'], ['蜜桃', '#FFDAB9'], ['浅杏', '#FFE5CC'],
  ['淡茶', '#EFEBE9'], ['雾蓝', '#D6E4F0'], ['藕粉', '#F0E0E0'],
  ['奶绿', '#E8ECD6'], ['浅橙', '#FFE0B2'],
];

const PRESET_TEXTURES: [string, string][] = [
  ['牛皮纸', 'kraft'], ['网格', 'grid'], ['水彩', 'watercolor'],
  ['布纹', 'fabric'], ['木纹', 'wood'], ['大理石', 'marble'],
  ['点阵', 'dots'], ['方格', 'squares'], ['横线', 'lines'],
  ['空白', 'blank'],
];

export async function initPresets(): Promise<void> {
  const catCount = await db.categories.count();
  if (catCount === 0) {
    const now = new Date().toISOString();
    for (const name of PRESET_CATEGORIES) {
      await db.categories.add({ name, is_preset: true, created_at: now });
    }
  }

  const bgCount = await db.backgrounds.count();
  if (bgCount === 0) {
    const now = new Date().toISOString();
    for (const [name, hex] of PRESET_COLORS) {
      await db.backgrounds.add({
        name, type: 'preset', color: hex,
        width: 1920, height: 1080, created_at: now,
      });
    }
    for (const [name, textureType] of PRESET_TEXTURES) {
      await db.backgrounds.add({
        name, type: 'preset', texture_type: textureType,
        width: 1920, height: 1080, created_at: now,
      });
    }
  }
}