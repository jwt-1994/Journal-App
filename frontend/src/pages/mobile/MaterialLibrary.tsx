import { useState, useEffect, useRef } from 'react';
import { SearchBar, Tabs, SpinLoading, ImageViewer, ErrorBlock, InfiniteScroll, Toast, Button, Dialog, ActionSheet } from 'antd-mobile';
import { CheckCircleFill } from 'antd-mobile-icons';
import {
  getCategories,
  getMaterials,
  getBackgrounds,
  getMaterialFileUrl,
  getMaterialThumbUrl,
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
  is_preset?: boolean;
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
  const [bgUrls, setBgUrls] = useState<Record<number, string>>({});
  const [materials, setMaterials] = useState<Material[]>([]);
  const [thumbUrls, setThumbUrls] = useState<Record<number, string>>({});
  const [fullUrls, setFullUrls] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
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
  const previewKeyRef = useRef(0);

  // 多选模式
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [deleting, setDeleting] = useState(false);

  // 长按 ActionSheet
  const [actionSheetVisible, setActionSheetVisible] = useState(false);
  const [actionSheetTarget, setActionSheetTarget] = useState<Material | null>(null);
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 防竞态
  const fetchIdRef = useRef(0);

  useEffect(() => {
    Promise.all([getCategories(), getBackgrounds()]).then(([catRes, bgRes]) => {
      setCategories(Array.isArray(catRes.data) ? catRes.data : []);
      const bgList = Array.isArray(bgRes.data) ? bgRes.data : [];
      setBackgrounds(bgList);
      // 预加载背景图片
      bgList.forEach(bg => {
        getBackgroundFileUrl(bg.id).then(url => {
          setBgUrls(prev => ({ ...prev, [bg.id]: url }));
        }).catch(() => {});
      });
    }).catch(() => {
      Toast.show({ content: '加载分类/背景失败', icon: 'fail' });
    });
  }, []);

  // 预加载素材缩略图和大图
  const loadMaterialUrls = (items: Material[]) => {
    items.forEach(m => {
      // 缩略图
      getMaterialThumbUrl(m.id, 120).then(url => {
        setThumbUrls(prev => ({ ...prev, [m.id]: url }));
      }).catch(() => {});
      // 大图
      const fn = m.has_removed_bg === 'done' ? getRemovedFileUrl : getMaterialFileUrl;
      fn(m.id).then(url => {
        setFullUrls(prev => ({ ...prev, [m.id]: url }));
      }).catch(() => {});
    });
  };

  const fetchMaterials = async (pageNum: number, reset: boolean) => {
    const currentFetchId = ++fetchIdRef.current;
    if (reset) { setLoading(true); setError(false); }
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
      if (currentFetchId !== fetchIdRef.current) return;
      const items = res.data.items || [];
      if (reset) setMaterials(items);
      else setMaterials(prev => [...prev, ...items]);
      loadMaterialUrls(items);
      setHasMore(items.length >= PAGE_SIZE);
    } catch {
      if (currentFetchId !== fetchIdRef.current) return;
      if (reset) {
        setError(true);
        Toast.show({ content: '加载素材失败', icon: 'fail' });
      }
    } finally {
      if (currentFetchId === fetchIdRef.current) setLoading(false);
    }
  };

  useEffect(() => {
    setPage(1);
    setMaterials([]);
    setThumbUrls({});
    setFullUrls({});
    setHasMore(true);
    setSelectedIds(new Set());
    setSelectMode(false);
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

  const handleImageClick = (allImages: string[], index: number) => {
    if (selectMode) return;
    previewKeyRef.current += 1;
    setPreviewImages(allImages);
    setPreviewIndex(index);
    setPreviewVisible(true);
  };

  const toggleSelect = (id: number) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSingleDelete = (m: Material) => {
    Dialog.confirm({
      title: '确定删除？',
      content: `将删除「${m.original_name}」，不可恢复`,
      confirmText: '删除',
      cancelText: '取消',
      onConfirm: async () => {
        try {
          await deleteMaterial(m.id);
          setMaterials(prev => prev.filter(x => x.id !== m.id));
          setThumbUrls(prev => { const n = { ...prev }; delete n[m.id]; return n; });
          setFullUrls(prev => { const n = { ...prev }; delete n[m.id]; return n; });
          Toast.show({ content: '已删除', icon: 'success' });
        } catch {
          Toast.show({ content: '删除失败', icon: 'fail' });
        }
      },
    });
  };

  const handleBatchDelete = () => {
    if (selectedIds.size === 0) return;
    Dialog.confirm({
      title: '确定删除？',
      content: `将删除 ${selectedIds.size} 个素材，不可恢复`,
      confirmText: '删除',
      cancelText: '取消',
      onConfirm: async () => {
        setDeleting(true);
        let success = 0;
        let fail = 0;
        for (const id of selectedIds) {
          try {
            await deleteMaterial(id);
            success++;
          } catch { fail++; }
        }
        setMaterials(prev => prev.filter(m => !selectedIds.has(m.id)));
        setSelectedIds(new Set());
        setSelectMode(false);
        setDeleting(false);
        if (fail > 0) {
          Toast.show({ content: `已删除 ${success} 个，${fail} 个失败`, icon: 'fail' });
        } else {
          Toast.show({ content: `已删除 ${success} 个素材`, icon: 'success' });
        }
      },
    });
  };

  const tabItems = [
    { key: 'all', title: '全部' },
    ...categories.map(c => ({ key: String(c.id), title: c.name })),
    { key: 'backgrounds', title: '背景' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <div style={{ padding: '8px 12px', background: '#fff' }}>
        <SearchBar
          placeholder="搜索素材..."
          value={searchText}
          onChange={v => setSearchText(v)}
          onClear={() => setSearchText('')}
          showCancelButton
        />
      </div>

      <div style={{ background: '#fff', borderBottom: '1px solid #f5f5f5', display: 'flex', alignItems: 'center', padding: '4px 8px' }}>
        <div style={{ flex: 1 }}>
          <Tabs
            activeKey={activeTab}
            onChange={key => { setActiveTab(key); setSelectMode(false); setSelectedIds(new Set()); }}
            style={{ '--title-font-size': '13px' }}
          >
            {tabItems.map(tab => (
              <Tabs.Tab key={tab.key} title={tab.title} />
            ))}
          </Tabs>
        </div>
        {activeTab !== 'backgrounds' && (
          selectMode ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0, marginLeft: 8 }}>
              <Button size="small" color="danger" loading={deleting}
                disabled={selectedIds.size === 0}
                onClick={handleBatchDelete}>
                删除{selectedIds.size > 0 ? `(${selectedIds.size})` : ''}
              </Button>
              <Button size="small" fill="none" onClick={() => { setSelectMode(false); setSelectedIds(new Set()); }}>
                取消
              </Button>
            </div>
          ) : (
            <Button size="small" fill="none" color="primary"
              onClick={() => { setSelectMode(true); setSelectedIds(new Set()); }}
              style={{ flexShrink: 0, marginLeft: 8 }}>
              选择
            </Button>
          )
        )}
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: '4px' }}>
        {activeTab === 'backgrounds' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 4 }}>
            {backgrounds.length === 0 ? (
              <ErrorBlock status="empty" title="暂无背景素材" description="请先在设置中上传背景" style={{ gridColumn: '1 / -1', padding: '48px 0' }} />
            ) : (
              backgrounds.map(bg => (
                <div
                  key={bg.id}
                  onClick={() => {
                    const urls = backgrounds.map(b => bgUrls[b.id] || '');
                    handleImageClick(urls, backgrounds.indexOf(bg));
                  }}
                  style={{ border: '1px solid #f0f0f0', borderRadius: 6, overflow: 'hidden', background: '#fff' }}
                >
                  <div style={{ width: '100%', aspectRatio: '1', background: bg.color ? `#${bg.color}` : '#f5f5f5' }}>
                    {bgUrls[bg.id] ? (
                      <img src={bgUrls[bg.id]} alt={bg.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} loading="lazy" />
                    ) : (
                      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <SpinLoading style={{ '--size': '16px' }} />
                      </div>
                    )}
                  </div>
                  <div style={{ padding: '2px 4px', fontSize: 10, textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{bg.name}</div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab !== 'backgrounds' && (
          <>
            {loading && materials.length === 0 ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '48px 0' }}>
                <SpinLoading color="primary" />
              </div>
            ) : error && materials.length === 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '48px 0', gap: 12 }}>
                <span style={{ color: '#999' }}>加载失败</span>
                <Button size="small" color="primary" onClick={() => { setError(false); setLoading(true); fetchMaterials(1, true); }}>
                  点击重试
                </Button>
              </div>
            ) : materials.length === 0 && !loading ? (
              <ErrorBlock status="empty" title="暂无素材" description="去上传页面上传素材吧" style={{ padding: '48px 0' }} />
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 4 }}>
                {materials.map((m, idx) => {
                  const isSelected = selectedIds.has(m.id);
                  return (
                    <div
                      key={m.id}
                      style={{
                        position: 'relative',
                        border: isSelected ? '2px solid #1677ff' : '1px solid #f0f0f0',
                        borderRadius: 6, overflow: 'hidden', background: '#fff',
                        WebkitUserSelect: 'none', userSelect: 'none',
                        WebkitTouchCallout: 'none',
                      }}
                      onTouchStart={() => {
                        if (selectMode) return;
                        longPressTimerRef.current = setTimeout(() => {
                          setActionSheetTarget(m);
                          setActionSheetVisible(true);
                        }, 500);
                      }}
                      onTouchEnd={() => {
                        if (longPressTimerRef.current) {
                          clearTimeout(longPressTimerRef.current);
                          longPressTimerRef.current = null;
                        }
                      }}
                      onTouchMove={() => {
                        if (longPressTimerRef.current) {
                          clearTimeout(longPressTimerRef.current);
                          longPressTimerRef.current = null;
                        }
                      }}
                      onClick={() => {
                        if (selectMode) {
                          toggleSelect(m.id);
                        } else {
                          const urls = materials.map(x => fullUrls[x.id] || '');
                          handleImageClick(urls, idx);
                        }
                      }}
                    >
                      {selectMode && (
                        <div style={{
                          position: 'absolute', top: 4, right: 4, zIndex: 10,
                          width: 22, height: 22, borderRadius: '50%',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          background: isSelected ? '#1677ff' : 'rgba(255,255,255,0.85)',
                          border: isSelected ? 'none' : '2px solid #ccc',
                          boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
                        }}>
                          {isSelected ? (
                            <CheckCircleFill style={{ color: '#fff', fontSize: 22 }} />
                          ) : null}
                        </div>
                      )}
                      <div
                        style={{
                          width: '100%',
                          aspectRatio: '1',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          background: 'repeating-conic-gradient(#e8e8e8 0% 25%, transparent 0% 50%) 50% / 8px 8px',
                        }}
                      >
                        {thumbUrls[m.id] ? (
                          <img
                            src={thumbUrls[m.id]}
                            alt={m.original_name}
                            style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                            loading="lazy"
                          />
                        ) : (
                          <SpinLoading style={{ '--size': '16px' }} />
                        )}
                      </div>
                      <div style={{ padding: '2px 4px', fontSize: 10, textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.original_name}</div>
                    </div>
                  );
                })}
              </div>
            )}
            <InfiniteScroll loadMore={loadMore} hasMore={hasMore} />
          </>
        )}
      </div>

      <ImageViewer.Multi
        key={previewKeyRef.current}
        images={previewImages}
        visible={previewVisible}
        defaultIndex={previewIndex}
        onClose={() => setPreviewVisible(false)}
      />

      <ActionSheet
        visible={actionSheetVisible}
        actions={[
          {
            text: '多选',
            key: 'multi',
            onClick: () => {
              setActionSheetVisible(false);
              setSelectMode(true);
              setSelectedIds(new Set());
            },
          },
          {
            text: '删除',
            key: 'delete',
            danger: true,
            onClick: () => {
              setActionSheetVisible(false);
              if (actionSheetTarget) handleSingleDelete(actionSheetTarget);
            },
          },
        ]}
        onClose={() => setActionSheetVisible(false)}
        cancelText="取消"
      />
    </div>
  );
}