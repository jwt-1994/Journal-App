import { useState, useEffect, useRef } from 'react';
import { Button, Selector, Input, Switch, Form, ProgressBar, Toast, ImageUploader, SpinLoading } from 'antd-mobile';
import type { ImageUploadItem } from 'antd-mobile/es/components/image-uploader';
import { getCategories, uploadMaterial } from '../../services/api';

interface Category {
  id: number;
  name: string;
  is_preset?: boolean;
  material_count?: number;
}

// 图片压缩：限制最大宽度 1920px，避免大图导致内存崩溃
function compressImage(file: File, maxWidth = 1920): Promise<Blob> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      if (img.width <= maxWidth) {
        resolve(file); // 不需要压缩
        return;
      }
      const scale = maxWidth / img.width;
      const canvas = document.createElement('canvas');
      canvas.width = maxWidth;
      canvas.height = Math.round(img.height * scale);
      const ctx = canvas.getContext('2d');
      if (!ctx) { resolve(file); return; }
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      canvas.toBlob(
        blob => {
          if (blob) resolve(blob);
          else resolve(file); // 压缩失败，用原图
        },
        file.type || 'image/jpeg',
        0.85,
      );
    };
    img.onerror = () => resolve(file);
    img.src = URL.createObjectURL(file);
  });
}

export default function MobileUploadPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [images, setImages] = useState<{ url: string; file: File }[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | undefined>();
  const [autoRemoveBg, setAutoRemoveBg] = useState(true);
  const [materialName, setMaterialName] = useState('');
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const fileMap = useRef<Map<string, File>>(new Map());
  const firstErrorRef = useRef<string | null>(null);

  useEffect(() => {
    setCategoriesLoading(true);
    getCategories()
      .then(res => { setCategories(res.data); setCategoriesLoading(false); })
      .catch(() => {
        setCategoriesLoading(false);
        Toast.show({ content: '加载分类失败，请检查网络连接', icon: 'fail' });
      });
  }, []);

  const handleUpload = async () => {
    if (images.length === 0) {
      Toast.show({ content: '请先选择图片', icon: 'fail' });
      return;
    }
    if (!selectedCategory) {
      Toast.show({ content: '请选择分类', icon: 'fail' });
      return;
    }

    setUploading(true);
    setProgress(0);

    let success = 0;
    let failed = 0;
    firstErrorRef.current = null;

    for (let i = 0; i < images.length; i++) {
      try {
        const compressed = await compressImage(images[i].file);
        const fileToUpload = compressed instanceof Blob
          ? new File([compressed], images[i].file.name, { type: images[i].file.type || 'image/jpeg' })
          : images[i].file;
        await uploadMaterial(fileToUpload, selectedCategory, autoRemoveBg, materialName);
        success++;
      } catch (e: any) {
        failed++;
        const msg = e?.message || '上传失败';
        if (!firstErrorRef.current) firstErrorRef.current = msg;
        Toast.show({ content: msg, icon: 'fail' });
      }
      setProgress(Math.round(((i + 1) / images.length) * 100));
    }

    setUploading(false);
    if (success > 0) {
      Toast.show({ content: `上传成功 ${success} 张` + (failed > 0 ? `，失败 ${failed} 张` : ''), icon: success > 0 ? 'success' : 'fail' });
      setImages([]);
      setMaterialName('');
      fileMap.current.clear();
    } else {
      // 全部失败，保留选中状态，不重置
      Toast.show({ content: `上传失败：${firstErrorRef.current || '未知错误'}`, icon: 'fail', duration: 3000 });
    }
  };

  return (
    <div style={{ padding: '16px', overflow: 'auto', height: '100%' }}>
      <Form layout="vertical">
        <Form.Item label="选择图片">
          <ImageUploader
            value={images.map(img => ({ url: img.url }))}
            onChange={(items: ImageUploadItem[]) => {
              const newImages = items.map((item: ImageUploadItem) => ({
                url: item.url,
                file: fileMap.current.get(item.url) || new File([], ''),
              }));
              setImages(newImages);
            }}
            upload={async (file: File): Promise<ImageUploadItem> => {
              const isImage = file.type.startsWith('image/');
              if (!isImage) {
                Toast.show({ content: '请选择图片文件', icon: 'fail' });
                throw new Error('not image');
              }
              const url = URL.createObjectURL(file);
              fileMap.current.set(url, file);
              return { url };
            }}
            multiple
            accept="image/*"
            maxCount={20}
            deletable
          />
        </Form.Item>

        <Form.Item label="素材名称（可选）">
          <Input
            placeholder="输入素材名称，留空则使用原文件名"
            value={materialName}
            onChange={setMaterialName}
            clearable
          />
        </Form.Item>

        <Form.Item label="自动抠图">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Switch checked={autoRemoveBg} onChange={setAutoRemoveBg} />
            <span style={{ fontSize: 13, color: '#999' }}>上传后自动去除背景</span>
          </div>
        </Form.Item>

        <Form.Item label="选择分类">
          {categoriesLoading ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: 8 }}>
              <SpinLoading style={{ '--size': '16px' }} /> 加载中...
            </div>
          ) : categories.length === 0 ? (
            <div style={{ color: '#999', padding: 8, fontSize: 13 }}>暂无分类，请先在设置中添加分类</div>
          ) : (
            <Selector
              value={selectedCategory ? [selectedCategory] : []}
              onChange={arr => setSelectedCategory(arr.length > 0 ? arr[0] as number : undefined)}
              options={categories.map(c => ({ label: c.name, value: c.id }))}
              showCheckMark={false}
            />
          )}
        </Form.Item>
      </Form>

      {uploading && (
        <div style={{ marginBottom: 16 }}>
          <ProgressBar percent={progress} text />
        </div>
      )}

      <Button
        block
        color="primary"
        size="large"
        onClick={handleUpload}
        loading={uploading}
        disabled={images.length === 0}
      >
        开始上传 ({images.length} 张)
      </Button>
    </div>
  );
}