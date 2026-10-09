import axios from 'axios'
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { auctionApi, teamsApi } from '../api/client'
import type { AuctionCategory, AuctionCurrentPlayer, AuctionPublicState, AuctionRosterCategory, AuctionTeamSummary, Team } from '../api/types'
import { useAuctionState } from '../hooks/useAuctionState'

const categories: { label: string; value: AuctionCategory }[] = [
  { label: 'BTech 1st Year', value: 'BTech 1st' },
  { label: 'BTech 2nd Year', value: 'BTech 2nd' },
  { label: 'BTech 3rd Year', value: 'BTech 3rd' },
  { label: 'BTech 4th Year', value: 'BTech 4th' },
  { label: 'Diploma', value: 'Diploma' },
  { label: 'MCA', value: 'MCA' },
  { label: 'MBA', value: 'MBA' },
  { label: 'MTech', value: 'MTech' },
]

function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const detail = (error.response?.data as { detail?: unknown } | undefined)?.detail
    if (typeof detail === 'string') return detail
    if (Array.isArray(detail)) {
      const messages = detail.map((item) => typeof item === 'object' && item !== null && 'msg' in item ? String(item.msg) : '').filter(Boolean)
      if (messages.length) return messages.join('; ')
    }
    return error.message || 'The auction request could not be completed.'
  }
  return error instanceof Error ? error.message : 'The auction request could not be completed.'
}

function skillLabel(player: AuctionCurrentPlayer): string {
  if (player.skill_type === 'batting') {
    const styles = { 'big hitter': 'Big Hitter', 'aggressive batter': 'Aggressive Batter', 'strike rotator': 'Strike Rotator' }
    return styles[player.batting_style ?? 'strike rotator']
  }
  if (player.skill_type === 'bowling') return player.bowling_style === 'fast' ? 'Fast' : 'Spin'
  return 'All-rounder'
}

function yearLabel(year: number): string {
  return `${year}${year === 1 ? 'st' : year === 2 ? 'nd' : year === 3 ? 'rd' : 'th'} Year`
}

function PlayerPortrait({ player }: { player: AuctionCurrentPlayer }) {
  const [failed, setFailed] = useState(false)
  if (failed || !player.photo_url) {
    return <div className="flex h-28 w-28 shrink-0 items-center justify-center rounded-2xl border border-cyan-200/20 bg-cyan-300/10 text-4xl font-black text-cyan-100 sm:h-36 sm:w-36" aria-label={`No photo available for ${player.name}`}>{player.name.charAt(0).toUpperCase()}</div>
  }
  return <img src={player.photo_url} alt={player.name} onError={() => setFailed(true)} className="h-28 w-28 shrink-0 rounded-2xl border border-white/10 bg-slate-900 object-cover shadow-lg sm:h-36 sm:w-36" />
}

const rosterCategories: { key: AuctionRosterCategory; label: string }[] = [
  { key: 'BTech 1st', label: 'BTech 1st' },
  { key: 'BTech 2nd', label: 'BTech 2nd' },
  { key: 'BTech 3rd', label: 'BTech 3rd' },
  { key: 'BTech 4th', label: 'BTech 4th' },
  { key: 'Diploma', label: 'Diploma' },
  { key: 'Others', label: 'Others' },
]

function TeamUpdatesModal({ onClose, auctionState }: { onClose: () => void; auctionState: AuctionPublicState | null }) {
  const [teams, setTeams] = useState<AuctionTeamSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [retry, setRetry] = useState(0)

  const stateRevision = auctionState ? [
    auctionState.current_player?.id,
    auctionState.current_price,
    auctionState.leading_team?.id,
    auctionState.status,
    auctionState.selected_category,
    auctionState.message,
    auctionState.timer_ends_at,
  ].join('|') : 'initial'

  useEffect(() => {
    let active = true
    setLoading(true)
    setError('')
    auctionApi.teams()
      .then((result) => { if (active) setTeams(result.slice(0, 11)) })
      .catch((reason: unknown) => { if (active) setError(getErrorMessage(reason)) })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [stateRevision, retry])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-3 backdrop-blur-md sm:p-6" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}>
      <section role="dialog" aria-modal="true" aria-labelledby="team-updates-title" className="flex max-h-[94svh] w-full max-w-[1500px] flex-col overflow-hidden rounded-3xl border border-cyan-200/20 bg-[#08151f] shadow-[0_0_80px_rgba(34,211,238,.14)]">
        <header className="flex items-center justify-between gap-4 border-b border-white/10 px-5 py-5 sm:px-8 sm:py-6">
          <div><p className="text-xs font-bold uppercase tracking-[.22em] text-cyan-300">Auction control</p><h2 id="team-updates-title" className="mt-1 text-2xl font-black text-white sm:text-3xl">Team Updates</h2></div>
          <button type="button" onClick={onClose} aria-label="Close Team Updates" className="rounded-xl border border-white/15 px-3 py-1.5 text-2xl leading-none text-slate-300 transition hover:border-cyan-200/30 hover:bg-white/[.08]">×</button>
        </header>

        <div className="overflow-y-auto p-4 sm:p-7">
          {loading && <div className="rounded-2xl border border-white/10 bg-white/[.025] px-5 py-14 text-center text-slate-300" role="status">Loading team updates…</div>}
          {!loading && error && <div className="rounded-2xl border border-rose-300/20 bg-rose-400/[.06] px-5 py-10 text-center" role="alert"><p className="font-semibold text-rose-100">{error}</p><button type="button" onClick={() => setRetry((value) => value + 1)} className="mt-4 rounded-xl border border-rose-200/25 px-4 py-2.5 text-sm font-bold text-rose-100 transition hover:bg-rose-300/10">Try again</button></div>}
          {!loading && !error && teams.length === 0 && <div className="rounded-2xl border border-dashed border-white/15 bg-white/[.02] px-5 py-12 text-center text-slate-400">No teams added yet.</div>}
          {!loading && !error && teams.length > 0 && (
            <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3 2xl:gap-5">
              {teams.map((team) => (
                <article key={team.id} className="rounded-2xl border border-white/10 bg-slate-950/65 p-4 shadow-[0_18px_45px_rgba(0,0,0,.25)] sm:p-5">
                  <header className="mb-4 flex items-start justify-between gap-3 border-b border-white/10 pb-4">
                    <h3 className="break-words text-xl font-black leading-tight text-white sm:text-2xl">{team.name}</h3>
                    <span className="shrink-0 rounded-lg border border-cyan-200/20 bg-cyan-300/[.06] px-2.5 py-1.5 text-[10px] font-black uppercase tracking-wider text-cyan-100">Team {String(team.id).padStart(2, '0')}</span>
                  </header>
                  <div className="mb-4 grid grid-cols-2 gap-3">
                    <div className="rounded-xl border border-amber-200/15 bg-amber-300/[.045] px-3 py-3">
                      <p className="text-[9px] font-black uppercase tracking-[.14em] text-amber-100/70">Purse Remaining</p>
                      <p className="mt-1 text-xl font-black tabular-nums text-amber-100 sm:text-2xl">{team.purse_remaining}<span className="ml-1 text-sm font-bold text-amber-100/60">/ 1000</span></p>
                    </div>
                    <div className="rounded-xl border border-cyan-200/15 bg-cyan-300/[.045] px-3 py-3">
                      <p className="text-[9px] font-black uppercase tracking-[.14em] text-cyan-100/70">Players</p>
                      <p className="mt-1 text-xl font-black tabular-nums text-cyan-100 sm:text-2xl">{team.total_players}<span className="ml-1 text-sm font-bold text-cyan-100/60">/ {team.max_players}</span></p>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    {rosterCategories.map(({ key, label }) => {
                      const category = team.categories[key]
                      const required = key !== 'Others'
                      const met = category?.requirement_met ?? false
                      return <div key={key} className="flex min-h-10 items-center justify-between gap-3 rounded-lg border border-white/[.06] bg-white/[.025] px-3 py-2">
                        <span className="text-sm font-semibold text-slate-200 sm:text-base">{label}</span>
                        <span className="flex items-center gap-2 text-sm font-black tabular-nums text-white sm:text-base">
                          {category?.count ?? 0}
                          {required && <span aria-label={met ? 'Requirement met' : 'Requirement not met'} className={`text-lg leading-none ${met ? 'text-emerald-300' : 'text-rose-300'}`}>{met ? '✓' : '✕'}</span>}
                        </span>
                      </div>
                    })}
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>

        <footer className="flex justify-end border-t border-white/10 px-5 py-4 sm:px-8">
          <button type="button" onClick={onClose} className="rounded-xl bg-cyan-300 px-6 py-2.5 text-sm font-extrabold text-slate-950 transition hover:bg-cyan-200">Close</button>
        </footer>
      </section>
    </div>
  )
}

export function AdminAuctionPage() {
  const { state, connectionStatus, loading, error: stateError, countdownSeconds } = useAuctionState()
  const [teams, setTeams] = useState<Team[]>([])
  const [teamsLoading, setTeamsLoading] = useState(true)
  const [teamsError, setTeamsError] = useState('')
  const [category, setCategory] = useState<AuctionCategory | ''>('')
  const [actionError, setActionError] = useState('')
  const [actionWarning, setActionWarning] = useState('')
  const [busy, setBusy] = useState('')
  const [teamUpdatesOpen, setTeamUpdatesOpen] = useState(false)

  useEffect(() => {
    let active = true
    teamsApi.list()
      .then((result) => { if (active) setTeams(result.slice(0, 11)) })
      .catch((reason: unknown) => { if (active) setTeamsError(getErrorMessage(reason)) })
      .finally(() => { if (active) setTeamsLoading(false) })
    return () => { active = false }
  }, [])

  useEffect(() => {
    if (state?.selected_category && categories.some((item) => item.value === state.selected_category)) {
      setCategory(state.selected_category as AuctionCategory)
    }
  }, [state?.selected_category])

  const currentPlayer = state?.current_player ?? null
  const selectedCategoryLabel = useMemo(() => categories.find((item) => item.value === category)?.label ?? '', [category])
  const timerValue = state?.status === 'running' ? countdownSeconds : state?.status === 'idle' && currentPlayer ? 20 : 0
  const timerProgress = Math.max(0, Math.min(100, (timerValue / 20) * 100))
  const isRunning = state?.status === 'running'

  const performAction = async (action: string, request: () => Promise<unknown>) => {
    setBusy(action)
    setActionError('')
    setActionWarning('')
    try {
      await request()
    } catch (error) {
      const message = getErrorMessage(error)
      if (axios.isAxiosError(error) && error.response?.status === 400) setActionWarning(message)
      else if (axios.isAxiosError(error) && error.response?.status === 404 && message.toLowerCase().includes('no players left')) {
        setActionWarning('No players left in this category. Please choose another category.')
      } else setActionError(message)
    } finally {
      setBusy('')
    }
  }

  const selectPlayerCategory = (value: string) => {
    if (!value || !categories.some((item) => item.value === value)) return
    const nextCategory = value as AuctionCategory
    setCategory(nextCategory)
    void performAction('select', () => auctionApi.selectCategory(nextCategory))
  }

  return (
    <main className="relative isolate min-h-[calc(100svh-76px)] overflow-hidden bg-[#061019] px-4 py-6 sm:px-7 sm:py-9 lg:px-9">
      <div className="stadium-grid pointer-events-none absolute inset-0 -z-20 opacity-35" />
      <div className="stadium-light pointer-events-none absolute inset-x-[-30%] bottom-[-20%] -z-10 h-[65%] opacity-50" />

      <div className="mx-auto max-w-[1700px]">
        <header className="mb-6 flex items-center justify-between gap-4 border-b border-white/10 pb-5 sm:mb-8">
          <Link to="/admin" className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/[.04] px-4 py-2.5 text-sm font-bold text-slate-200 transition hover:border-cyan-200/40 hover:bg-white/[.08]">← <span>Back to Dashboard</span></Link>
          <div className="flex items-center gap-3">
            <span className="hidden items-center gap-2 rounded-full border border-white/10 bg-slate-950/50 px-3 py-2 text-xs font-bold uppercase tracking-[.12em] text-slate-300 sm:inline-flex">
              <span className={`h-2.5 w-2.5 rounded-full ${connectionStatus === 'live' ? 'bg-emerald-300 shadow-[0_0_12px_rgba(110,231,183,.8)]' : 'animate-pulse bg-amber-300'}`} />
              {connectionStatus === 'live' ? 'Live' : 'Reconnecting'}
            </span>
            <button type="button" onClick={() => setTeamUpdatesOpen(true)} className="rounded-xl border border-cyan-200/30 bg-cyan-300/[.08] px-4 py-2.5 text-sm font-extrabold text-cyan-100 transition hover:border-cyan-100/60 hover:bg-cyan-300/[.15] sm:px-5">Team Updates</button>
          </div>
        </header>

        <div className="mb-5 flex justify-center sm:hidden">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-slate-950/50 px-3 py-2 text-[10px] font-bold uppercase tracking-[.12em] text-slate-300">
            <span className={`h-2 w-2 rounded-full ${connectionStatus === 'live' ? 'bg-emerald-300 shadow-[0_0_10px_rgba(110,231,183,.8)]' : 'animate-pulse bg-amber-300'}`} />
            {connectionStatus === 'live' ? 'Live' : 'Reconnecting'}
          </span>
        </div>

        {(stateError || teamsError || actionError) && <div className="mb-5 rounded-xl border border-rose-300/25 bg-rose-400/[.07] px-4 py-3 text-sm font-semibold text-rose-100" role="alert">{stateError || teamsError || actionError}</div>}
        {actionWarning && <div className="mb-5 rounded-xl border border-amber-200/25 bg-amber-300/[.07] px-4 py-3 text-sm font-semibold text-amber-100" role="status">{actionWarning}</div>}

        {loading && !state ? (
          <div className="rounded-3xl border border-white/10 bg-slate-950/50 px-5 py-16 text-center text-slate-300" role="status">Loading auction state…</div>
        ) : (
          <div className="grid items-start gap-6 lg:grid-cols-[minmax(230px,0.9fr)_minmax(430px,1.7fr)_minmax(250px,1fr)] lg:gap-7">
            <section className="order-2 rounded-3xl border border-white/10 bg-slate-950/45 p-5 shadow-[0_22px_60px_rgba(0,0,0,.22)] sm:p-6 lg:order-3">
              <p className="text-xs font-black uppercase tracking-[.22em] text-cyan-300">Teams</p>
              <h2 className="mt-1 text-2xl font-black text-white">Place a Bid</h2>
              {teamsLoading ? <p className="mt-5 text-sm text-slate-400" role="status">Loading teams…</p> : teamsError ? <p className="mt-5 text-sm text-rose-200" role="alert">{teamsError}</p> : teams.length === 0 ? <p className="mt-5 rounded-xl border border-dashed border-white/15 px-4 py-6 text-center text-sm text-slate-400">No teams available.</p> : (
                <div className="mt-5 grid max-h-[65svh] gap-3 overflow-y-auto pr-1 sm:grid-cols-2 lg:grid-cols-1">
                  {teams.map((team) => {
                    const leading = state?.leading_team?.id === team.id
                    return <button key={team.id} type="button" disabled={!isRunning || Boolean(busy)} onClick={() => void performAction(`bid-${team.id}`, () => auctionApi.bid(team.id))} className={`min-h-14 rounded-xl border px-4 py-3 text-left text-base font-extrabold transition disabled:cursor-not-allowed disabled:opacity-40 sm:text-lg ${leading ? 'border-emerald-200/60 bg-emerald-300/[.14] text-emerald-100 shadow-[0_0_22px_rgba(52,211,153,.12)]' : 'border-white/10 bg-white/[.035] text-slate-100 hover:border-cyan-200/40 hover:bg-cyan-300/[.06]'}`}>
                      <span className="flex items-center justify-between gap-2"><span className="truncate">{team.name}</span>{leading && <span className="shrink-0 text-[10px] font-black uppercase tracking-wider text-emerald-200">Leading</span>}</span>
                    </button>
                  })}
                </div>
              )}
              {!isRunning && <p className="mt-4 text-xs leading-5 text-slate-500">Team buttons are enabled while the auction timer is running.</p>}
            </section>

            <section className="order-1 min-w-0 lg:order-2">
              <div className="rounded-3xl border border-white/10 bg-slate-950/55 p-5 shadow-[0_24px_75px_rgba(0,0,0,.28)] sm:p-7">
                <div className="mb-5 flex flex-col items-center gap-5 sm:flex-row sm:text-left">
                  {currentPlayer ? <PlayerPortrait key={`${currentPlayer.id}-${currentPlayer.photo_url}`} player={currentPlayer} /> : <div className="flex h-28 w-28 shrink-0 items-center justify-center rounded-2xl border border-dashed border-white/15 bg-white/[.02] text-4xl text-slate-600 sm:h-36 sm:w-36">?</div>}
                  <div className="min-w-0 text-center sm:text-left">
                    <p className="text-[10px] font-black uppercase tracking-[.25em] text-cyan-300">Current Player</p>
                    <h1 className="mt-2 break-words font-display text-3xl font-black leading-tight text-white sm:text-4xl lg:text-5xl">{currentPlayer?.name ?? 'Select a player category'}</h1>
                    {currentPlayer && <>
                      <p className="mt-2 text-base font-bold text-slate-300 sm:text-lg">{currentPlayer.course} · {yearLabel(currentPlayer.year)}</p>
                      <div className="mt-3 flex flex-wrap justify-center gap-2 sm:justify-start">
                        <span className="rounded-full border border-cyan-200/20 bg-cyan-300/[.07] px-3 py-1.5 text-sm font-bold text-cyan-100">{skillLabel(currentPlayer)}</span>
                        {currentPlayer.is_wicket_keeper && <span className="rounded-full border border-amber-200/25 bg-amber-300/[.08] px-3 py-1.5 text-xs font-black uppercase tracking-[.1em] text-amber-100">Wicket Keeper</span>}
                      </div>
                      <p className="mt-3 text-sm font-bold uppercase tracking-[.12em] text-slate-400">Base Price <span className="ml-1 text-lg text-white">{currentPlayer.base_price}</span></p>
                    </>}
                  </div>
                </div>

                {(state?.status === 'sold' || state?.status === 'unsold') && <div className={`mb-5 rounded-2xl border px-4 py-4 text-center font-display text-2xl font-black uppercase tracking-[.08em] sm:text-3xl ${state.status === 'sold' ? 'border-emerald-200/35 bg-emerald-300/[.1] text-emerald-100' : 'border-rose-200/30 bg-rose-300/[.08] text-rose-100'}`} role="status">{state.status === 'sold' ? state.message ?? `SOLD to ${state.leading_team?.name ?? 'team'} for ${state.current_price}` : 'UNSOLD'}</div>}

                <div className="flex flex-col items-center rounded-3xl border border-cyan-100/10 bg-gradient-to-b from-cyan-300/[.055] to-transparent px-3 py-6 sm:py-8">
                  <div className="relative flex h-60 w-60 items-center justify-center rounded-full p-[10px] shadow-[0_0_45px_rgba(34,211,238,.1)] sm:h-72 sm:w-72" style={{ background: `conic-gradient(#67e8f9 ${timerProgress}%, rgba(255,255,255,.09) ${timerProgress}% 100%)` }}>
                    <div className="flex h-full w-full flex-col items-center justify-center rounded-full border border-white/10 bg-[#07131c] text-center shadow-[inset_0_0_50px_rgba(0,0,0,.5)]">
                      <span className="text-[10px] font-black uppercase tracking-[.3em] text-slate-400">{isRunning ? 'Time Remaining' : state?.status === 'sold' || state?.status === 'unsold' ? 'Auction Complete' : 'Auction Timer'}</span>
                      <span className={`mt-1 font-display text-7xl font-black tabular-nums leading-none sm:text-8xl ${isRunning && timerValue <= 5 ? 'text-rose-300' : 'text-white'}`}>{isRunning ? countdownSeconds : currentPlayer ? 20 : '—'}</span>
                      {state?.status === 'idle' && <button type="button" disabled={!currentPlayer || Boolean(busy)} onClick={() => void performAction('start', () => auctionApi.start())} className="mt-4 rounded-full bg-cyan-300 px-8 py-3 text-base font-black uppercase tracking-[.14em] text-slate-950 shadow-[0_0_28px_rgba(34,211,238,.25)] transition hover:bg-cyan-200 disabled:cursor-not-allowed disabled:opacity-40">{busy === 'start' ? 'Starting…' : 'Start'}</button>}
                      {isRunning && <span className="mt-3 rounded-full border border-rose-200/20 bg-rose-300/[.06] px-4 py-1.5 text-xs font-black uppercase tracking-[.16em] text-rose-100">Live Auction</span>}
                      {(state?.status === 'sold' || state?.status === 'unsold') && <span className="mt-3 text-xs font-semibold text-slate-400">Load the next player to continue.</span>}
                    </div>
                  </div>
                  <div className="mt-6 grid w-full max-w-xl grid-cols-2 gap-3">
                    <div className="rounded-2xl border border-cyan-200/15 bg-cyan-300/[.045] px-4 py-4 text-center">
                      <p className="text-[10px] font-black uppercase tracking-[.2em] text-slate-400">Current Price</p>
                      <p className="mt-1 font-display text-3xl font-black tabular-nums text-cyan-100 sm:text-4xl">{state?.current_price ?? '—'}</p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-white/[.025] px-4 py-4 text-center">
                      <p className="text-[10px] font-black uppercase tracking-[.2em] text-slate-400">Leading Team</p>
                      <p className="mt-1 truncate text-lg font-extrabold text-white sm:text-xl">{state?.leading_team?.name ?? 'No bids yet'}</p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section className="order-3 rounded-3xl border border-white/10 bg-slate-950/45 p-5 shadow-[0_22px_60px_rgba(0,0,0,.22)] sm:p-6 lg:order-1">
              <p className="text-xs font-black uppercase tracking-[.22em] text-cyan-300">Auction Controls</p>
              <h2 className="mt-1 text-2xl font-black text-white">Select Player</h2>
              <label htmlFor="auction-category" className="sr-only">Select player category</label>
              <select id="auction-category" value={category} onChange={(event) => selectPlayerCategory(event.target.value)} disabled={Boolean(busy) || Boolean(isRunning)} className="mt-5 w-full rounded-xl border border-white/15 bg-slate-950 px-4 py-3.5 text-base font-semibold text-white outline-none transition focus:border-cyan-200/50 focus:ring-2 focus:ring-cyan-300/15 disabled:cursor-not-allowed disabled:opacity-50">
                <option value="">Choose category…</option>
                {categories.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
              </select>
              {selectedCategoryLabel && <p className="mt-3 text-xs text-slate-500">Selected: <span className="text-slate-300">{selectedCategoryLabel}</span></p>}
              <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
                <button type="button" disabled={!state?.selected_category || Boolean(isRunning) || Boolean(busy)} onClick={() => void performAction('next', () => auctionApi.next())} className="rounded-xl border border-cyan-200/30 bg-cyan-300/[.07] px-4 py-3.5 text-sm font-extrabold text-cyan-100 transition hover:bg-cyan-300/[.13] disabled:cursor-not-allowed disabled:opacity-40">{busy === 'next' ? 'Loading…' : 'Next Player'}</button>
                <button type="button" disabled={!currentPlayer || Boolean(isRunning) || Boolean(busy)} onClick={() => void performAction('pass', () => auctionApi.pass())} className="rounded-xl border border-amber-200/25 bg-amber-300/[.05] px-4 py-3.5 text-sm font-extrabold text-amber-100 transition hover:bg-amber-300/[.1] disabled:cursor-not-allowed disabled:opacity-40">{busy === 'pass' ? 'Passing…' : 'Pass'}</button>
              </div>
              {state?.status === 'running' && <p className="mt-4 rounded-xl border border-rose-200/15 bg-rose-300/[.04] px-3 py-2.5 text-xs leading-5 text-rose-100/80">Next Player and Pass are unavailable while the timer is running.</p>}
            </section>
          </div>
        )}
      </div>

      {teamUpdatesOpen && <TeamUpdatesModal onClose={() => setTeamUpdatesOpen(false)} auctionState={state} />}
    </main>
  )
}
