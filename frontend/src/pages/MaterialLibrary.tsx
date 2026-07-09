import { useState, useEffect, useCallback } from 'react';
import { Tabs, Row, Col, Image, Input, Select, Pagination, Spin, message } from 'antd';
import { SearchOutlined, SortAscendingOutlined } from '@ant-design/icons';
import {
  getCategories,
  getMaterials,
  getBackgrounds,
  getMaterialFileUrl,
  getRemovedFileUrl,
  getBackgroundFileUrl,
} from '../services/api';

interface Material {
  id: number;
  filename: string;
  original_name: string;
  category_id: number;
  category_name: string;
  file_size: number;
  has_removed_bg: string;
  created_at: string;
}

interface Category {
  id: number;
  name: string;
}

interface Background {
  id: number;
  name: string;
  color: string | null;
  width: number;
  height: number;
}

const PAGE_SIZE = 24;

export default function MaterialLibrary() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [backgrounds, setBackgrounds] = useState<Background[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);

  // 标签页
  const [activeTab, setActiveTab] = useState('all');

  // 搜索和排序
  const [searchText, setSearchText] = useState('');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');

  // 预览
  const [previewSrc, setPreviewSrc] = useState('');
  const [previewVisible, setPreviewVisible] = useState(false);

  const fetchCategories = async () => {
    try {
      const res = await getCategories();
      setCategories(res.data);
    } catch { /* ignore */ }
  };

  const fetchBackgrounds = async () => {
    try {
      const res = await getBackgrounds();
      setBackgrounds(res.data);
    } catch { /* ignore */ }
  };

  const fetchMaterials = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, unknown> = {
        page,
        page_size: PAGE_SIZE,
        bg_status: 'done',
        search: searchText || undefined,
        sort_by: sortBy,
        sort_order: sortOrder,
      };
      if (activeTab !== 'all' && activeTab !== 'backgrounds') {
        params.category_id = Number(activeTab);
      }
      const res = await getMaterials(params as never);
      setMaterials(res.data.items);
      setTotal(res.data.total);
    } catch {
      message.error('加载素材失败');
    } finally {
      setLoading(false);
    }
  }, [page, activeTab, searchText, sortBy, sortOrder]);

  useEffect(() => {
    fetchCategories();
    fetchBackgrounds();
  }, []);

  useEffect(() => {
    if (activeTab !== 'backgrounds') {
      fetchMaterials();
    }
  }, [fetchMaterials, activeTab]);

  // 切换标签页重置页码
  useEffect(() => {
    setPage(1);
  }, [activeTab, searchText]);

  const handlePreview = (src: string, _title: string) => {
    setPreviewSrc(src);
    setPreviewVisible(true);
  };

  const tabItems = [
    { key: 'all', label: '全部' },
    ...categories.map(c => ({ key: String(c.id), label: c.name })),
    { key: 'backgrounds', label: '背景' },
  ];

  return (
    <div>
      {/* 搜索/排序栏 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
        <Input
          placeholder="搜索素材..."
          prefix={<SearchOutlined />}
          allowClear
          style={{ width: 240 }}
          value={searchText}
          onChange={e => setSearchText(e.target.value)}
        />
        <Select
          style={{ width: 160 }}
          value={`${sortBy}-${sortOrder}`}
          onChange={val => {
            const [b, o] = val.split('-');
            setSortBy(b);
            setSortOrder(o);
          }}
          options={[
            { label: '上传时间 最新', value: 'created_at-desc' },
            { label: '上传时间 最旧', value: 'created_at-asc' },
            { label: '文件大小 最大', value: 'file_size-desc' },
            { label: '文件大小 最小', value: 'file_size-asc' },
          ]}
          prefix={<SortAscendingOutlined />}
        />
      </div>

      {/* 分类标签页 */}
      <Tabs activeKey={activeTab} onChange={setActiveTab} items={tabItems} />

      {/* 背景 Tab */}
      {activeTab === 'backgrounds' && (
        <Spin spinning={backgrounds.length === 0}>
          {backgrounds.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 48, color: '#999' }}>暂无背景素材</div>
          ) : (
            <Row gutter={[12, 12]}>
              {backgrounds.map(bg => (
                <Col key={bg.id} xs={12} sm={8} md={6} lg={4}>
                  <div
                    style={{
                      border: '1px solid #f0f0f0',
                      borderRadius: 8,
                      overflow: 'hidden',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                    }}
                    onClick={() => handlePreview(getBackgroundFileUrl(bg.id), bg.name)}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = '#1677ff'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(22,119,255,0.2)'; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = '#f0f0f0'; e.currentTarget.style.boxShadow = 'none'; }}
                  >
                    <div style={{ width: '100%', height: 120, display: 'flex', alignItems: 'center', justifyContent: 'center', background: bg.color ? `#${bg.color}` : '#f5f5f5' }}>
                      <img src={getBackgroundFileUrl(bg.id)} alt={bg.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                    <div style={{ padding: '6px 8px', fontSize: 12, textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{bg.name}</div>
                  </div>
                </Col>
              ))}
            </Row>
          )}
        </Spin>
      )}

      {/* 素材 Tab */}
      {activeTab !== 'backgrounds' && (
        <Spin spinning={loading}>
          {materials.length === 0 && !loading ? (
            <div style={{ textAlign: 'center', padding: 64, color: '#999' }}>暂无素材，快去上传吧</div>
          ) : (
            <>
              <Row gutter={[12, 12]}>
                {materials.map(m => (
                  <Col key={m.id} xs={12} sm={8} md={6} lg={4}>
                    <div
                      style={{
                        border: '1px solid #f0f0f0',
                        borderRadius: 8,
                        overflow: 'hidden',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                      }}
                      onClick={() => handlePreview(
                        m.has_removed_bg === 'done' ? getRemovedFileUrl(m.id) : getMaterialFileUrl(m.id),
                        m.original_name,
                      )}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = '#1677ff'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(22,119,255,0.2)'; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = '#f0f0f0'; e.currentTarget.style.boxShadow = 'none'; }}
                    >
                      <div
                        style={{
                          width: '100%',
                          height: 120,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          background: 'repeating-conic-gradient(#e8e8e8 0% 25%, transparent 0% 50%) 50% / 16px 16px',
                        }}
                      >
                        <img
                          src={m.has_removed_bg === 'done' ? getRemovedFileUrl(m.id) : getMaterialFileUrl(m.id)}
                          alt={m.original_name}
                          style={{ maxWidth: '100%', maxHeight: 120, objectFit: 'contain' }}
                        />
                      </div>
                      <div style={{ padding: '6px 8px', fontSize: 12, textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.original_name}</div>
                    </div>
                  </Col>
                ))}
              </Row>
              <div style={{ marginTop: 16, textAlign: 'right' }}>
                <Pagination
                  current={page}
                  pageSize={PAGE_SIZE}
                  total={total}
                  onChange={p => setPage(p)}
                  showTotal={t => `共 ${t} 个素材`}
                  size="small"
                />
              </div>
            </>
          )}
        </Spin>
      )}

      {/* 大图预览 */}
      <Image
        style={{ display: 'none' }}
        src={previewSrc}
        preview={{
          visible: previewVisible,
          onVisibleChange: setPreviewVisible,
        }}
      />
    </div>
  );
}