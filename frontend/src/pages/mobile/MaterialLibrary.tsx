import { useState, useEffect, useRef } from 'react';
import { SearchBar, Tabs, SpinLoading, ImageViewer, ErrorBlock, InfiniteScroll, Toast, ActionSheet, Dialog } from 'antd-mobile';
import { CloseOutline } from 'antd-mobile-icons';
import {
  getCategories,
  getMaterials,
  getBackgrounds,
  getMaterialFileUrl,
  getRemovedFileUrl,
  getBackgroundFileUrl,
  deleteMaterial,
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

const PAGE_SIZE = 20;

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

  // 防竞态：用 ref 追踪最新的请求序号
  const fetchIdRef = useRef(0);

  // 加载分类和背景
  useEffect(() => {
    Promise.all([getCategories(), getBackgrounds()]).then(([catRes, bgRes]) => {
      setCategories(Array.isArray(catRes.data) ? catRes.data : []);
      setBackgrounds(Array.isArray(bgRes.data) ? bgRes.data : []);
    }).catch(() => {
      Toast.show({ content: '加载分类/背景失败，请检查网络', icon: 'fail' });
    });
  }, []);

  // 加载素材（稳定引用，不依赖 activeTab/searchText 的 useCallback）
  const fetchMaterials = async (pageNum: number, reset: boolean) => {
    const currentFetchId = ++fetchIdRef.current;

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

      // 防竞态：只有最新请求的结果才更新状态
      if (currentFetchId !== fetchIdRef.current) return;

      const items = res.data.items || [];
      if (reset) {
        setMaterials(items);
      } else {
        setMaterials(prev => [...prev, ...items]);
      }
      setHasMore(items.length >= PAGE_SIZE);
    } catch {
      if (currentFetchId !== fetchIdRef.current) return;
      if (reset) {
        setMaterials([]);
        Toast.show({ content: '加载素材失败，请检查网络', icon: 'fail' });
      }
    } finally {
      if (currentFetchId === fetchIdRef.current) {
        setLoading(false);
      }
    }
  };

  // tab 或搜索变化时重新加载
  useEffect(() => {
    setPage(1);
    setMaterials([]);
    setHasMore(true);
    if (activeTab !== 'backgrounds') {
      setLoading(true);
      fetchMaterials(1, true);
    } else {
      setLoading(false);
    }
  }, [activeTab, searchText]);

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

  const handleDelete = (id: number) => {
    const result = Dialog.confirm({
      title: '确定删除此素材？',
      content: '删除后不可恢复',
      confirmText: '删除',
      cancelText: '取消',
    });
    result.then(async (confirmed) => {
      if (confirmed) {
        try {
          await deleteMaterial(id);
          setMaterials(prev => prev.filter(m => m.id !== id));
          Toast.show({ content: '已删除', icon: 'success' });
        } catch {
          Toast.show({ content: '删除失败', icon: 'fail' });
        }
      }
    });
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
          onChange={key => setActiveTab(key)}
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
              <ErrorBlock status="empty" title="暂无背景素材" description="请先在设置中上传背景" style={{ gridColumn: '1 / -1', padding: '48px 0' }} />
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
                    <img src={getBackgroundFileUrl(bg.id)} alt={bg.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} loading="lazy" />
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
            ) : materials.length === 0 && !loading ? (
              <ErrorBlock status="empty" title="暂无素材" description="去上传页面上传素材吧" style={{ padding: '48px 0' }} />
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
                {materials.map((m, idx) => (
                  <div
                    key={m.id}
                    style={{
                      position: 'relative',
                      border: '1px solid #f0f0f0',
                      borderRadius: 8,
                      overflow: 'hidden',
                      background: '#fff',
                    }}
                  >
                    <div
                      onClick={() => handleImageClick(getImageSrc(m), materials.map(x => getImageSrc(x)), idx)}
                    >
                      <div
                        style={{
                          width: '100%',
                          aspectRatio: '1',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          background: m.has_removed_bg === 'done' ? 'transparent' : 'repeating-conic-gradient(#e8e8e8 0% 25%, transparent 0% 50%) 50% / 16px 16px',
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
                    {/* 删除按钮 */}
                    <div
                      onClick={(e) => { e.stopPropagation(); handleDelete(m.id); }}
                      style={{
                        position: 'absolute',
                        top: 4,
                        right: 4,
                        width: 24,
                        height: 24,
                        borderRadius: 12,
                        background: 'rgba(0,0,0,0.5)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 10,
                      }}
                    >
                      <CloseOutline style={{ color: '#fff', fontSize: 14 }} />
                    </div>
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