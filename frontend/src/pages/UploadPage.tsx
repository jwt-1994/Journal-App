import { useState, useEffect } from 'react';
import { Upload, Select, Button, Card, message, Space, Progress, Switch, Input } from 'antd';
import { InboxOutlined } from '@ant-design/icons';
import { getCategories, uploadMaterial, uploadMaterialsBatch } from '../services/api';

const { Dragger } = Upload;

interface Category {
  id: number;
  name: string;
}

export default function UploadPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [fileList, setFileList] = useState<File[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | undefined>();
  const [uploading, setUploading] = useState(false);
  const [autoRemoveBg, setAutoRemoveBg] = useState(true);
  const [uploadResults, setUploadResults] = useState<{ success: number; failed: number } | null>(null);
  const [materialName, setMaterialName] = useState('');

  useEffect(() => {
    getCategories().then((res) => setCategories(res.data));
  }, []);

  const handleUpload = async () => {
    if (fileList.length === 0) {
      message.warning('请先选择图片');
      return;
    }
    if (!selectedCategoryId) {
      message.warning('请选择分类');
      return;
    }

    setUploading(true);
    setUploadResults(null);

    try {
      if (fileList.length === 1) {
        await uploadMaterial(fileList[0], selectedCategoryId, autoRemoveBg, materialName);
        setUploadResults({ success: 1, failed: 0 });
      } else {
        const res = await uploadMaterialsBatch(fileList, selectedCategoryId, autoRemoveBg, materialName);
        const results = res.data.results;
        const success = results.filter((r: { success: boolean }) => r.success).length;
        const failed = results.filter((r: { success: boolean }) => !r.success).length;
        setUploadResults({ success, failed });
      }
      message.success('上传完成');
      setFileList([]);
      setMaterialName('');
    } catch {
      message.error('上传失败');
      setUploadResults({ success: 0, failed: fileList.length });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={{ maxWidth: 600, margin: '0 auto' }}>
      <Card title="上传素材">
        <Dragger
          multiple
          beforeUpload={(file) => {
            const isImage = file.type.startsWith('image/');
            if (!isImage) {
              message.error(`${file.name} 不是图片文件`);
              return false;
            }
            const isLt20M = file.size / 1024 / 1024 < 20;
            if (!isLt20M) {
              message.error(`${file.name} 超过 20MB 限制`);
              return false;
            }
            setFileList((prev) => [...prev, file]);
            return false;
          }}
          onRemove={(file) => {
            setFileList((prev) => prev.filter((f) => f.name !== file.name));
          }}
          fileList={fileList.map((f, i) => ({
            uid: `${i}`,
            name: f.name,
            status: 'done' as const,
            size: f.size,
          }))}
          showUploadList={{ showPreviewIcon: false }}
          accept="image/*"
        >
          <p className="ant-upload-drag-icon">
            <InboxOutlined />
          </p>
          <p className="ant-upload-text">点击或拖拽图片到此区域上传</p>
          <p className="ant-upload-hint">支持 JPG、PNG、WEBP 格式，单张不超过 20MB</p>
        </Dragger>

        <div style={{ marginTop: 24 }}>
          <div style={{ marginBottom: 8, fontWeight: 500 }}>素材名称（可选）</div>
          <Input
            placeholder="输入素材名称，留空则使用原文件名"
            value={materialName}
            onChange={(e) => setMaterialName(e.target.value)}
            allowClear
          />
        </div>

        <div style={{ marginTop: 24 }}>
          <div style={{ marginBottom: 8, fontWeight: 500 }}>自动抠图</div>
          <Switch
            checked={autoRemoveBg}
            onChange={setAutoRemoveBg}
            checkedChildren="开启"
            unCheckedChildren="关闭"
          />
          <span style={{ marginLeft: 8, color: '#999', fontSize: 12 }}>
            上传后自动去除背景
          </span>
        </div>

        <div style={{ marginTop: 24 }}>
          <div style={{ marginBottom: 8, fontWeight: 500 }}>选择分类</div>
          <Select
            placeholder="请选择分类"
            style={{ width: '100%' }}
            value={selectedCategoryId}
            onChange={setSelectedCategoryId}
            options={categories.map((c) => ({ label: c.name, value: c.id }))}
          />
        </div>

        <Button
          type="primary"
          block
          size="large"
          onClick={handleUpload}
          loading={uploading}
          disabled={fileList.length === 0}
          style={{ marginTop: 24 }}
        >
          开始上传 ({fileList.length} 张)
        </Button>

        {uploading && <Progress percent={99} status="active" style={{ marginTop: 16 }} />}

        {uploadResults && (
          <Card style={{ marginTop: 16 }} size="small">
            <Space>
              <span style={{ color: '#52c41a' }}>成功 {uploadResults.success} 张</span>
              {uploadResults.failed > 0 && (
                <span style={{ color: '#ff4d4f' }}>失败 {uploadResults.failed} 张</span>
              )}
            </Space>
          </Card>
        )}
      </Card>
    </div>
  );
}