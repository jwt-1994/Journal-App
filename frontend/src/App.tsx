import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import AppLayout from './components/AppLayout';
import MobileLayout from './components/mobile/MobileLayout';
import MaterialLibrary from './pages/MaterialLibrary';
import MobileMaterialLibrary from './pages/mobile/MaterialLibrary';
import UploadPage from './pages/UploadPage';
import MobileUploadPage from './pages/mobile/UploadPage';
import JournalNotebook from './pages/JournalNotebook';
import MobileJournalNotebook from './pages/mobile/JournalNotebook';
import CollageEditor from './pages/CollageEditor';
import MobileCollageEditor from './pages/mobile/CollageEditor';
import SettingsPage from './pages/SettingsPage';
import MobileSettingsPage from './pages/mobile/SettingsPage';

// 检测是否在 Capacitor 原生环境中运行
function isNativePlatform(): boolean {
  try {
    // Capacitor 原生环境有 window.Capacitor
    return !!(window as any).Capacitor?.isNativePlatform();
  } catch {
    return false;
  }
}

function App() {
  const isMobile = isNativePlatform();

  return (
    <HashRouter>
      <Routes>
        {isMobile ? (
          /* 移动端路由 */
          <>
            {/* 拼贴编辑器独立路由（全屏，无 TabBar） */}
            <Route path="/collage" element={<MobileCollageEditor />} />
            {/* 其他页面使用底部 TabBar 布局 */}
            <Route element={<MobileLayout />}>
              <Route path="/" element={<Navigate to="/materials" replace />} />
              <Route path="/materials" element={<MobileMaterialLibrary />} />
              <Route path="/upload" element={<MobileUploadPage />} />
              <Route path="/journal" element={<MobileJournalNotebook />} />
              <Route path="/settings" element={<MobileSettingsPage />} />
            </Route>
          </>
        ) : (
          /* 桌面端路由 */
          <Route element={<AppLayout />}>
            <Route path="/" element={<Navigate to="/materials" replace />} />
            <Route path="/materials" element={<MaterialLibrary />} />
            <Route path="/upload" element={<UploadPage />} />
            <Route path="/journal" element={<JournalNotebook />} />
            <Route path="/collage" element={<CollageEditor />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Route>
        )}
      </Routes>
    </HashRouter>
  );
}

export default App;