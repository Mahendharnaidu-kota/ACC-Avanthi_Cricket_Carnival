import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { getSignInError, useAuth } from '../auth/AuthContext'

interface AdminLoginModalProps {
  open: boolean
  onClose: () => void
}

export function AdminLoginModal({ open, onClose }: AdminLoginModalProps) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const { authenticate } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (!open) return
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [open, onClose])

  useEffect(() => {
    if (!open) {
      setError('')
      setPassword('')
    }
  }, [open])

  if (!open) return null

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      await authenticate('admin', { username, password })
      setUsername('')
      setPassword('')
      onClose()
      navigate('/admin', { replace: true })
    } catch (loginError) {
      setError(getSignInError(loginError))
    } finally {
      setSubmitting(false)
    }
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
            <input autoFocus name="username" autoComplete="username" required value={username} onChange={(event) => { setUsername(event.target.value); setError('') }} className="mt-2 w-full rounded-xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-300/70 focus:ring-2 focus:ring-cyan-300/15" placeholder="Admin username" />
          </label>
          <label className="block text-sm font-semibold text-slate-200">
            Password
            <input name="password" type="password" autoComplete="current-password" required value={password} onChange={(event) => { setPassword(event.target.value); setError('') }} className="mt-2 w-full rounded-xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-300/70 focus:ring-2 focus:ring-cyan-300/15" placeholder="Password" />
          </label>
          <button type="submit" disabled={submitting} className="w-full rounded-xl bg-cyan-300 px-4 py-3 font-extrabold text-slate-950 transition hover:bg-cyan-200 disabled:cursor-wait disabled:opacity-60">{submitting ? 'Signing in…' : 'Login'}</button>
          {error && <p role="alert" className="rounded-lg border border-rose-300/20 bg-rose-300/[.07] px-3 py-2 text-sm text-rose-200">{error}</p>}
        </form>
      </section>
    </div>
  )
}
