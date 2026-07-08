import { useState } from 'react';
import { Layout, Menu, theme } from 'antd';
import {
  PictureOutlined,
  UploadOutlined,
  BookOutlined,
  LayoutOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import CollageEditor from '../pages/CollageEditor';

const { Header, Sider, Content } = Layout;

const menuItems = [
  { key: '/materials', icon: <PictureOutlined />, label: '素材库' },
  { key: '/upload', icon: <UploadOutlined />, label: '上传' },
  { key: '/journal', icon: <BookOutlined />, label: '手账本' },
  { key: '/collage', icon: <LayoutOutlined />, label: '拼贴' },
  { key: '/settings', icon: <SettingOutlined />, label: '设置' },
];

export default function AppLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { token } = theme.useToken();

  const isCollage = location.pathname === '/collage';

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider collapsible collapsed={collapsed} onCollapse={setCollapsed}>
        <div
          style={{
            height: 48,
            margin: 16,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: token.colorWhite,
            fontSize: collapsed ? 14 : 18,
            fontWeight: 'bold',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
          }}
        >
          {collapsed ? '📒' : '📒 手账素材库'}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
        />
      </Sider>
      <Layout>
        {/* 拼贴编辑器始终挂载，用display切换可见性，切换导航不丢失状态 */}
        <div style={{ display: isCollage ? 'flex' : 'none', flex: 1, flexDirection: 'column', overflow: 'hidden' }}>
          <CollageEditor />
        </div>

        <div style={{ display: isCollage ? 'none' : 'flex', flex: 1, flexDirection: 'column' }}>
          <Header
            style={{
              padding: '0 24px',
              background: token.colorBgContainer,
              fontSize: 18,
              fontWeight: 500,
              borderBottom: `1px solid ${token.colorBorderSecondary}`,
            }}
          >
            手账素材整理工具
          </Header>
          <Content style={{ margin: 24, padding: 24, background: token.colorBgContainer, borderRadius: 8 }}>
            <Outlet />
          </Content>
        </div>
      </Layout>
    </Layout>
  );
}