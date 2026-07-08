import { useState, useEffect } from 'react';
import { Button, Selector, Input, Switch, Form, ProgressBar, Toast, ImageUploader, TextArea } from 'antd-mobile';
import { getCategories, uploadMaterial } from '../../services/api';

interface Category {
  id: number;
  name: string;
}

export default function MobileUploadPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [images, setImages] = useState<{ url: string; file: File }[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | undefined>();
  const [autoRemoveBg, setAutoRemoveBg] = useState(true);
  const [materialName, setMaterialName] = useState('');
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    getCategories().then(res => setCategories(res.data)).catch(() => {});
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

    for (let i = 0; i < images.length; i++) {
      try {
        await uploadMaterial(images[i].file, selectedCategory, autoRemoveBg, materialName);
        success++;
      } catch {
        failed++;
      }
      setProgress(Math.round(((i + 1) / images.length) * 100));
    }

    setUploading(false);
    if (failed === 0) {
      Toast.show({ content: `上传成功 ${success} 张`, icon: 'success' });
    } else {
      Toast.show({ content: `成功 ${success} 张，失败 ${failed} 张`, icon: 'fail' });
    }
    setImages([]);
    setMaterialName('');
  };

  return (
    <div style={{ padding: '16px', overflow: 'auto', height: '100%' }}>
      <Form layout="vertical">
        <Form.Item label="选择图片">
          <ImageUploader
            value={images.map(img => ({ url: img.url }))}
            onChange={(_items, files) => {
              const newImages = files.map((f: File) => ({
                url: URL.createObjectURL(f),
                file: f,
              }));
              setImages(newImages);
            }}
            upload={async (file: File) => {
              const isImage = file.type.startsWith('image/');
              if (!isImage) {
                Toast.show({ content: '请选择图片文件', icon: 'fail' });
                return null;
              }
              return { url: URL.createObjectURL(file) };
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
          <Selector
            value={selectedCategory ? [selectedCategory] : []}
            onChange={arr => setSelectedCategory(arr.length > 0 ? arr[0] as number : undefined)}
            options={categories.map(c => ({ label: c.name, value: c.id }))}
            showCheckMark={false}
          />
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