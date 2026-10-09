import axios from 'axios'
import { useEffect, useMemo, useState } from 'react'
import { playersApi } from '../api/client'
import type { Course, PaymentStatus, Player } from '../api/types'
import { useAuth } from '../auth/AuthContext'

const courses: Course[] = ['BTech', 'Diploma', 'MCA', 'MBA', 'MTech']
const branchesByCourse: Record<Course, string[]> = {
  BTech: ['CSE', 'CSM', 'CSD', 'ECE', 'EEE', 'MECH'],
  Diploma: ['CM', 'EC', 'EE', 'M'],
  MBA: ['General'],
  MCA: ['General'],
  MTech: ['General'],
}
const years = [1, 2, 3, 4] as const
const yearLabel = (year: number) => `${year}${year === 1 ? 'st' : year === 2 ? 'nd' : year === 3 ? 'rd' : 'th'} Year`

function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const detail = (error.response?.data as { detail?: unknown } | undefined)?.detail
    if (typeof detail === 'string') return detail
    if (Array.isArray(detail)) {
      const messages = detail
        .map((item) => (typeof item === 'object' && item !== null && 'msg' in item ? String(item.msg) : ''))
        .filter(Boolean)
      if (messages.length) return messages.join('; ')
    }
    return error.message || 'The request could not be completed.'
  }
  return error instanceof Error ? error.message : 'The request could not be completed.'
}

function PlayerPhoto({ player }: { player: Player }) {
  const [failed, setFailed] = useState(false)

  if (failed) {
    return <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border border-cyan-200/15 bg-cyan-300/10 text-lg font-black text-cyan-100" aria-label={`No photo available for ${player.name}`}>{player.name.charAt(0).toUpperCase()}</div>
  }

  return <img src={player.photo_url} alt={`${player.name}`} onError={() => setFailed(true)} className="h-14 w-14 shrink-0 rounded-xl border border-white/10 bg-slate-900 object-cover" />
}

export function BudgetPage() {
  const { logout } = useAuth()
  const [course, setCourse] = useState<Course | null>(null)
  const [year, setYear] = useState<number | null>(null)
  const [branch, setBranch] = useState<string | null>(null)
  const [players, setPlayers] = useState<Player[]>([])
  const [loading, setLoading] = useState(false)
  const [loadError, setLoadError] = useState('')
  const [actionError, setActionError] = useState('')
  const [retryCount, setRetryCount] = useState(0)
  const [updatingPlayers, setUpdatingPlayers] = useState<Set<number>>(() => new Set())

  const branches = useMemo(() => (course ? branchesByCourse[course] : []), [course])
  const selectedPath = [course, year === null ? null : yearLabel(year), branch].filter(Boolean).join(' > ')

  useEffect(() => {
    if (!course || year === null || !branch) {
      setPlayers([])
      setLoading(false)
      setLoadError('')
      return
    }

    let isCurrentRequest = true
    setLoading(true)
    setLoadError('')
    setActionError('')
    playersApi.list({ course, year, branch })
      .then((result) => {
        if (isCurrentRequest) setPlayers(result)
      })
      .catch((error: unknown) => {
        if (isCurrentRequest) {
          setPlayers([])
          setLoadError(getErrorMessage(error))
        }
      })
      .finally(() => {
        if (isCurrentRequest) setLoading(false)
      })

    return () => { isCurrentRequest = false }
  }, [course, year, branch, retryCount])

  const goBack = () => {
    setActionError('')
    if (branch !== null) {
      setBranch(null)
    } else if (year !== null) {
      setYear(null)
    } else {
      setCourse(null)
    }
  }

  const selectCourse = (nextCourse: Course) => {
    setCourse(nextCourse)
    setYear(null)
    setBranch(null)
    setPlayers([])
    setActionError('')
  }

  const updatePlayerPayment = async (player: Player, paymentStatus: PaymentStatus) => {
    const previousStatus = player.payment_status
    setActionError('')
    setUpdatingPlayers((current) => new Set(current).add(player.id))
    setPlayers((current) => current.map((item) => item.id === player.id ? { ...item, payment_status: paymentStatus } : item))

    try {
      const updated = await playersApi.updatePayment(player.id, paymentStatus)
      setPlayers((current) => current.map((item) => item.id === updated.id ? updated : item))
    } catch (error) {
      setPlayers((current) => current.map((item) => item.id === player.id ? { ...item, payment_status: previousStatus } : item))
      setActionError(`${player.name}: ${getErrorMessage(error)}`)
    } finally {
      setUpdatingPlayers((current) => {
        const next = new Set(current)
        next.delete(player.id)
        return next
      })
    }
  }

  return (
    <main className="relative isolate min-h-[calc(100svh-76px)] overflow-hidden bg-[#07131c] px-4 py-10 sm:px-7 sm:py-14 lg:px-10">
      <div className="stadium-grid pointer-events-none absolute inset-0 -z-20 opacity-35" />
      <div className="stadium-light pointer-events-none absolute inset-x-[-35%] bottom-[-20%] -z-10 h-[70%] opacity-45" />

      <div className="mx-auto max-w-6xl">
        <header className="mb-9 flex flex-col gap-5 border-b border-white/10 pb-7 sm:mb-10 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[.28em] text-cyan-300">ACC Administration</p>
            <h1 className="mt-2 font-display text-4xl font-black text-white sm:text-5xl">Budget Verifier</h1>
            <p className="mt-2 max-w-xl text-sm leading-6 text-slate-400">Review player registrations and update their fee payment status.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {course && (
              <button type="button" onClick={goBack} className="inline-flex w-fit items-center gap-2 rounded-xl border border-white/15 bg-white/[.04] px-4 py-2.5 text-sm font-bold text-slate-200 transition hover:border-cyan-200/40 hover:bg-white/[.08]">
                <span aria-hidden="true">←</span> Back
              </button>
            )}
            <button type="button" onClick={logout} className="inline-flex w-fit items-center gap-2 rounded-xl border border-rose-200/20 bg-rose-300/[.05] px-4 py-2.5 text-sm font-bold text-rose-100 transition hover:border-rose-200/40 hover:bg-rose-300/10">
              Logout
            </button>
          </div>
        </header>

        {selectedPath && (
          <nav aria-label="Current selection" className="mb-7 flex flex-wrap items-center gap-2 text-sm">
            <span className="font-semibold text-slate-500">Selection</span>
            {selectedPath.split(' > ').map((part, index) => (
              <span key={`${part}-${index}`} className="flex items-center gap-2">
                <span className="text-slate-600" aria-hidden="true">›</span>
                <span className={index === selectedPath.split(' > ').length - 1 ? 'font-bold text-cyan-100' : 'text-slate-300'}>{part}</span>
              </span>
            ))}
          </nav>
        )}

        <section className="rounded-3xl border border-white/10 bg-slate-950/45 p-4 shadow-[0_22px_70px_rgba(0,0,0,.25)] sm:p-7">
          <div>
            <div className="mb-3 flex items-center gap-3">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-cyan-300 text-xs font-black text-slate-950">1</span>
              <h2 className="text-sm font-bold uppercase tracking-[.16em] text-slate-100">Choose course</h2>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
              {courses.map((item) => (
                <button key={item} type="button" aria-pressed={course === item} onClick={() => selectCourse(item)} className={`rounded-xl border px-3 py-3 text-sm font-bold transition sm:py-3.5 ${course === item ? 'border-cyan-200/60 bg-cyan-300/15 text-cyan-100 shadow-[0_0_24px_rgba(34,211,238,.1)]' : 'border-white/10 bg-white/[.03] text-slate-300 hover:border-cyan-200/30 hover:bg-white/[.07]'}`}>
                  {item}
                </button>
              ))}
            </div>
          </div>

          {course && (
            <div className="mt-8 border-t border-white/10 pt-6">
              <div className="mb-3 flex items-center gap-3">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-cyan-300 text-xs font-black text-slate-950">2</span>
                <h2 className="text-sm font-bold uppercase tracking-[.16em] text-slate-100">Choose year</h2>
              </div>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {years.map((item) => (
                  <button key={item} type="button" aria-pressed={year === item} onClick={() => { setYear(item); setBranch(null); setPlayers([]); setActionError('') }} className={`rounded-xl border px-4 py-3 text-sm font-bold transition ${year === item ? 'border-emerald-200/60 bg-emerald-300/10 text-emerald-100' : 'border-white/10 bg-white/[.03] text-slate-300 hover:border-emerald-200/30 hover:bg-white/[.06]'}`}>
                    {yearLabel(item)}
                  </button>
                ))}
              </div>
            </div>
          )}

          {course && year !== null && (
            <div className="mt-7 border-t border-white/10 pt-6">
              <div className="mb-3 flex items-center gap-3">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-cyan-300 text-xs font-black text-slate-950">3</span>
                <h2 className="text-sm font-bold uppercase tracking-[.16em] text-slate-100">Choose {course === 'BTech' || course === 'Diploma' ? 'branch' : 'program branch'}</h2>
              </div>
              <div className="flex flex-wrap gap-2">
                {branches.map((item) => (
                  <button key={item} type="button" aria-pressed={branch === item} onClick={() => { setBranch(item); setActionError('') }} className={`min-w-20 rounded-full border px-5 py-2.5 text-sm font-bold transition ${branch === item ? 'border-cyan-200/60 bg-cyan-300 text-slate-950 shadow-[0_0_22px_rgba(34,211,238,.18)]' : 'border-white/10 bg-white/[.03] text-slate-300 hover:border-cyan-200/40 hover:text-white'}`}>
                    {item}
                  </button>
                ))}
              </div>
            </div>
          )}
        </section>

        {course && year !== null && branch && (
          <section className="mt-8" aria-live="polite">
            <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[.2em] text-cyan-300">Registered players</p>
                <h2 className="mt-1 text-2xl font-black text-white">{branch} <span className="font-medium text-slate-400">· {course} · {yearLabel(year)}</span></h2>
              </div>
              {!loading && !loadError && <span className="text-sm text-slate-400">{players.length} {players.length === 1 ? 'player' : 'players'}</span>}
            </div>

            {actionError && <p role="alert" className="mb-4 rounded-xl border border-rose-300/25 bg-rose-300/[.07] px-4 py-3 text-sm font-medium text-rose-200">{actionError}</p>}

            {loading ? (
              <div className="flex items-center justify-center gap-3 rounded-2xl border border-white/10 bg-white/[.025] px-4 py-12 text-sm font-medium text-slate-300">
                <span className="h-5 w-5 animate-spin rounded-full border-2 border-cyan-200/25 border-t-cyan-200" aria-hidden="true" />
                Loading registered players…
              </div>
            ) : loadError ? (
              <div className="rounded-2xl border border-rose-300/25 bg-rose-400/[.06] px-5 py-7 text-center">
                <p className="font-semibold text-rose-200">Could not load players</p>
                <p className="mt-2 text-sm text-rose-100/75">{loadError}</p>
                <button type="button" onClick={() => setRetryCount((count) => count + 1)} className="mt-5 rounded-lg border border-rose-200/30 px-4 py-2 text-sm font-bold text-rose-100 transition hover:bg-rose-200/10">Try again</button>
              </div>
            ) : players.length === 0 ? (
              <div className="rounded-2xl border border-white/10 bg-white/[.025] px-5 py-12 text-center">
                <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-cyan-200/20 bg-cyan-300/[.06] text-xl text-cyan-200" aria-hidden="true">⌕</span>
                <p className="mt-4 text-base font-bold text-slate-100">No players registered here</p>
                <p className="mt-1 text-sm text-slate-500">Try another course, year, or branch.</p>
              </div>
            ) : (
              <div className="overflow-hidden rounded-2xl border border-white/10 bg-slate-950/40">
                <div className="hidden grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-5 border-b border-white/10 px-5 py-3 text-[11px] font-bold uppercase tracking-[.16em] text-slate-500 sm:grid">
                  <span>Player</span><span>Update payment</span><span className="min-w-28 text-center">Status</span>
                </div>
                <ul className="divide-y divide-white/[.07]">
                  {players.map((player) => {
                    const isUpdating = updatingPlayers.has(player.id)
                    const isPaid = player.payment_status === 'paid'
                    return (
                      <li key={player.id} className="grid gap-4 px-4 py-4 sm:grid-cols-[minmax(0,1fr)_auto_auto] sm:items-center sm:gap-5 sm:px-5">
                        <div className="flex min-w-0 items-center gap-3">
                          <PlayerPhoto player={player} />
                          <div className="min-w-0">
                            <p className="truncate font-bold text-white">{player.name}</p>
                            <p className="mt-1 text-xs text-slate-400">Roll No. <span className="font-medium text-slate-300">{player.roll_number}</span></p>
                          </div>
                        </div>

                        <div className="flex gap-2" aria-label={`Update payment for ${player.name}`}>
                          <button type="button" disabled={isUpdating} aria-pressed={isPaid} onClick={() => updatePlayerPayment(player, 'paid')} className={`min-w-20 rounded-lg border px-3 py-2 text-xs font-bold transition disabled:cursor-wait disabled:opacity-50 ${isPaid ? 'border-emerald-300/50 bg-emerald-300/15 text-emerald-100' : 'border-white/10 bg-white/[.04] text-slate-300 hover:border-emerald-200/40 hover:text-emerald-100'}`}>
                            {isUpdating && isPaid ? 'Saving…' : 'Paid'}
                          </button>
                          <button type="button" disabled={isUpdating} aria-pressed={!isPaid} onClick={() => updatePlayerPayment(player, 'not_paid')} className={`min-w-20 rounded-lg border px-3 py-2 text-xs font-bold transition disabled:cursor-wait disabled:opacity-50 ${!isPaid ? 'border-rose-300/45 bg-rose-300/10 text-rose-100' : 'border-white/10 bg-white/[.04] text-slate-300 hover:border-rose-200/40 hover:text-rose-100'}`}>
                            {isUpdating && !isPaid ? 'Saving…' : 'Not Paid'}
                          </button>
                        </div>

                        <div className="flex items-center justify-between gap-3 sm:min-w-28 sm:justify-center">
                          <span className="text-xs font-semibold text-slate-500 sm:hidden">Current status</span>
                          <span className={`inline-flex min-w-24 items-center justify-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-bold ${isPaid ? 'border-emerald-300/25 bg-emerald-300/10 text-emerald-200' : 'border-rose-300/25 bg-rose-300/[.08] text-rose-200'}`}>
                            <span className={`h-1.5 w-1.5 rounded-full ${isPaid ? 'bg-emerald-300' : 'bg-rose-300'}`} aria-hidden="true" />
                            {isPaid ? 'Paid' : 'Not Paid'}
                          </span>
                        </div>
                      </li>
                    )
                  })}
                </ul>
              </div>
            )}
          </section>
        )}
      </div>
    </main>
  )
}
