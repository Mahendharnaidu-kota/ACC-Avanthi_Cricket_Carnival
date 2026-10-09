import { useState } from 'react'
import { Link, NavLink } from 'react-router-dom'

const links = [
  { label: 'Player Register', to: '/register' },
  { label: 'Budget Verifier', to: '/budget' },
  { label: 'View Players', to: '/players' },
  { label: 'View Team', to: '/teams' },
  { label: 'Watch Live', to: '/live' },
]

interface NavbarProps {
  onAdminLogin: () => void
}

export function Navbar({ onAdminLogin }: NavbarProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [collegeLogoUnavailable, setCollegeLogoUnavailable] = useState(false)

  const closeMenu = () => setMenuOpen(false)
  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `rounded-full px-3 py-2 text-sm font-semibold transition-colors ${isActive ? 'text-cyan-200' : 'text-slate-300 hover:text-white'}`

  return (
    <header className="relative z-30 border-b border-white/10 bg-[#07111dcc] shadow-[0_8px_40px_rgba(0,0,0,.25)] backdrop-blur-xl">
      <div className="mx-auto flex min-h-[76px] w-full max-w-[1600px] items-center justify-between gap-4 px-4 py-3 sm:px-7 lg:px-10">
        <Link to="/" onClick={closeMenu} aria-label="Avanthi Cricket Carnival home" className="flex shrink-0 items-center">
          {collegeLogoUnavailable ? (
            <span className="flex min-h-12 flex-col justify-center border-l-2 border-cyan-300 pl-3 sm:min-h-14">
              <span className="text-sm font-black tracking-wide text-white">AVANTHI</span>
              <span className="text-[9px] font-semibold uppercase tracking-[.14em] text-cyan-200">Institute of Engineering</span>
            </span>
          ) : (
            <span className="flex h-14 w-14 items-center justify-center rounded-xl bg-white p-1.5 shadow-[0_0_18px_rgba(255,255,255,.08)]">
              <img src="/Avanthi-logo.jpeg" alt="Avanthi Institute of Engineering" onError={() => setCollegeLogoUnavailable(true)} className="h-full w-full object-contain" />
            </span>
          )}
        </Link>

        <nav aria-label="Main navigation" className="hidden items-center gap-1 xl:flex">
          {links.map((link) => (
            <NavLink key={link.to} to={link.to} className={linkClass}>
              {link.label}
            </NavLink>
          ))}
        </nav>

        <button
          type="button"
          onClick={onAdminLogin}
          className="hidden shrink-0 rounded-full border border-cyan-300/60 bg-cyan-300/10 px-5 py-2.5 text-sm font-bold text-cyan-100 shadow-[0_0_24px_rgba(34,211,238,.12)] transition hover:border-cyan-200 hover:bg-cyan-300/20 xl:inline-flex"
        >
          Admin Login
        </button>

        <button
          type="button"
          className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-white/15 bg-white/5 text-slate-100 transition hover:bg-white/10 xl:hidden"
          aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'}
          aria-expanded={menuOpen}
          aria-controls="mobile-navigation"
          onClick={() => setMenuOpen((open) => !open)}
        >
          <span className="flex w-5 flex-col gap-1.5" aria-hidden="true">
            <span className={`h-0.5 rounded bg-current transition ${menuOpen ? 'translate-y-2 rotate-45' : ''}`} />
            <span className={`h-0.5 rounded bg-current transition ${menuOpen ? 'opacity-0' : ''}`} />
            <span className={`h-0.5 rounded bg-current transition ${menuOpen ? '-translate-y-2 -rotate-45' : ''}`} />
          </span>
        </button>
      </div>

      {menuOpen && (
        <nav id="mobile-navigation" aria-label="Mobile navigation" className="border-t border-white/10 bg-[#07111d] px-4 pb-5 pt-3 xl:hidden">
          <div className="mx-auto grid max-w-2xl grid-cols-2 gap-2 sm:grid-cols-3">
            {links.map((link) => (
              <NavLink key={link.to} to={link.to} onClick={closeMenu} className={({ isActive }) => `rounded-xl border px-3 py-3 text-center text-sm font-semibold transition ${isActive ? 'border-cyan-300/50 bg-cyan-300/10 text-cyan-100' : 'border-white/10 bg-white/[.03] text-slate-300 hover:bg-white/[.08]'}`}>
                {link.label}
              </NavLink>
            ))}
            <button
              type="button"
              onClick={() => { closeMenu(); onAdminLogin() }}
              className="col-span-2 rounded-xl border border-cyan-300/50 bg-cyan-300/10 px-3 py-3 text-sm font-bold text-cyan-100 sm:col-span-1"
            >
              Admin Login
            </button>
          </div>
        </nav>
      )}
    </header>
  )
}
