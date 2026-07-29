// Capacitor Filesystem 封装
// 在非 Capacitor 环境（浏览器开发）使用 IndexedDB 模拟文件存储

import { Filesystem, Directory } from '@capacitor/filesystem';

const isNative = (): boolean => {
  try {
    return !!(window as any).Capacitor?.isNativePlatform?.();
  } catch {
    return false;
  }
};

function uuid(): string {
  return 'xxxxxxxxxxxx4xxxyxxxxxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// 浏览器开发环境用内存 Map 模拟
const browserStore = new Map<string, string>();

const DOCUMENTS = Directory.Documents;

export async function saveFile(
  blob: Blob,
  subdir: 'materials' | 'backgrounds' | 'collages',
  ext = 'png',
): Promise<{ uri: string; filename: string }> {
  const filename = `${uuid()}.${ext}`;
  const path = `${subdir}/${filename}`;

  if (isNative()) {
    const base64Data = await blobToBase64(blob);
    await Filesystem.writeFile({
      path,
      data: base64Data,
      directory: DOCUMENTS,
      recursive: true,
    });
    return { uri: path, filename };
  }

  // 浏览器开发：存 data URL
  const dataUrl = await blobToBase64(blob);
  browserStore.set(path, dataUrl);
  return { uri: path, filename };
}

export async function readFileAsBlob(
  uri: string,
): Promise<Blob> {
  if (isNative()) {
    const result = await Filesystem.readFile({
      path: uri,
      directory: DOCUMENTS,
    });
    return base64ToBlob(result.data as string, 'image/png');
  }

  const dataUrl = browserStore.get(uri);
  if (!dataUrl) throw new Error(`文件不存在: ${uri}`);
  return dataUrlToBlob(dataUrl);
}

export async function readFileAsDataUrl(uri: string): Promise<string> {
  if (isNative()) {
    const result = await Filesystem.readFile({
      path: uri,
      directory: DOCUMENTS,
    });
    return `data:image/png;base64,${result.data}`;
  }

  const dataUrl = browserStore.get(uri);
  if (!dataUrl) throw new Error(`文件不存在: ${uri}`);
  return dataUrl;
}

export async function deleteFile(uri: string): Promise<void> {
  if (isNative()) {
    try {
      await Filesystem.deleteFile({
        path: uri,
        directory: DOCUMENTS,
      });
    } catch {
      // 文件可能已不存在，忽略
    }
    return;
  }

  browserStore.delete(uri);
}

// 工具函数
function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      // 去掉 data:xxx;base64, 前缀
      const base64 = result.split(',')[1] || result;
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

function base64ToBlob(base64: string, mimeType: string): Blob {
  const byteChars = atob(base64);
  const byteArrays: Uint8Array[] = [];
  const sliceSize = 512;
  for (let offset = 0; offset < byteChars.length; offset += sliceSize) {
    const slice = byteChars.slice(offset, offset + sliceSize);
    const byteNumbers = new Array(slice.length);
    for (let i = 0; i < slice.length; i++) {
      byteNumbers[i] = slice.charCodeAt(i);
    }
    byteArrays.push(new Uint8Array(byteNumbers));
  }
  return new Blob(byteArrays, { type: mimeType });
}

function dataUrlToBlob(dataUrl: string): Blob {
  const parts = dataUrl.split(',');
  const mime = parts[0].match(/:(.*?);/)?.[1] || 'image/png';
  const b64 = parts[1];
  return base64ToBlob(b64, mime);
}