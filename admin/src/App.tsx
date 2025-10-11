import { Toaster } from 'sonner'
import Dashboard from './pages/Dashboard'

function App() {
  return (
    <>
      <Dashboard />
      <Toaster position="top-right" richColors />
    </>
  )
}

export default App
