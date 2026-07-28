import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.sticker.material',
  appName: '手账素材库',
  webDir: 'dist',
  bundledWebRuntime: false,
  plugins: {
    StatusBar: {
      style: 'dark',
      backgroundColor: '#ffffff',
    },
    Camera: {
      usageDescription: '需要使用相机拍摄素材照片',
      permissions: {
        ios: 'camera',
      },
    },
  },
  ios: {
    contentInset: 'automatic',
    allowsLinkPreview: true,
    scrollEnabled: false,
    limitsNavigationsToAppBoundDomains: true,
  },
};

export default config;