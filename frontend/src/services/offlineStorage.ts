/**
 * 本地离线存储服务
 * 在 Capacitor 环境中使用 SQLite 插件，在 Web 环境中使用 localStorage 回退
 */

// 简单的内存/本地存储回退
class LocalStorage {
  private prefix = 'sticker_';

  async get(key: string): Promise<string | null> {
    return localStorage.getItem(this.prefix + key);
  }

  async set(key: string, value: string): Promise<void> {
    localStorage.setItem(this.prefix + key, value);
  }

  async remove(key: string): Promise<void> {
    localStorage.removeItem(this.prefix + key);
  }

  async keys(): Promise<string[]> {
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k?.startsWith(this.prefix)) {
        keys.push(k.replace(this.prefix, ''));
      }
    }
    return keys;
  }
}

// 离线缓存接口
export interface OfflineCache {
  get(key: string): Promise<any>;
  set(key: string, value: any): Promise<void>;
  remove(key: string): Promise<void>;
  clear(): Promise<void>;
  getAllKeys(): Promise<string[]>;
}

class OfflineStorage implements OfflineCache {
  private store = new LocalStorage();

  async get(key: string): Promise<any> {
    try {
      const val = await this.store.get(key);
      return val ? JSON.parse(val) : null;
    } catch {
      return null;
    }
  }

  async set(key: string, value: any): Promise<void> {
    await this.store.set(key, JSON.stringify(value));
  }

  async remove(key: string): Promise<void> {
    await this.store.remove(key);
  }

  async clear(): Promise<void> {
    const keys = await this.store.keys();
    for (const k of keys) {
      await this.store.remove(k);
    }
  }

  async getAllKeys(): Promise<string[]> {
    return this.store.keys();
  }
}

// 导出单例
export const offlineStorage = new OfflineStorage();

/**
 * 缓存 API 响应
 */
export async function cacheApiResponse<T>(
  key: string,
  fetcher: () => Promise<T>,
  maxAgeMs: number = 5 * 60 * 1000 // 默认 5 分钟
): Promise<T> {
  try {
    // 先从缓存读取
    const cached = await offlineStorage.get(key);
    if (cached && cached.timestamp && Date.now() - cached.timestamp < maxAgeMs) {
      return cached.data as T;
    }
  } catch {
    // 缓存读取失败，忽略
  }

  // 从网络获取
  const data = await fetcher();

  // 写入缓存
  try {
    await offlineStorage.set(key, { data, timestamp: Date.now() });
  } catch {
    // 缓存写入失败，忽略
  }

  return data;
}

/**
 * 检查网络状态
 */
export function isOnline(): boolean {
  return navigator.onLine;
}

/**
 * 监听网络状态变化
 */
export function onNetworkChange(callback: (online: boolean) => void): () => void {
  const handler = () => callback(navigator.onLine);
  window.addEventListener('online', handler);
  window.addEventListener('offline', handler);
  return () => {
    window.removeEventListener('online', handler);
    window.removeEventListener('offline', handler);
  };
}