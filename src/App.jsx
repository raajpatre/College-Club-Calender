import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './hooks/useAuth'
import LoginPage from './pages/LoginPage'
import HomePage from './pages/HomePage'
import AdminPage from './pages/AdminPage'
import PublicCalendarPage from './pages/PublicCalendarPage'

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', flexDirection: 'column', gap: 16 }}>
      <div style={{ width: 40, height: 40, border: '3px solid var(--border)', borderTopColor: 'var(--brand-blue)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <span style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>Loading…</span>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
  if (!user) return <Navigate to="/login" replace />
  return children
}

import { useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'

function PageTransition({ children }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      style={{ height: '100%', width: '100%' }}
    >
      {children}
    </motion.div>
  )
}

function AppRoutes() {
  const { user, loading } = useAuth()
  const location = useLocation()
  if (loading) return null
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/login" element={<PageTransition>{user ? <Navigate to="/" replace /> : <LoginPage />}</PageTransition>} />
        <Route path="/public" element={<PageTransition><PublicCalendarPage /></PageTransition>} />
        <Route path="/" element={<ProtectedRoute><PageTransition><HomePage /></PageTransition></ProtectedRoute>} />
        <Route path="/admin" element={<ProtectedRoute><PageTransition><AdminPage /></PageTransition></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AnimatePresence>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  )
}
