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
  },
  ios: {
    contentInset: 'automatic',
    allowsLinkPreview: true,
    scrollEnabled: false,
  },
};

export default config;