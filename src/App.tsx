import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { MobileOptimizedDemo } from "@/components/demo/MobileOptimizedDemo";
import { AdminDashboard } from "@/components/admin/AdminDashboard";
import { MobileApplication } from "@/components/mobile/MobileApplication";
import { PhoneContact } from "@/components/phone/PhoneContact";
import { useDeviceDetection } from "@/hooks/useDeviceDetection";
import Home from "./pages/Home";
import Chat from "./pages/Chat";
import Reserve from "./pages/Reserve";
import Admin from "./pages/Admin";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// デバイス検出とリダイレクトコンポーネント
function DeviceRouter() {
  const { isMobile } = useDeviceDetection();
  const location = useLocation();

  // URLパラメータでデバイスタイプを強制指定可能
  const searchParams = new URLSearchParams(location.search);
  const forceDevice = searchParams.get('device');
  
  if (forceDevice === 'mobile') {
    return <Navigate to="/mobile" replace />;
  }
  if (forceDevice === 'admin') {
    return <Navigate to="/admin" replace />;
  }
  
  // デバイス自動判定 - モバイルの場合は電話受付画面へ
  return isMobile ? <Navigate to="/phone" replace /> : <Navigate to="/admin" replace />;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* 完全分離型システム */}
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/mobile" element={<MobileApplication />} />
          <Route path="/phone" element={
            <PhoneContact onSmsComplete={(phone, name) => {
              console.log('SMS送信完了:', phone, name);
            }} />
          } />
          
          {/* レスポンシブデモ（既存システム） */}
          <Route path="/demo" element={
            <MobileOptimizedDemo>
              <div />
            </MobileOptimizedDemo>
          } />
          
          {/* 既存ページ */}
          <Route path="/home" element={<Home />} />
          <Route path="/chat" element={<Chat />} />
          <Route path="/reserve" element={<Reserve />} />
          <Route path="/admin-old" element={<Admin />} />
          
          {/* ルート - デバイス判定でリダイレクト */}
          <Route path="/" element={<DeviceRouter />} />
          
          {/* 404 */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
