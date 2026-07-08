import { useState, useEffect } from 'react';
import { Card, Button, Modal, Input, message, Spin, Empty, Popconfirm } from 'antd';
import { PlusOutlined, DeleteOutlined, EditOutlined, EyeOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { getCollages, deleteCollage, renameCollage } from '../services/api';

interface Collage {
  id: number;
  name: string;
  background_id: number | null;
  canvas_width: number;
  canvas_height: number;
  updated_at: string;
  created_at: string;
}

export default function JournalNotebook() {
  const [collages, setCollages] = useState<Collage[]>([]);
  const [loading, setLoading] = useState(true);
  const [renameModal, setRenameModal] = useState<{ id: number; name: string } | null>(null);
  const navigate = useNavigate();

  const fetchCollages = async () => {
    setLoading(true);
    try {
      const res = await getCollages();
      setCollages(res.data);
    } catch {
      message.error('加载手账方案失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCollages();
  }, []);

  const handleDelete = async (id: number) => {
    try {
      await deleteCollage(id);
      message.success('方案已删除');
      fetchCollages();
    } catch {
      message.error('删除失败');
    }
  };

  const handleRename = async () => {
    if (!renameModal || !renameModal.name.trim()) return;
    try {
      await renameCollage(renameModal.id, renameModal.name.trim());
      message.success('重命名成功');
      setRenameModal(null);
      fetchCollages();
    } catch {
      message.error('重命名失败');
    }
  };

  const handleOpen = (c: Collage) => {
    navigate(`/collage?load=${c.id}`);
  };

  const formatDate = (d: string) => new Date(d).toLocaleString();

  return (
    <Spin spinning={loading}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2 style={{ margin: 0 }}>手账本</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/collage')}>
          新建拼贴
        </Button>
      </div>

      {collages.length === 0 && !loading ? (
        <Empty description="还没有拼贴方案，点击上方按钮创建" style={{ padding: 64 }} />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16 }}>
          {collages.map(c => (
            <Card
              key={c.id}
              hoverable
              cover={
                <div
                  style={{
                    height: 160,
                    background: 'linear-gradient(135deg, #f5f5f5 0%, #e8e8e8 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 48,
                    color: '#ccc',
                  }}
                  onClick={() => handleOpen(c)}
                >
                  {c.canvas_width}×{c.canvas_height}
                </div>
              }
              actions={[
                <EyeOutlined key="open" onClick={() => handleOpen(c)} />,
                <EditOutlined key="rename" onClick={() => setRenameModal({ id: c.id, name: c.name })} />,
                <Popconfirm
                  key="delete"
                  title="确定删除此方案？"
                  onConfirm={() => handleDelete(c.id)}
                  okText="删除"
                  cancelText="取消"
                >
                  <DeleteOutlined />
                </Popconfirm>,
              ]}
            >
              <Card.Meta
                title={c.name}
                description={
                  <div style={{ fontSize: 12, color: '#999' }}>
                    <div>{c.canvas_width} × {c.canvas_height}</div>
                    <div>{formatDate(c.updated_at)}</div>
                  </div>
                }
              />
            </Card>
          ))}
        </div>
      )}

      <Modal
        title="重命名方案"
        open={!!renameModal}
        onOk={handleRename}
        onCancel={() => setRenameModal(null)}
        okText="确定"
        cancelText="取消"
      >
        <Input
          value={renameModal?.name || ''}
          onChange={e => setRenameModal(prev => prev ? { ...prev, name: e.target.value } : null)}
          placeholder="输入新名称"
          onPressEnter={handleRename}
        />
      </Modal>
    </Spin>
  );
}