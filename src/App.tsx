import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useAuth } from './contexts/AuthContext'
import { ChatPage } from './pages/ChatPage'
import { WidgetChatPage } from './pages/WidgetChatPage'
import { AuthPage } from './pages/AuthPage'
import { AdminPage } from './pages/AdminPage'
import { LoadingScreen } from './components/ui/LoadingScreen'

function RequireAdmin({ children }: { children: React.ReactNode }) {
  const { user, isAdmin, loading } = useAuth()
  if (loading) return <LoadingScreen />
  if (!user || !isAdmin) return <Navigate to="/sign-in" replace />
  return <>{children}</>
}

export default function App() {
  const { loading } = useAuth()
  const location = useLocation()
  const isWidget = location.pathname.startsWith('/widget') || location.pathname.startsWith('/embed')

  if (loading) return <LoadingScreen />

  // Standalone embeddable chatbot mode (for iframes on other websites)
  if (isWidget) {
    return (
      <Routes>
        <Route path="/widget" element={<WidgetChatPage />} />
        <Route path="/embed" element={<WidgetChatPage />} />
        <Route path="*" element={<WidgetChatPage />} />
      </Routes>
    )
  }

  return (
    <div className="min-h-screen bg-ivory-50 flex flex-col">
      <Routes>
        {/* Primary View: AI Chatbot */}
        <Route path="/" element={<ChatPage />} />
        <Route path="/conversation" element={<ChatPage />} />

        {/* Admin Login & Management Portal */}
        <Route path="/sign-in" element={<AuthPage />} />
        <Route path="/admin-login" element={<Navigate to="/sign-in" replace />} />
        <Route
          path="/admin/*"
          element={
            <RequireAdmin>
              <AdminPage />
            </RequireAdmin>
          }
        />

        {/* Fallback to main Chatbot */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  )
}
