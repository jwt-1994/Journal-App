import { useState, useEffect } from 'react';
import { Table, Button, Modal, Input, Space, Tag, message } from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import { getCategories, createCategory, deleteCategory } from '../services/api';

interface Category {
  id: number;
  name: string;
  is_preset: boolean;
  material_count: number;
}

export default function CategoryManagement() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const res = await getCategories();
      setCategories(res.data);
    } catch {
      message.error('加载分类失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleCreate = async () => {
    if (!newName.trim()) {
      message.warning('分类名称不能为空');
      return;
    }
    setSubmitting(true);
    try {
      await createCategory(newName.trim());
      message.success('创建成功');
      setModalOpen(false);
      setNewName('');
      fetchCategories();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { detail?: string } } };
      message.error(error?.response?.data?.detail || '创建失败');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = (cat: Category) => {
    Modal.confirm({
      title: '确认删除',
      content: `确定要删除分类"${cat.name}"吗？`,
      onOk: async () => {
        try {
          await deleteCategory(cat.id);
          message.success('删除成功');
          fetchCategories();
        } catch (err: unknown) {
          const error = err as { response?: { data?: { detail?: string } } };
          message.error(error?.response?.data?.detail || '删除失败');
        }
      },
    });
  };

  const columns = [
    { title: '分类名称', dataIndex: 'name', key: 'name' },
    {
      title: '类型',
      dataIndex: 'is_preset',
      key: 'is_preset',
      render: (v: boolean) => (v ? <Tag color="blue">预设</Tag> : <Tag color="green">自定义</Tag>),
    },
    { title: '素材数量', dataIndex: 'material_count', key: 'material_count' },
    {
      title: '操作',
      key: 'action',
      render: (_: unknown, record: Category) => (
        <Button
          danger
          icon={<DeleteOutlined />}
          disabled={record.is_preset || record.material_count > 0}
          onClick={() => handleDelete(record)}
        >
          删除
        </Button>
      ),
    },
  ];

  return (
    <div>
      <Space style={{ marginBottom: 16 }}>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalOpen(true)}>
          新增分类
        </Button>
      </Space>

      <Table
        columns={columns}
        dataSource={categories}
        rowKey="id"
        loading={loading}
        pagination={false}
      />

      <Modal
        title="新增分类"
        open={modalOpen}
        onOk={handleCreate}
        onCancel={() => {
          setModalOpen(false);
          setNewName('');
        }}
        confirmLoading={submitting}
      >
        <Input
          placeholder="请输入分类名称"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onPressEnter={handleCreate}
        />
      </Modal>
    </div>
  );
}