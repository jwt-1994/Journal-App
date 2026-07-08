import { useState, useEffect } from 'react';
import { List, Button, Dialog, Input, Toast, Tag, ErrorBlock } from 'antd-mobile';
import { AddOutline, DeleteOutline } from 'antd-mobile-icons';
import { getCategories, createCategory, deleteCategory } from '../../services/api';

interface Category {
  id: number;
  name: string;
  is_preset: boolean;
  material_count: number;
}

export default function MobileSettingsPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [newName, setNewName] = useState('');

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const res = await getCategories();
      setCategories(res.data);
    } catch {
      Toast.show({ content: '加载失败', icon: 'fail' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleCreate = async () => {
    if (!newName.trim()) {
      Toast.show({ content: '分类名称不能为空', icon: 'fail' });
      return;
    }
    try {
      await createCategory(newName.trim());
      Toast.show({ content: '创建成功', icon: 'success' });
      setDialogVisible(false);
      setNewName('');
      fetchCategories();
    } catch {
      Toast.show({ content: '创建失败', icon: 'fail' });
    }
  };

  const handleDelete = (cat: Category) => {
    if (cat.material_count > 0) {
      Toast.show({ content: '该分类下还有素材，无法删除', icon: 'fail' });
      return;
    }
    Dialog.confirm({
      title: '确认删除',
      content: `确定要删除分类"${cat.name}"吗？`,
      onConfirm: async () => {
        try {
          await deleteCategory(cat.id);
          Toast.show({ content: '删除成功', icon: 'success' });
          fetchCategories();
        } catch {
          Toast.show({ content: '删除失败', icon: 'fail' });
        }
      },
    });
  };

  return (
    <div style={{ overflow: 'auto', height: '100%' }}>
      {/* 分类管理 */}
      <List header="分类管理">
        <List.Item
          clickable
          onClick={() => setDialogVisible(true)}
          extra={<AddOutline />}
        >
          新增分类
        </List.Item>
        {categories.length === 0 ? (
          <List.Item>
            <ErrorBlock status="empty" title="暂无分类" />
          </List.Item>
        ) : (
          categories.map(cat => (
            <List.Item
              key={cat.id}
              extra={
                <Button
                  size="mini"
                  color="danger"
                  fill="none"
                  onClick={() => handleDelete(cat)}
                  disabled={cat.is_preset || cat.material_count > 0}
                >
                  <DeleteOutline />
                </Button>
              }
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span>{cat.name}</span>
                <Tag color={cat.is_preset ? 'primary' : 'success'} style={{ fontSize: 10 }}>
                  {cat.is_preset ? '预设' : '自定义'}
                </Tag>
                <span style={{ fontSize: 12, color: '#999' }}>{cat.material_count}个</span>
              </div>
            </List.Item>
          ))
        )}
      </List>

      {/* 关于 */}
      <List header="关于">
        <List.Item>
          <div style={{ color: '#666' }}>
            <div style={{ fontWeight: 500, marginBottom: 4 }}>手账素材库 v1.0.0</div>
            <div style={{ fontSize: 13, color: '#999', lineHeight: 1.6 }}>
              支持素材上传、自动抠图、分类管理、拼贴排版等功能。
            </div>
          </div>
        </List.Item>
      </List>

      {/* 新增分类弹窗 */}
      <Dialog
        visible={dialogVisible}
        title="新增分类"
        content={
          <Input
            placeholder="请输入分类名称"
            value={newName}
            onChange={setNewName}
            style={{ marginTop: 8 }}
          />
        }
        onClose={() => setDialogVisible(false)}
        actions={[
          { key: 'cancel', text: '取消', onClick: () => { setDialogVisible(false); setNewName(''); } },
          { key: 'confirm', text: '确定', bold: true, onClick: handleCreate },
        ]}
      />
    </div>
  );
}