import { useLocation, useNavigate } from 'react-router-dom';
import { TabBar as AntdTabBar } from 'antd-mobile';
import {
  PictureOutlined,
  AppstoreAddOutlined,
  BookOutlined,
  UploadOutlined,
  SettingOutlined,
} from '@ant-design/icons';

const tabs = [
  { key: '/materials', title: '素材库', icon: <PictureOutlined /> },
  { key: '/collage', title: '拼贴', icon: <AppstoreAddOutlined /> },
  { key: '/journal', title: '手账本', icon: <BookOutlined /> },
  { key: '/upload', title: '上传', icon: <UploadOutlined /> },
  { key: '/settings', title: '设置', icon: <SettingOutlined /> },
];

export default function MobileTabBar() {
  const navigate = useNavigate();
  const location = useLocation();

  const activeKey = '/' + (location.pathname.split('/')[1] || 'materials');

  return (
    <div style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      zIndex: 100,
      background: '#fff',
      borderTop: '1px solid #eee',
      paddingBottom: 'env(safe-area-inset-bottom, 0)',
    }}>
      <AntdTabBar
        activeKey={activeKey}
        onChange={key => navigate(key)}
        safeArea
      >
        {tabs.map(tab => (
          <AntdTabBar.Item key={tab.key} icon={tab.icon} title={tab.title} />
        ))}
      </AntdTabBar>
    </div>
  );
}