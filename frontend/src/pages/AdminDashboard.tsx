import { Link } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'

const adminActions = [
  { label: 'Assign Team and Add Captain', to: '/admin/teams', index: '01' },
  { label: 'Start Auction', to: '/admin/auction', index: '02' },
  { label: 'Manage Players', to: '/admin/players', index: '03' },
]

export function AdminDashboard() {
  const { logout } = useAuth()

  return (
    <main className="relative isolate flex min-h-[calc(100svh-76px)] items-center overflow-hidden bg-[#07131c] px-4 py-12 sm:px-7 lg:px-10">
      <div className="stadium-grid pointer-events-none absolute inset-0 -z-20 opacity-35" />
      <div className="stadium-light pointer-events-none absolute inset-x-[-30%] bottom-[-20%] -z-10 h-[80%] opacity-50" />
      <div className="mx-auto w-full max-w-5xl">
        <header className="mb-8 flex flex-col gap-4 border-b border-white/10 pb-6 sm:mb-10 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[.28em] text-cyan-300">ACC Control Room</p>
            <h1 className="mt-2 font-display text-4xl font-black text-white sm:text-5xl">Admin Dashboard</h1>
          </div>
          <button type="button" onClick={logout} className="w-fit rounded-xl border border-rose-200/20 bg-rose-300/[.05] px-5 py-3 text-sm font-bold text-rose-100 transition hover:border-rose-200/40 hover:bg-rose-300/10">Logout</button>
        </header>
        <div className="grid gap-4 md:grid-cols-3">
          {adminActions.map((action) => (
            <Link key={action.to} to={action.to} className="group flex min-h-48 flex-col justify-between rounded-2xl border border-white/10 bg-slate-950/55 p-6 shadow-[0_18px_50px_rgba(0,0,0,.2)] transition hover:-translate-y-1 hover:border-cyan-200/40 hover:bg-cyan-300/[.05] hover:shadow-[0_22px_55px_rgba(6,182,212,.12)] focus:outline-none focus:ring-2 focus:ring-cyan-200/50 sm:p-7">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-cyan-200/20 bg-cyan-300/[.08] text-xs font-black tracking-wider text-cyan-100">{action.index}</span>
              <span className="mt-8 flex items-center justify-between gap-3 text-xl font-black text-white sm:text-2xl">
                {action.label}
                <span aria-hidden="true" className="text-cyan-200 transition group-hover:translate-x-1">→</span>
              </span>
            </Link>
          ))}
        </div>
      </div>
    </main>
  )
}
