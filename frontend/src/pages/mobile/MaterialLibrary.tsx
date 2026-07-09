import { useState, useEffect, useCallback } from 'react';
import { SearchBar, Tabs, SpinLoading, ImageViewer, ErrorBlock, InfiniteScroll } from 'antd-mobile';
import {
  getCategories,
  getMaterials,
  getBackgrounds,
  getMaterialFileUrl,
  getRemovedFileUrl,
  getBackgroundFileUrl,
} from '../../services/api';

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

const PAGE_SIZE = 30;

export default function MobileMaterialLibrary() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [backgrounds, setBackgrounds] = useState<Background[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);

  const [activeTab, setActiveTab] = useState('all');
  const [searchText, setSearchText] = useState('');
  const sortBy = 'created_at';
  const sortOrder = 'desc';

  // 图片预览
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewImages, setPreviewImages] = useState<string[]>([]);
  const [previewIndex, setPreviewIndex] = useState(0);

  useEffect(() => {
    Promise.all([getCategories(), getBackgrounds()]).then(([catRes, bgRes]) => {
      setCategories(catRes.data);
      setBackgrounds(bgRes.data);
    }).catch(() => {});
  }, []);

  const fetchMaterials = useCallback(async (pageNum: number, reset: boolean) => {
    if (reset) setLoading(true);
    try {
      const params: Record<string, unknown> = {
        page: pageNum,
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
      const items = res.data.items;
      if (reset) {
        setMaterials(items);
      } else {
        setMaterials(prev => [...prev, ...items]);
      }
      setHasMore(items.length >= PAGE_SIZE);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [activeTab, searchText, sortBy, sortOrder]);

  useEffect(() => {
    setPage(1);
    setMaterials([]);
    setHasMore(true);
    if (activeTab !== 'backgrounds') {
      fetchMaterials(1, true);
    }
  }, [fetchMaterials, activeTab]);

  const loadMore = async () => {
    const nextPage = page + 1;
    setPage(nextPage);
    await fetchMaterials(nextPage, false);
  };

  const handleImageClick = (_src: string, allImages: string[], index: number) => {
    setPreviewImages(allImages);
    setPreviewIndex(index);
    setPreviewVisible(true);
  };

  const getImageSrc = (m: Material) => {
    return m.has_removed_bg === 'done' ? getRemovedFileUrl(m.id) : getMaterialFileUrl(m.id);
  };

  const tabItems = [
    { key: 'all', title: '全部' },
    ...categories.map(c => ({ key: String(c.id), title: c.name })),
    { key: 'backgrounds', title: '背景' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* 搜索栏 */}
      <div style={{ padding: '8px 12px', background: '#fff' }}>
        <SearchBar
          placeholder="搜索素材..."
          value={searchText}
          onChange={v => setSearchText(v)}
          onClear={() => setSearchText('')}
          showCancelButton
        />
      </div>

      {/* 分类标签 */}
      <div style={{ background: '#fff', borderBottom: '1px solid #f5f5f5' }}>
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          style={{ '--title-font-size': '13px' }}
        >
          {tabItems.map(tab => (
            <Tabs.Tab key={tab.key} title={tab.title} />
          ))}
        </Tabs>
      </div>

      {/* 内容区域 */}
      <div style={{ flex: 1, overflow: 'auto', padding: '8px' }}>
        {/* 背景 Tab */}
        {activeTab === 'backgrounds' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
            {backgrounds.length === 0 ? (
              <ErrorBlock status="empty" title="暂无背景素材" style={{ gridColumn: '1 / -1', padding: '48px 0' }} />
            ) : (
              backgrounds.map(bg => (
                <div
                  key={bg.id}
                  onClick={() => handleImageClick(getBackgroundFileUrl(bg.id), backgrounds.map(b => getBackgroundFileUrl(b.id)), backgrounds.indexOf(bg))}
                  style={{
                    border: '1px solid #f0f0f0',
                    borderRadius: 8,
                    overflow: 'hidden',
                    background: '#fff',
                  }}
                >
                  <div style={{ width: '100%', aspectRatio: '1', display: 'flex', alignItems: 'center', justifyContent: 'center', background: bg.color ? `#${bg.color}` : '#f5f5f5' }}>
                    <img src={getBackgroundFileUrl(bg.id)} alt={bg.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                  <div style={{ padding: '6px 8px', fontSize: 12, textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{bg.name}</div>
                </div>
              ))
            )}
          </div>
        )}

        {/* 素材 Tab */}
        {activeTab !== 'backgrounds' && (
          <>
            {loading && materials.length === 0 ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '48px 0' }}>
                <SpinLoading color="primary" />
              </div>
            ) : materials.length === 0 ? (
              <ErrorBlock status="empty" title="暂无素材" style={{ padding: '48px 0' }} />
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
                {materials.map((m, idx) => (
                  <div
                    key={m.id}
                    onClick={() => handleImageClick(getImageSrc(m), materials.map(x => getImageSrc(x)), idx)}
                    style={{
                      border: '1px solid #f0f0f0',
                      borderRadius: 8,
                      overflow: 'hidden',
                      background: '#fff',
                    }}
                  >
                    <div
                      style={{
                        width: '100%',
                        aspectRatio: '1',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: 'repeating-conic-gradient(#e8e8e8 0% 25%, transparent 0% 50%) 50% / 16px 16px',
                      }}
                    >
                      <img
                        src={getImageSrc(m)}
                        alt={m.original_name}
                        style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                        loading="lazy"
                      />
                    </div>
                    <div style={{ padding: '6px 8px', fontSize: 12, textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.original_name}</div>
                  </div>
                ))}
              </div>
            )}
            <InfiniteScroll loadMore={loadMore} hasMore={hasMore} />
          </>
        )}
      </div>

      {/* 图片预览 */}
      <ImageViewer.Multi
        images={previewImages}
        visible={previewVisible}
        defaultIndex={previewIndex}
        onClose={() => setPreviewVisible(false)}
      />
    </div>
  );
}