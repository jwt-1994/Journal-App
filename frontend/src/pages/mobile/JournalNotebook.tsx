import { useState, useEffect } from 'react';
import { Button, List, Dialog, SpinLoading, ErrorBlock, SwipeAction, Input } from 'antd-mobile';
import { useNavigate } from 'react-router-dom';
import { getCollages, deleteCollage, renameCollage } from '../../services/api';

interface Collage {
  id: number;
  name: string;
  background_id: number | null;
  canvas_width: number;
  canvas_height: number;
  updated_at: string;
  created_at: string;
}

export default function MobileJournalNotebook() {
  const [collages, setCollages] = useState<Collage[]>([]);
  const [loading, setLoading] = useState(true);
  const [renameId, setRenameId] = useState<number | null>(null);
  const [renameText, setRenameText] = useState('');
  const navigate = useNavigate();

  const fetchCollages = async () => {
    setLoading(true);
    try {
      const res = await getCollages();
      setCollages(res.data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCollages();
  }, []);

  const handleDelete = (id: number) => {
    Dialog.confirm({
      title: '确定删除此方案？',
      content: '删除后不可恢复',
      onConfirm: async () => {
        await deleteCollage(id);
        fetchCollages();
      },
    });
  };

  const handleRename = async () => {
    if (!renameId || !renameText.trim()) return;
    await renameCollage(renameId, renameText.trim());
    setRenameId(null);
    setRenameText('');
    fetchCollages();
  };

  const formatDate = (d: string) => {
    const date = new Date(d);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* 顶部操作栏 */}
      <div style={{ padding: '12px 16px', background: '#fff', borderBottom: '1px solid #f5f5f5' }}>
        <Button block color="primary" onClick={() => navigate('/collage')}>
          新建拼贴
        </Button>
      </div>

      {/* 拼贴列表 */}
      <div style={{ flex: 1, overflow: 'auto' }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '48px 0' }}>
            <SpinLoading color="primary" />
          </div>
        ) : collages.length === 0 ? (
          <ErrorBlock status="empty" title="还没有拼贴方案" description="点击上方按钮创建" style={{ padding: '48px 0' }} />
        ) : (
          <List>
            {collages.map(c => (
              <SwipeAction
                key={c.id}
                rightActions={[
                  {
                    key: 'rename',
                    text: '重命名',
                    color: 'primary',
                    onClick: () => {
                      setRenameId(c.id);
                      setRenameText(c.name);
                    },
                  },
                  {
                    key: 'delete',
                    text: '删除',
                    color: 'danger',
                    onClick: () => handleDelete(c.id),
                  },
                ]}
              >
                <List.Item
                  onClick={() => navigate(`/collage?load=${c.id}`)}
                  style={{ cursor: 'pointer' }}
                  description={
                    <div style={{ display: 'flex', gap: 12 }}>
                      <span>{c.canvas_width}×{c.canvas_height}</span>
                      <span style={{ color: '#bbb' }}>{formatDate(c.updated_at)}</span>
                    </div>
                  }
                >
                  {c.name}
                </List.Item>
              </SwipeAction>
            ))}
          </List>
        )}
      </div>

      {/* 重命名弹窗 */}
      <Dialog
        visible={renameId !== null}
        title="重命名方案"
        content={
          <Input
            placeholder="输入新名称"
            value={renameText}
            onChange={setRenameText}
            style={{ marginTop: 8 }}
          />
        }
        onClose={() => setRenameId(null)}
        actions={[
          { key: 'cancel', text: '取消', onClick: () => setRenameId(null) },
          { key: 'confirm', text: '确定', bold: true, onClick: handleRename },
        ]}
      />
    </div>
  );
}