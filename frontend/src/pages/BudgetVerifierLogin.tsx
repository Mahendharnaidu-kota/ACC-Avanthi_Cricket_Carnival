import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { getSignInError, useAuth } from '../auth/AuthContext'

export function BudgetVerifierLogin() {
  const { authenticate } = useAuth()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      await authenticate('verifier', { username, password })
    } catch (loginError) {
      setError(getSignInError(loginError))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="relative isolate flex min-h-[calc(100svh-76px)] items-center justify-center overflow-hidden bg-[#07131c] px-4 py-10 sm:px-7">
      <div className="stadium-grid pointer-events-none absolute inset-0 -z-20 opacity-40" />
      <div className="stadium-light pointer-events-none absolute inset-x-[-35%] bottom-[-15%] -z-10 h-[75%] opacity-45" />
      <section className="w-full max-w-md rounded-3xl border border-cyan-200/15 bg-slate-950/65 p-6 shadow-[0_0_75px_rgba(34,211,238,.1)] sm:p-8">
        <p className="text-xs font-bold uppercase tracking-[.24em] text-cyan-300">Secure access</p>
        <h1 className="mt-2 font-display text-3xl font-black text-white sm:text-4xl">Budget Verifier</h1>
        <p className="mt-3 text-sm leading-6 text-slate-400">Sign in with your verifier credentials to review registrations and update payment status.</p>

        <form onSubmit={handleSubmit} className="mt-7 space-y-4">
          <label className="block text-sm font-semibold text-slate-200">
            Username
            <input autoFocus name="username" autoComplete="username" required value={username} onChange={(event) => { setUsername(event.target.value); setError('') }} placeholder="Verifier username" className="mt-2 w-full rounded-xl border border-white/10 bg-slate-950/80 px-4 py-3 text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-300/70 focus:ring-2 focus:ring-cyan-300/15" />
          </label>
          <label className="block text-sm font-semibold text-slate-200">
            Password
            <input name="password" type="password" autoComplete="current-password" required value={password} onChange={(event) => { setPassword(event.target.value); setError('') }} placeholder="Password" className="mt-2 w-full rounded-xl border border-white/10 bg-slate-950/80 px-4 py-3 text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-300/70 focus:ring-2 focus:ring-cyan-300/15" />
          </label>
          {error && <p role="alert" className="rounded-lg border border-rose-300/20 bg-rose-300/[.07] px-3 py-2 text-sm text-rose-200">{error}</p>}
          <button type="submit" disabled={submitting} className="w-full rounded-xl bg-cyan-300 px-4 py-3 font-extrabold text-slate-950 transition hover:bg-cyan-200 disabled:cursor-wait disabled:opacity-60">
            {submitting ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
        <Link to="/" className="mt-5 inline-flex text-sm font-semibold text-slate-400 transition hover:text-cyan-100">← Return to home</Link>
      </section>
    </main>
  )
}
