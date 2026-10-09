import { useEffect, useState, type FormEvent } from 'react'

interface AdminLoginModalProps {
  open: boolean
  onClose: () => void
}

export function AdminLoginModal({ open, onClose }: AdminLoginModalProps) {
  const [notice, setNotice] = useState('')

  useEffect(() => {
    if (!open) return
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [open, onClose])

  if (!open) return null

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setNotice('Admin sign-in will be connected in Step 6.')
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 px-4 py-8 backdrop-blur-md"
      onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}
    >
      <section role="dialog" aria-modal="true" aria-labelledby="admin-login-title" className="relative w-full max-w-md rounded-3xl border border-cyan-200/20 bg-[#0a1522] p-6 shadow-[0_0_80px_rgba(34,211,238,.16)] sm:p-8">
        <button type="button" onClick={onClose} aria-label="Close admin login" className="absolute right-4 top-4 rounded-lg px-3 py-1 text-2xl leading-none text-slate-400 transition hover:bg-white/10 hover:text-white">×</button>
        <p className="text-xs font-bold uppercase tracking-[.24em] text-cyan-300">Restricted area</p>
        <h2 id="admin-login-title" className="mt-2 font-display text-3xl font-black text-white">Admin Login</h2>
        <p className="mt-2 text-sm leading-6 text-slate-400">Enter your administrator credentials to continue.</p>
        <form onSubmit={handleSubmit} className="mt-7 space-y-4">
          <label className="block text-sm font-semibold text-slate-200">
            Username
            <input autoFocus name="username" autoComplete="username" required className="mt-2 w-full rounded-xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-300/70 focus:ring-2 focus:ring-cyan-300/15" placeholder="Admin username" />
          </label>
          <label className="block text-sm font-semibold text-slate-200">
            Password
            <input name="password" type="password" autoComplete="current-password" required className="mt-2 w-full rounded-xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-300/70 focus:ring-2 focus:ring-cyan-300/15" placeholder="Password" />
          </label>
          <button type="submit" className="w-full rounded-xl bg-cyan-300 px-4 py-3 font-extrabold text-slate-950 transition hover:bg-cyan-200">Login</button>
          {notice && <p role="status" className="text-sm text-cyan-200">{notice}</p>}
        </form>
      </section>
    </div>
  )
}
