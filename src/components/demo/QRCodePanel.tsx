import { useState, useEffect } from "react";
import { Smartphone, Copy, Users, Wifi, WifiOff, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import QRCode from "qrcode-generator";

interface QRCodePanelProps {
  isVisible?: boolean;
}

interface ConnectedDevice {
  id: string;
  userAgent: string;
  connectedAt: string;
  lastActivity: string;
}

export const QRCodePanel = ({ isVisible = true }: QRCodePanelProps) => {
  const [qrCodeDataURL, setQrCodeDataURL] = useState<string>("");
  const [mobileUrl, setMobileUrl] = useState<string>("");
  const [connectedDevices, setConnectedDevices] = useState<ConnectedDevice[]>([]);
  const [isCollapsed, setIsCollapsed] = useState(false);

  // デモモードチェック
  const DEMO_MODE = import.meta.env.VITE_DEMO_MODE === 'true';
  
  if (!DEMO_MODE || !isVisible) return null;

  useEffect(() => {
    generateQRCode();
    simulateDeviceConnections();
  }, []);

  const generateQRCode = () => {
    // モバイル最適化URLを生成
    const baseUrl = window.location.origin + window.location.pathname;
    const mobileOptimizedUrl = `${baseUrl}?mobile=true&demo=true&t=${Date.now()}`;
    setMobileUrl(mobileOptimizedUrl);

    // QRコード生成
    const qr = QRCode(0, 'M');
    qr.addData(mobileOptimizedUrl);
    qr.make();

    // SVGを生成してData URLに変換
    const cellSize = 4;
    const margin = cellSize * 4;
    const moduleCount = qr.getModuleCount();
    const size = moduleCount * cellSize + margin * 2;

    let svg = `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">`;
    svg += `<rect width="${size}" height="${size}" fill="white"/>`;
    
    for (let row = 0; row < moduleCount; row++) {
      for (let col = 0; col < moduleCount; col++) {
        if (qr.isDark(row, col)) {
          const x = col * cellSize + margin;
          const y = row * cellSize + margin;
          svg += `<rect x="${x}" y="${y}" width="${cellSize}" height="${cellSize}" fill="black"/>`;
        }
      }
    }
    svg += '</svg>';

    const dataURL = `data:image/svg+xml;base64,${btoa(svg)}`;
    setQrCodeDataURL(dataURL);
  };

  const simulateDeviceConnections = () => {
    // デモ用デバイス接続シミュレーション
    const devices = [
      {
        id: 'device_001',
        userAgent: 'iPhone 15 Pro',
        connectedAt: new Date().toLocaleTimeString('ja-JP'),
        lastActivity: new Date().toLocaleTimeString('ja-JP')
      }
    ];
    
    // URLパラメータでmobile=trueがある場合は接続中として扱う
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('mobile') === 'true') {
      setConnectedDevices(devices);
    } else {
      setConnectedDevices([]);
    }

    // デモ用の接続状態変更イベントリスナー
    const handleMobileConnection = (event: CustomEvent) => {
      if (event.detail.connected) {
        setConnectedDevices(prev => [...prev, event.detail.device]);
        toast.success("📱 スマートフォンが接続されました", {
          description: `${event.detail.device.userAgent} - ${event.detail.device.connectedAt}`
        });
      }
    };

    window.addEventListener('demo-mobile-connected', handleMobileConnection as EventListener);
    return () => {
      window.removeEventListener('demo-mobile-connected', handleMobileConnection as EventListener);
    };
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(mobileUrl);
      toast.success("📋 URLをコピーしました", {
        description: "スマートフォンのブラウザに貼り付けてアクセスできます"
      });
    } catch (error) {
      toast.error("コピーに失敗しました");
    }
  };

  const refreshQRCode = () => {
    generateQRCode();
    toast.success("🔄 QRコードを更新しました");
  };

  return (
    <div className="fixed top-4 right-4 z-40 max-w-sm">
      <Card className="shadow-xl border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-white">
        <CardHeader 
          className="pb-3 bg-blue-600 text-white rounded-t-lg cursor-pointer"
          onClick={() => setIsCollapsed(!isCollapsed)}
        >
          <CardTitle className="flex items-center gap-2 text-sm">
            <Smartphone className="w-5 h-5" />
            📱 スマホでアクセス
            <div className="ml-auto flex items-center gap-1">
              {connectedDevices.length > 0 ? (
                <>
                  <Wifi className="w-4 h-4" />
                  <Badge variant="secondary" className="bg-green-100 text-green-700">
                    {connectedDevices.length}台接続中
                  </Badge>
                </>
              ) : (
                <>
                  <WifiOff className="w-4 h-4" />
                  <Badge variant="secondary" className="bg-gray-100 text-gray-600">
                    待機中
                  </Badge>
                </>
              )}
            </div>
          </CardTitle>
        </CardHeader>

        {!isCollapsed && (
          <CardContent className="p-4">
            {/* QRコード表示 */}
            <div className="text-center mb-4">
              <div className="inline-block p-3 bg-white rounded-lg shadow-inner border">
                {qrCodeDataURL && (
                  <img 
                    src={qrCodeDataURL} 
                    alt="QR Code for mobile access"
                    className="w-32 h-32"
                  />
                )}
              </div>
              <p className="text-xs text-gray-600 mt-2">
                📷 QRコードをスキャンしてください
              </p>
            </div>

            {/* 接続状態表示 */}
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-2">
                <Users className="w-4 h-4 text-gray-500" />
                <span className="text-sm font-medium">接続デバイス</span>
              </div>
              
              {connectedDevices.length > 0 ? (
                <div className="space-y-2">
                  {connectedDevices.map(device => (
                    <div key={device.id} className="bg-green-50 border border-green-200 rounded-lg p-2">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                        <span className="text-sm font-medium text-green-700">
                          {device.userAgent}
                        </span>
                      </div>
                      <div className="text-xs text-green-600 ml-4">
                        接続: {device.connectedAt}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-center">
                  <div className="text-sm text-gray-500">
                    📱 スマートフォンの接続を待機中...
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    QRコードをスキャンしてください
                  </div>
                </div>
              )}
            </div>

            {/* アクション ボタン */}
            <div className="space-y-2">
              <Button
                onClick={copyToClipboard}
                variant="outline"
                size="sm"
                className="w-full"
              >
                <Copy className="w-4 h-4 mr-2" />
                URLをコピー
              </Button>
              
              <Button
                onClick={refreshQRCode}
                variant="outline"
                size="sm"
                className="w-full"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                QRコード更新
              </Button>
            </div>

            {/* URL表示 (デバッグ用) */}
            <details className="mt-3">
              <summary className="text-xs cursor-pointer text-gray-500 hover:text-gray-700">
                📋 デバッグ情報
              </summary>
              <div className="mt-2 p-2 bg-gray-50 rounded text-xs font-mono break-all">
                {mobileUrl}
              </div>
            </details>
          </CardContent>
        )}
      </Card>
    </div>
  );
};