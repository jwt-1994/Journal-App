import { Outlet } from 'react-router-dom';
import MobileTabBar from './TabBar';

export default function MobileLayout() {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100dvh',
      overflow: 'hidden',
      background: '#f5f5f5',
      paddingTop: 'env(safe-area-inset-top, 0)',
    }}>
      {/* 主内容区域 */}
      <div style={{
        flex: 1,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}>
        <Outlet />
      </div>

      {/* 底部 TabBar */}
      <MobileTabBar />
    </div>
  );
}