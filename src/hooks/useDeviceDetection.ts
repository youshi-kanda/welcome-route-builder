import { useState, useEffect } from 'react';

export interface DeviceInfo {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  userAgent: string;
  screenWidth: number;
  screenHeight: number;
  isFromQR: boolean;
  deviceType: 'mobile' | 'tablet' | 'desktop';
}

export const useDeviceDetection = () => {
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo>({
    isMobile: false,
    isTablet: false,
    isDesktop: true,
    userAgent: '',
    screenWidth: 0,
    screenHeight: 0,
    isFromQR: false,
    deviceType: 'desktop'
  });

  useEffect(() => {
    const detectDevice = () => {
      const userAgent = navigator.userAgent;
      const screenWidth = window.innerWidth;
      const screenHeight = window.innerHeight;
      
      // URLパラメータチェック
      const urlParams = new URLSearchParams(window.location.search);
      const isFromQR = urlParams.get('mobile') === 'true';
      
      // デバイス種別判定
      const isMobileAgent = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
      const isMobileScreen = screenWidth <= 768;
      const isTabletScreen = screenWidth > 768 && screenWidth <= 1024;
      
      const isMobile = isMobileAgent || isMobileScreen || isFromQR;
      const isTablet = isTabletScreen && !isMobile;
      const isDesktop = !isMobile && !isTablet;
      
      let deviceType: 'mobile' | 'tablet' | 'desktop' = 'desktop';
      if (isMobile) deviceType = 'mobile';
      else if (isTablet) deviceType = 'tablet';

      const newDeviceInfo: DeviceInfo = {
        isMobile,
        isTablet,
        isDesktop,
        userAgent,
        screenWidth,
        screenHeight,
        isFromQR,
        deviceType
      };

      setDeviceInfo(newDeviceInfo);

      // デモ用イベント発火
      if (isFromQR && !deviceInfo.isFromQR) {
        // QRコード経由でのアクセスを通知
        window.dispatchEvent(new CustomEvent('demo-mobile-connected', {
          detail: {
            connected: true,
            device: {
              id: `device_${Date.now()}`,
              userAgent: getDeviceName(userAgent),
              connectedAt: new Date().toLocaleTimeString('ja-JP'),
              lastActivity: new Date().toLocaleTimeString('ja-JP')
            }
          }
        }));
      }
    };

    // 初回実行
    detectDevice();

    // リサイズイベントリスナー
    window.addEventListener('resize', detectDevice);
    
    return () => {
      window.removeEventListener('resize', detectDevice);
    };
  }, [deviceInfo.isFromQR]);

  return deviceInfo;
};

// ユーザーエージェントから分かりやすいデバイス名を生成
const getDeviceName = (userAgent: string): string => {
  if (/iPhone/i.test(userAgent)) {
    if (/iPhone.*15/i.test(userAgent)) return 'iPhone 15';
    if (/iPhone.*14/i.test(userAgent)) return 'iPhone 14';
    if (/iPhone.*13/i.test(userAgent)) return 'iPhone 13';
    return 'iPhone';
  }
  
  if (/iPad/i.test(userAgent)) {
    return 'iPad';
  }
  
  if (/Android/i.test(userAgent)) {
    if (/Samsung/i.test(userAgent)) return 'Samsung Galaxy';
    if (/Pixel/i.test(userAgent)) return 'Google Pixel';
    return 'Android端末';
  }
  
  if (/Mac/i.test(userAgent)) return 'Mac';
  if (/Windows/i.test(userAgent)) return 'Windows PC';
  
  return 'デスクトップ';
};

// デモ用: モバイル表示モードの強制切り替えフック
export const useDemoMobileMode = () => {
  const [forceMobileMode, setForceMobileMode] = useState(false);
  
  useEffect(() => {
    // URLパラメータでモバイルモード強制
    const urlParams = new URLSearchParams(window.location.search);
    const forceMode = urlParams.get('mobile') === 'true';
    setForceMobileMode(forceMode);
  }, []);

  const toggleMobileMode = () => {
    const newMode = !forceMobileMode;
    setForceMobileMode(newMode);
    
    // URLを更新
    const url = new URL(window.location.href);
    if (newMode) {
      url.searchParams.set('mobile', 'true');
    } else {
      url.searchParams.delete('mobile');
    }
    window.history.pushState({}, '', url.toString());
  };

  return {
    forceMobileMode,
    toggleMobileMode
  };
};