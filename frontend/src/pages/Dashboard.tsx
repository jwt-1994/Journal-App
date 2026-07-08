import { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, Table, Tag, Empty, Spin } from 'antd';
import {
  PictureOutlined,
  DatabaseOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
} from '@ant-design/icons';
import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  BarChart, Bar,
} from 'recharts';
import { getDashboardStats, getDashboardRecent, getUploadTrend } from '../services/api';
import { useNavigate } from 'react-router-dom';

const COLORS = ['#1677ff', '#52c41a', '#faad14', '#f5222d', '#722ed1'];

interface CategoryStat {
  name: string;
  count: number;
}

interface BgStatusStat {
  none: number;
  processing: number;
  done: number;
  failed: number;
}

interface Stats {
  category_stats: CategoryStat[];
  total_materials: number;
  total_size_bytes: number;
  bg_status_stats: BgStatusStat;
}

interface TrendItem {
  date: string;
  count: number;
}

interface RecentItem {
  id: number;
  filename: string;
  original_name: string;
  category_name: string;
  file_size: number;
  created_at: string;
}

export default function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [trend, setTrend] = useState<TrendItem[]>([]);
  const [recent, setRecent] = useState<RecentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    Promise.all([
      getDashboardStats().then((res) => setStats(res.data)),
      getUploadTrend(30).then((res) => setTrend(res.data)),
      getDashboardRecent(10).then((res) => setRecent(res.data)),
    ]).finally(() => setLoading(false));
  }, []);

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  };

  const columns = [
    { title: '文件名', dataIndex: 'original_name', key: 'name' },
    {
      title: '分类',
      dataIndex: 'category_name',
      key: 'category',
      render: (v: string) => <Tag color="blue">{v}</Tag>,
    },
    {
      title: '大小',
      dataIndex: 'file_size',
      key: 'size',
      render: (v: number) => formatSize(v),
    },
    {
      title: '时间',
      dataIndex: 'created_at',
      key: 'time',
      render: (v: string) => new Date(v).toLocaleString(),
    },
  ];

  if (loading) {
    return <div style={{ textAlign: 'center', padding: 64 }}><Spin size="large" /></div>;
  }

  if (!stats || stats.total_materials === 0) {
    return (
      <div style={{ textAlign: 'center', padding: 64 }}>
        <Empty description="暂无素材，快去上传吧" />
      </div>
    );
  }

  const pieData = stats.category_stats
    .filter((c) => c.count > 0)
    .map((c) => ({ name: c.name, value: c.count }));

  const bgBarData = [
    { name: '未抠图', count: stats.bg_status_stats.none, fill: '#d9d9d9' },
    { name: '处理中', count: stats.bg_status_stats.processing, fill: '#1677ff' },
    { name: '已抠图', count: stats.bg_status_stats.done, fill: '#52c41a' },
    { name: '失败', count: stats.bg_status_stats.failed, fill: '#f5222d' },
  ];

  return (
    <div>
      {/* 概览卡片 */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card>
            <Statistic title="素材总数" value={stats.total_materials} prefix={<PictureOutlined />} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="存储空间" value={formatSize(stats.total_size_bytes)} prefix={<DatabaseOutlined />} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="已抠图"
              value={stats.bg_status_stats.done}
              suffix={`/ ${stats.total_materials}`}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="抠图失败"
              value={stats.bg_status_stats.failed}
              prefix={<CloseCircleOutlined />}
              valueStyle={{ color: stats.bg_status_stats.failed > 0 ? '#f5222d' : undefined }}
            />
          </Card>
        </Col>
      </Row>

      {/* 图表区域 */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        {/* 分类占比饼图 */}
        <Col span={12}>
          <Card title="分类占比">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                >
                  {pieData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </Col>

        {/* 抠图状态柱状图 */}
        <Col span={12}>
          <Card title="抠图状态分布">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={bgBarData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" name="数量">
                  {bgBarData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Col>
      </Row>

      <Row gutter={16} style={{ marginBottom: 24 }}>
        {/* 上传趋势折线图 */}
        <Col span={24}>
          <Card title="上传趋势（近30天）">
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={trend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Line type="monotone" dataKey="count" name="上传数" stroke="#1677ff" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </Col>
      </Row>

      {/* 最近上传 */}
      <Card title="最近上传">
        <Table
          columns={columns}
          dataSource={recent}
          rowKey="id"
          pagination={false}
          onRow={() => ({
            onClick: () => navigate('/'),
            style: { cursor: 'pointer' },
          })}
        />
      </Card>
    </div>
  );
}