// Canvas API 缩略图生成

import { readFileAsDataUrl } from './localFS';

const thumbnailCache = new Map<string, string>();

/**
 * 从本地文件生成缩略图，返回 data URL
 */
export async function generateThumbnail(
  fileUri: string,
  size: number = 200,
): Promise<string> {
  const cacheKey = `${fileUri}@${size}`;
  if (thumbnailCache.has(cacheKey)) {
    return thumbnailCache.get(cacheKey)!;
  }

  const dataUrl = await readFileAsDataUrl(fileUri);
  const result = await resizeImage(dataUrl, size);
  thumbnailCache.set(cacheKey, result);
  return result;
}

/**
 * 从 data URL 生成缩略图
 */
export async function resizeImage(
  dataUrl: string,
  size: number,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ratio = Math.min(size / img.width, size / img.height);
      canvas.width = Math.round(img.width * ratio);
      canvas.height = Math.round(img.height * ratio);
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = reject;
    img.src = dataUrl;
  });
}

/**
 * 清除缩略图缓存
 */
export function clearThumbnailCache(): void {
  thumbnailCache.clear();
}