import { useEffect } from "react";
import { Smartphone, Monitor, Tablet } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useDeviceDetection } from "@/hooks/useDeviceDetection";

export const MobileOptimizedDemo = ({ children }: { children: React.ReactNode }) => {
  const deviceInfo = useDeviceDetection();

  useEffect(() => {
    // デモモード専用のデバイス初期化
    const DEMO_MODE = import.meta.env.VITE_DEMO_MODE === 'true';
    
    if (DEMO_MODE && deviceInfo.isFromQR) {
      // デモストレージ初期化
      import('@/lib/demo-storage').then(({ default: DemoStorage }) => {
        DemoStorage.initializeDemoData();
      });

      // メール設定サービス初期化
      import('@/lib/emailService').then(({ default: EmailService }) => {
        const emailService = EmailService.getInstance();
        emailService.initialize();
      });
    }
  }, [deviceInfo.isFromQR]);

  const DeviceIndicator = () => {
    const DEMO_MODE = import.meta.env.VITE_DEMO_MODE === 'true';
    
    if (!DEMO_MODE) return null;

    return (
      <div className="fixed top-2 left-1/2 transform -translate-x-1/2 z-50">
        <Badge 
          variant="secondary" 
          className={`
            flex items-center gap-2 px-3 py-1 text-xs font-medium
            ${deviceInfo.isMobile ? 'bg-green-100 text-green-700 border-green-200' : ''}
            ${deviceInfo.isTablet ? 'bg-blue-100 text-blue-700 border-blue-200' : ''}
            ${deviceInfo.isDesktop ? 'bg-gray-100 text-gray-700 border-gray-200' : ''}
          `}
        >
          {deviceInfo.isMobile && <Smartphone className="w-3 h-3" />}
          {deviceInfo.isTablet && <Tablet className="w-3 h-3" />}
          {deviceInfo.isDesktop && <Monitor className="w-3 h-3" />}
          
          <span>
            {deviceInfo.deviceType === 'mobile' && '📱 モバイル表示'}
            {deviceInfo.deviceType === 'tablet' && '💻 タブレット表示'}
            {deviceInfo.deviceType === 'desktop' && '🖥️ デスクトップ表示'}
          </span>
          
          {deviceInfo.isFromQR && (
            <span className="text-xs bg-green-200 text-green-800 px-1 rounded">
              QR
            </span>
          )}
        </Badge>
      </div>
    );
  };

  const MobileStyles = () => {
    if (!deviceInfo.isMobile) return null;

    return (
      <style>{`
        /* モバイル専用スタイル調整 */
        .mobile-optimized {
          font-size: 16px !important; /* iOS zoom防止 */
        }
        
        .mobile-optimized input,
        .mobile-optimized select,
        .mobile-optimized textarea {
          font-size: 16px !important; /* iOS zoom防止 */
        }
        
        .mobile-optimized .container {
          padding-left: 1rem !important;
          padding-right: 1rem !important;
        }
        
        .mobile-optimized .gradient-hero {
          min-height: 100vh !important;
        }
        
        /* タッチ操作用にボタンサイズ調整 */
        .mobile-optimized button {
          min-height: 44px !important;
          padding: 0.75rem 1rem !important;
        }
        
        /* SMS表示パネルをモバイル用に調整 */
        .demo-sms-viewer {
          position: fixed !important;
          bottom: 0 !important;
          left: 0 !important;
          right: 0 !important;
          max-width: none !important;
          border-radius: 0.5rem 0.5rem 0 0 !important;
        }
        
        /* QRコードパネルをモバイルでは非表示 */
        .qr-panel {
          display: ${deviceInfo.isMobile ? 'none' : 'block'} !important;
        }
        
        /* モバイル用メニューバー */
        .mobile-menu-bar {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          background: white;
          border-top: 1px solid #e5e7eb;
          padding: 0.5rem;
          z-index: 40;
        }
      `}</style>
    );
  };

  return (
    <div className={deviceInfo.isMobile ? 'mobile-optimized' : ''}>
      <DeviceIndicator />
      <MobileStyles />
      {children}
      
      {/* モバイル用フッターメニュー */}
      {deviceInfo.isMobile && (
        <div className="mobile-menu-bar">
          <div className="flex justify-center items-center gap-4 text-xs text-gray-600">
            <span>📱 ALSOK面接システム (デモ版)</span>
            <span>|</span>
            <span>{deviceInfo.screenWidth}×{deviceInfo.screenHeight}</span>
          </div>
        </div>
      )}
    </div>
  );
};