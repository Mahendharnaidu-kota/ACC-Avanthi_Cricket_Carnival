import { useEffect, useState } from 'react'
import { createBrowserRouter, Outlet, RouterProvider, useLocation, useNavigate } from 'react-router-dom'
import { AuthProvider } from './auth/AuthContext'
import { ProtectedRoute } from './auth/ProtectedRoute'
import { AdminLoginModal } from './components/AdminLoginModal'
import { Navbar } from './components/Navbar'
import { AdminDashboard } from './pages/AdminDashboard'
import { BudgetVerifierLogin } from './pages/BudgetVerifierLogin'
import { BudgetPage } from './pages/BudgetPage'
import { AdminTeamsPage } from './pages/AdminTeamsPage'
import { AdminPlayersPage } from './pages/AdminPlayersPage'
import { AdminAuctionPage } from './pages/AdminAuctionPage'
import { HomePage } from './pages/HomePage'
import { PlayersPage } from './pages/PlayersPage'
import { RegisterPage } from './pages/RegisterPage'
import { TeamsPage } from './pages/TeamsPage'

function PagePlaceholder({ title }: { title: string }) {
  return (
    <main className="mx-auto flex min-h-[calc(100svh-5rem)] w-full max-w-7xl items-center justify-center px-5 py-16 text-center sm:px-8">
      <div className="max-w-xl rounded-3xl border border-white/10 bg-slate-950/60 p-8 shadow-2xl shadow-cyan-950/20 sm:p-12">
        <p className="mb-3 text-xs font-bold uppercase tracking-[0.28em] text-cyan-300">Avanthi Cricket Carnival</p>
        <h1 className="font-display text-3xl font-black tracking-tight text-white sm:text-5xl">{title}</h1>
        <p className="mt-4 leading-7 text-slate-400">This page will be built one feature at a time.</p>
      </div>
    </main>
  )
}

function AppLayout() {
  const [loginOpen, setLoginOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    const routeState = location.state as { openAdminLogin?: boolean } | null
    if (routeState?.openAdminLogin) {
      setLoginOpen(true)
      navigate(location.pathname, { replace: true, state: null })
    }
  }, [location.pathname, location.state, navigate])

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#050b13] text-white">
      <Navbar onAdminLogin={() => setLoginOpen(true)} />
      <Outlet />
      <AdminLoginModal open={loginOpen} onClose={() => setLoginOpen(false)} />
    </div>
  )
}

const router = createBrowserRouter([
  {
    element: <AppLayout />,
    children: [
      { path: '/', element: <HomePage /> },
      { path: '/register', element: <RegisterPage /> },
      { path: '/budget', element: <ProtectedRoute allowedRoles={['admin', 'verifier']} unauthenticatedFallback={<BudgetVerifierLogin />}><BudgetPage /></ProtectedRoute> },
      { path: '/players', element: <PlayersPage /> },
      { path: '/teams', element: <TeamsPage /> },
      { path: '/live', element: <PagePlaceholder title="Watch Live" /> },
      { path: '/admin', element: <ProtectedRoute allowedRoles={['admin']}><AdminDashboard /></ProtectedRoute> },
      { path: '/admin/teams', element: <ProtectedRoute allowedRoles={['admin']}><AdminTeamsPage /></ProtectedRoute> },
      { path: '/admin/players', element: <ProtectedRoute allowedRoles={['admin']}><AdminPlayersPage /></ProtectedRoute> },
      { path: '/admin/auction', element: <ProtectedRoute allowedRoles={['admin']}><AdminAuctionPage /></ProtectedRoute> },
      { path: '*', element: <PagePlaceholder title="Page not found" /> },
    ],
  },
])

export default function App() {
  return <AuthProvider><RouterProvider router={router} /></AuthProvider>
}
