import { useState } from 'react'
import { createBrowserRouter, Outlet, RouterProvider } from 'react-router-dom'
import { AdminLoginModal } from './components/AdminLoginModal'
import { Navbar } from './components/Navbar'
import { HomePage } from './pages/HomePage'

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
      { path: '/register', element: <PagePlaceholder title="Player Register" /> },
      { path: '/budget', element: <PagePlaceholder title="Budget Verifier" /> },
      { path: '/players', element: <PagePlaceholder title="View Players" /> },
      { path: '/teams', element: <PagePlaceholder title="View Team" /> },
      { path: '/live', element: <PagePlaceholder title="Watch Live" /> },
      { path: '/admin', element: <PagePlaceholder title="Admin Dashboard" /> },
      { path: '/admin/teams', element: <PagePlaceholder title="Assign Teams" /> },
      { path: '/admin/players', element: <PagePlaceholder title="Manage Players" /> },
      { path: '/admin/auction', element: <PagePlaceholder title="Start Auction" /> },
      { path: '*', element: <PagePlaceholder title="Page not found" /> },
    ],
  },
])

export default function App() {
  return <RouterProvider router={router} />
}
