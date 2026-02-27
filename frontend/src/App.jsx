import { Toaster } from 'react-hot-toast'
import AppRoutes from './routes/AppRoutes.jsx'
import InternalMessageDrawer from './components/layout/InternalMessageDrawer'
import { GlobalDataProvider } from './context/GlobalDataContext'

function App() {
  return (
    <GlobalDataProvider>
      <Toaster position="top-right" />
      <AppRoutes />
      <InternalMessageDrawer />
    </GlobalDataProvider>
  )
}

export default App
