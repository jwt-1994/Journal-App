import { useState, useEffect } from 'react';
import { Upload, message, Spin, Empty, Tabs, Popconfirm, Image } from 'antd';
import { DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import { getBackgrounds, createBackground, deleteBackground, getBackgroundFileUrl } from '../services/api';

interface Background {
  id: number;
  name: string;
  type: 'preset' | 'user';
  color: string | null;
  texture_path: string | null;
  thumbnail_path: string | null;
  width: number;
  height: number;
}

export default function BackgroundLibrary() {
  const [backgrounds, setBackgrounds] = useState<Background[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewVisible, setPreviewVisible] = useState(false);

  const fetchBackgrounds = async () => {
    setLoading(true);
    try {
      const type = activeTab === 'all' ? undefined : activeTab;
      const res = await getBackgrounds(type);
      setBackgrounds(res.data);
    } catch {
      message.error('加载背景失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBackgrounds();
  }, [activeTab]);

  const handleUpload = async (file: File) => {
    try {
      await createBackground(file);
      message.success('背景上传成功');
      fetchBackgrounds();
    } catch {
      message.error('上传失败');
    }
    return false;
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteBackground(id);
      message.success('删除成功');
      fetchBackgrounds();
    } catch {
      message.error('删除失败');
    }
  };

  const handlePreview = (bg: Background) => {
    setPreviewUrl(getBackgroundFileUrl(bg.id));
    setPreviewVisible(true);
  };

  const tabItems = [
    { key: 'all', label: '全部' },
    { key: 'preset', label: '内置模版' },
    { key: 'user', label: '我的背景' },
  ];

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2 style={{ margin: 0 }}>背景库</h2>
        <Upload
          beforeUpload={(file) => {
            handleUpload(file);
            return false;
          }}
          accept="image/*"
          showUploadList={false}
        >
          <button
            style={{
              padding: '8px 16px',
              background: '#1677ff',
              color: '#fff',
              border: 'none',
              borderRadius: 6,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <PlusOutlined /> 上传背景
          </button>
        </Upload>
      </div>

      <Tabs activeKey={activeTab} onChange={setActiveTab} items={tabItems} />

      <Spin spinning={loading}>
        {backgrounds.length === 0 ? (
          <Empty description="暂无背景" />
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 16 }}>
            {backgrounds.map((bg) => (
              <div
                key={bg.id}
                style={{
                  border: '1px solid #f0f0f0',
                  borderRadius: 8,
                  overflow: 'hidden',
                  cursor: 'pointer',
                  transition: 'box-shadow 0.2s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)')}
                onMouseLeave={(e) => (e.currentTarget.style.boxShadow = 'none')}
              >
                <div
                  onClick={() => handlePreview(bg)}
                  style={{
                    width: '100%',
                    height: 140,
                    background: bg.color || '#f5f5f5',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden',
                  }}
                >
                  {bg.color ? (
                    <span style={{ color: '#999', fontSize: 14 }}>{bg.name}</span>
                  ) : (
                    <img
                      src={bg.thumbnail_path ? getBackgroundFileUrl(bg.id) : undefined}
                      alt={bg.name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  )}
                </div>
                <div
                  style={{
                    padding: '8px 12px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 500, fontSize: 14 }}>{bg.name}</div>
                    <div style={{ fontSize: 12, color: '#999' }}>
                      {bg.type === 'preset' ? '内置' : '自定义'} · {bg.width}x{bg.height}
                    </div>
                  </div>
                  {bg.type === 'user' && (
                    <Popconfirm title="确定删除此背景？" onConfirm={() => handleDelete(bg.id)}>
                      <DeleteOutlined style={{ color: '#ff4d4f', cursor: 'pointer' }} />
                    </Popconfirm>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Spin>

      {previewUrl && (
        <Image
          style={{ display: 'none' }}
          src={previewUrl}
          preview={{
            visible: previewVisible,
            onVisibleChange: (v) => setPreviewVisible(v),
            imageRender: () => <img src={previewUrl} alt="preview" style={{ maxWidth: '90vw', maxHeight: '90vh' }} />,
          }}
        />
      )}
    </div>
  );
}