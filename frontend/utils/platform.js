// utils/platform.js
export function getPlatformInfo() {
  const isBrowser = typeof window !== 'undefined';
  if (!isBrowser) return { platform: 'server' };
  
  const userAgent = window.navigator.userAgent;
  const platform = {
    isMobile: /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent),
    isDesktop: !(/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent)),
    isWindows: /Win/i.test(userAgent),
    isMacOS: /Mac/i.test(userAgent),
    isLinux: /Linux/i.test(userAgent),
    isIOS: /iPhone|iPad|iPod/i.test(userAgent),
    isAndroid: /Android/i.test(userAgent),
    isElectron: /Electron/i.test(userAgent),
    isPWA: window.matchMedia('(display-mode: standalone)').matches,
    isLowEndDevice: navigator.hardwareConcurrency <= 2 || navigator.deviceMemory <= 2
  };
  
  return platform;
}

// Use this in your components
import { getPlatformInfo } from '../utils/platform';

function MyComponent() {
  const platformInfo = getPlatformInfo();
  
  // Conditional rendering based on platform
  return (
    <div>
      {platformInfo.isMobile && <MobileOptimizedView />}
      {platformInfo.isDesktop && <DesktopOptimizedView />}
      {platformInfo.isLowEndDevice && <LightweightView />}
    </div>
  );
}
