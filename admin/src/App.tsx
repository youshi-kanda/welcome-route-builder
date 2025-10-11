import { useState } from 'react'
import { Toaster } from 'sonner'
import Dashboard from './pages/Dashboard'
import Settings from './pages/Settings'
import { Button } from './components/ui/button'
import { LayoutDashboard, Settings as SettingsIcon } from 'lucide-react'

function App() {
  const [currentPage, setCurrentPage] = useState<'dashboard' | 'settings'>('dashboard')
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダーナビゲーション */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold">ALSOK管理画面</h1>
            </div>
            <nav className="flex gap-2">
              <Button
                variant={currentPage === 'dashboard' ? 'default' : 'ghost'}
                onClick={() => setCurrentPage('dashboard')}
                className="gap-2"
              >
                <LayoutDashboard className="h-4 w-4" />
                ダッシュボード
              </Button>
              <Button
                variant={currentPage === 'settings' ? 'default' : 'ghost'}
                onClick={() => setCurrentPage('settings')}
                className="gap-2"
              >
                <SettingsIcon className="h-4 w-4" />
                設定
              </Button>
            </nav>
          </div>
        </div>
      </header>
      
      {/* メインコンテンツ */}
      <main>
        {currentPage === 'dashboard' ? <Dashboard /> : <Settings />}
      </main>
      
      <Toaster position="top-right" richColors />
    </div>
  )
}

export default App

