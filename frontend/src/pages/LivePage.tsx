import axios from 'axios'
import { useCallback, useEffect, useRef, useState } from 'react'
import { publicAuctionApi } from '../api/client'
import type { AuctionCurrentPlayer, AuctionTeamSummary, RecentSale } from '../api/types'
import { useAuctionState } from '../hooks/useAuctionState'

function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const detail = (error.response?.data as { detail?: unknown } | undefined)?.detail
    if (typeof detail === 'string') return detail
    return error.message || 'Live auction information could not be loaded.'
  }
  return error instanceof Error ? error.message : 'Live auction information could not be loaded.'
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

function PlayerPhoto({ player }: { player: AuctionCurrentPlayer }) {
  const [failed, setFailed] = useState(false)
  if (failed || !player.photo_url) {
    return <div className="flex h-28 w-28 shrink-0 items-center justify-center rounded-2xl border border-cyan-200/20 bg-cyan-300/10 text-4xl font-black text-cyan-100 sm:h-40 sm:w-40 lg:h-48 lg:w-48" aria-label={`No photo available for ${player.name}`}>{player.name.charAt(0).toUpperCase()}</div>
  }
  return <img src={player.photo_url} alt={player.name} onError={() => setFailed(true)} className="h-28 w-28 shrink-0 rounded-2xl border border-white/10 bg-slate-900 object-cover shadow-xl sm:h-40 sm:w-40 lg:h-48 lg:w-48" />
}

function formatSaleTime(value: string | null): string {
  if (!value) return 'Earlier sale'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? 'Earlier sale' : date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

export function LivePage() {
  const { state, connectionStatus, loading: stateLoading, error: stateError, countdownSeconds } = useAuctionState({ publicOnly: true })
  const [teams, setTeams] = useState<AuctionTeamSummary[]>([])
  const [recentSales, setRecentSales] = useState<RecentSale[]>([])
  const [teamsLoading, setTeamsLoading] = useState(true)
  const [salesLoading, setSalesLoading] = useState(true)
  const [teamsError, setTeamsError] = useState('')
  const [salesError, setSalesError] = useState('')
  const lastSaleKey = useRef('')

  const loadTeams = useCallback(async () => {
    try {
      setTeams(await publicAuctionApi.teams())
      setTeamsError('')
    } catch (error: unknown) {
      setTeamsError(getErrorMessage(error))
    } finally {
      setTeamsLoading(false)
    }
  }, [])

  const loadRecentSales = useCallback(async () => {
    try {
      setRecentSales(await publicAuctionApi.recentSales(10))
      setSalesError('')
    } catch (error: unknown) {
      setSalesError(getErrorMessage(error))
    } finally {
      setSalesLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadTeams()
    void loadRecentSales()
  }, [loadTeams, loadRecentSales])

  const saleKey = state?.status === 'sold'
    ? `${state.current_player?.id ?? 'player'}:${state.current_price}:${state.message ?? ''}`
    : ''

  useEffect(() => {
    if (!saleKey || lastSaleKey.current === saleKey) return
    lastSaleKey.current = saleKey
    void loadTeams()
    void loadRecentSales()
  }, [saleKey, loadTeams, loadRecentSales])

  const player = state?.current_player ?? null
  const timerValue = state?.status === 'running' ? countdownSeconds : state?.status === 'idle' && player ? 20 : 0
  const timerProgress = Math.max(0, Math.min(100, (timerValue / 20) * 100))
  const topError = stateError

  return (
    <main className="relative isolate min-h-[calc(100svh-76px)] overflow-hidden bg-[#061019] px-4 py-8 sm:px-7 sm:py-12 lg:px-10 lg:py-14">
      <div className="stadium-grid pointer-events-none absolute inset-0 -z-20 opacity-35" />
      <div className="stadium-light pointer-events-none absolute inset-x-[-30%] bottom-[-20%] -z-10 h-[65%] opacity-50" />

      <div className="mx-auto max-w-[1600px]">
        <header className="mb-8 flex flex-col gap-4 border-b border-white/10 pb-6 sm:mb-10 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[.3em] text-cyan-300">Avanthi Cricket Carnival</p>
            <h1 className="mt-2 font-display text-4xl font-black text-white sm:text-5xl lg:text-6xl">Watch Live</h1>
            <p className="mt-2 text-sm font-medium text-slate-400 sm:text-base">Live auction updates from the ACC arena.</p>
          </div>
          <div className="inline-flex items-center gap-2 self-start rounded-full border border-white/10 bg-slate-950/55 px-4 py-2.5 sm:self-auto">
            <span className={`h-2.5 w-2.5 rounded-full ${connectionStatus === 'live' ? 'bg-emerald-300 shadow-[0_0_14px_rgba(110,231,183,.85)]' : 'animate-pulse bg-amber-300'}`} />
            <span className="text-xs font-black uppercase tracking-[.17em] text-slate-200">{connectionStatus === 'live' ? 'Live' : 'Reconnecting'}</span>
          </div>
        </header>

        {topError && <div className="mb-6 rounded-2xl border border-rose-300/20 bg-rose-400/[.06] px-5 py-4 text-sm font-semibold text-rose-100" role="alert">{topError}</div>}

        {stateLoading && !state ? (
          <div className="rounded-3xl border border-white/10 bg-slate-950/55 px-5 py-16 text-center text-slate-300" role="status">Connecting to the live auction…</div>
        ) : (
          <section aria-label="Current auction" className="mb-8 overflow-hidden rounded-3xl border border-cyan-100/10 bg-slate-950/65 shadow-[0_28px_90px_rgba(0,0,0,.35)] sm:mb-10">
            {state?.status === 'sold' && <div className="border-b border-emerald-200/20 bg-gradient-to-r from-emerald-400/[.16] via-emerald-300/[.08] to-transparent px-5 py-5 text-center font-display text-3xl font-black uppercase tracking-[.08em] text-emerald-100 sm:py-6 sm:text-4xl lg:text-5xl" role="status">{state.message ?? `SOLD to ${state.leading_team?.name ?? 'team'} for ${state.current_price}`}</div>}
            {state?.status === 'unsold' && <div className="border-b border-rose-200/20 bg-gradient-to-r from-rose-400/[.15] via-rose-300/[.07] to-transparent px-5 py-5 text-center font-display text-3xl font-black uppercase tracking-[.1em] text-rose-100 sm:py-6 sm:text-4xl lg:text-5xl" role="status">UNSOLD</div>}

            {player ? (
              <div className="grid items-center gap-7 p-5 sm:p-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(330px,.9fr)] lg:gap-12 lg:p-12">
                <div className="flex flex-col items-center gap-6 sm:flex-row sm:gap-8">
                  <PlayerPhoto key={`${player.id}-${player.photo_url}`} player={player} />
                  <div className="min-w-0 text-center sm:text-left">
                    <p className="text-[10px] font-black uppercase tracking-[.26em] text-cyan-300 sm:text-xs">Current Player</p>
                    <h2 className="mt-2 break-words font-display text-3xl font-black leading-tight text-white sm:text-4xl lg:text-5xl">{player.name}</h2>
                    <p className="mt-2 text-base font-bold text-slate-300 sm:text-xl">{player.course} · {yearLabel(player.year)}</p>
                    <div className="mt-4 flex flex-wrap justify-center gap-2 sm:justify-start">
                      <span className="rounded-full border border-cyan-200/20 bg-cyan-300/[.07] px-4 py-2 text-sm font-extrabold text-cyan-100 sm:text-base">{skillLabel(player)}</span>
                      {player.is_wicket_keeper && <span className="rounded-full border border-amber-200/25 bg-amber-300/[.08] px-4 py-2 text-xs font-black uppercase tracking-[.1em] text-amber-100">Wicket Keeper</span>}
                    </div>
                    <p className="mt-5 text-xs font-black uppercase tracking-[.2em] text-slate-500">Base Price <span className="ml-2 text-xl text-white">{player.base_price}</span></p>
                  </div>
                </div>

                <div className="flex flex-col items-center">
                  <div className="relative flex h-60 w-60 items-center justify-center rounded-full p-[10px] shadow-[0_0_60px_rgba(34,211,238,.12)] sm:h-72 sm:w-72 lg:h-80 lg:w-80" style={{ background: `conic-gradient(#67e8f9 ${timerProgress}%, rgba(255,255,255,.09) ${timerProgress}% 100%)` }}>
                    <div className="flex h-full w-full flex-col items-center justify-center rounded-full border border-white/10 bg-[#07131c] text-center shadow-[inset_0_0_55px_rgba(0,0,0,.6)]">
                      <span className="text-[10px] font-black uppercase tracking-[.3em] text-slate-400 sm:text-xs">{state?.status === 'running' ? 'Time Remaining' : 'Auction Timer'}</span>
                      <span className={`mt-2 font-display text-8xl font-black tabular-nums leading-none sm:text-9xl ${state?.status === 'running' && timerValue <= 5 ? 'text-rose-300' : 'text-white'}`}>{state?.status === 'running' ? countdownSeconds : 20}</span>
                      <span className="mt-3 rounded-full border border-cyan-200/15 bg-cyan-300/[.04] px-4 py-1.5 text-[10px] font-black uppercase tracking-[.2em] text-cyan-100 sm:text-xs">{state?.status === 'running' ? 'Live Bid' : state?.status === 'sold' || state?.status === 'unsold' ? 'Complete' : 'Ready'}</span>
                    </div>
                  </div>
                  <div className="mt-6 grid w-full max-w-lg grid-cols-2 gap-3 sm:gap-4">
                    <div className="rounded-2xl border border-cyan-200/15 bg-cyan-300/[.045] px-4 py-4 text-center sm:py-5">
                      <p className="text-[9px] font-black uppercase tracking-[.18em] text-slate-400 sm:text-[10px]">Current Price</p>
                      <p className="mt-1 font-display text-3xl font-black tabular-nums text-cyan-100 sm:text-4xl">{state?.current_price ?? player.base_price}</p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-white/[.025] px-4 py-4 text-center sm:py-5">
                      <p className="text-[9px] font-black uppercase tracking-[.18em] text-slate-400 sm:text-[10px]">Leading Team</p>
                      <p className="mt-1 truncate text-lg font-extrabold text-white sm:text-xl">{state?.leading_team?.name ?? 'No bids yet'}</p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex min-h-72 flex-col items-center justify-center px-5 py-14 text-center sm:min-h-96">
                <span className="mb-5 flex h-20 w-20 items-center justify-center rounded-full border border-cyan-200/20 bg-cyan-300/[.05] text-4xl text-cyan-200/80">✦</span>
                <h2 className="font-display text-3xl font-black text-white sm:text-4xl">Waiting for the auction to start</h2>
                <p className="mt-3 max-w-lg text-sm leading-6 text-slate-400 sm:text-base">The current player and live countdown will appear here when the auction begins.</p>
              </div>
            )}
          </section>
        )}

        <section aria-labelledby="live-standings-title" className="mb-8 sm:mb-10">
          <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
            <div><p className="text-[10px] font-black uppercase tracking-[.25em] text-cyan-300">Live standings</p><h2 id="live-standings-title" className="mt-1 font-display text-2xl font-black text-white sm:text-3xl">Teams</h2></div>
            {!teamsLoading && !teamsError && <span className="text-xs font-bold uppercase tracking-wider text-slate-500">{teams.length} teams</span>}
          </div>
          {teamsLoading ? <div className="rounded-2xl border border-white/10 bg-slate-950/45 px-5 py-8 text-center text-slate-400" role="status">Loading team standings…</div> : teamsError ? <div className="rounded-2xl border border-rose-300/20 bg-rose-400/[.06] px-5 py-6 text-sm text-rose-100" role="alert">{teamsError}</div> : teams.length === 0 ? <div className="rounded-2xl border border-dashed border-white/15 bg-slate-950/35 px-5 py-8 text-center text-slate-400">No teams added yet.</div> : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-6">
              {teams.slice(0, 11).map((team) => <StandingCard key={team.id} team={team} leading={state?.leading_team?.id === team.id} />)}
            </div>
          )}
        </section>

        <section aria-labelledby="recent-sales-title">
          <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
            <div><p className="text-[10px] font-black uppercase tracking-[.25em] text-cyan-300">Latest results</p><h2 id="recent-sales-title" className="mt-1 font-display text-2xl font-black text-white sm:text-3xl">Recently Sold</h2></div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Latest 10 sales</span>
          </div>
          {salesLoading ? <div className="rounded-2xl border border-white/10 bg-slate-950/45 px-5 py-8 text-center text-slate-400" role="status">Loading recent sales…</div> : salesError ? <div className="rounded-2xl border border-rose-300/20 bg-rose-400/[.06] px-5 py-6 text-sm text-rose-100" role="alert">{salesError}<button type="button" onClick={() => void loadRecentSales()} className="ml-3 font-bold underline decoration-rose-200/50 underline-offset-4">Retry</button></div> : recentSales.length === 0 ? <div className="rounded-2xl border border-dashed border-white/15 bg-slate-950/35 px-5 py-8 text-center text-slate-400">No players have been sold yet.</div> : (
            <div className="overflow-hidden rounded-2xl border border-white/10 bg-slate-950/55">
              <div className="hidden grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_minmax(100px,.6fr)_minmax(85px,.5fr)] gap-4 border-b border-white/10 bg-white/[.025] px-5 py-3 text-[10px] font-black uppercase tracking-[.18em] text-slate-500 sm:grid lg:px-7">
                <span>Player</span><span>Team</span><span>Sold Price</span><span>Time</span>
              </div>
              <ul className="divide-y divide-white/[.07]">
                {recentSales.map((sale, index) => <li key={`${sale.player_name}-${sale.sold_at ?? index}`} className="grid gap-2 px-4 py-4 sm:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_minmax(100px,.6fr)_minmax(85px,.5fr)] sm:items-center sm:gap-4 sm:px-5 lg:px-7">
                  <div><p className="text-base font-extrabold text-white sm:text-lg">{sale.player_name}</p><p className="mt-1 text-xs text-slate-500 sm:hidden">{sale.team_name}</p></div>
                  <span className="hidden truncate text-sm font-semibold text-slate-300 sm:block">{sale.team_name}</span>
                  <span className="text-sm font-black tabular-nums text-emerald-200">{sale.sold_price}</span>
                  <span className="hidden text-xs font-semibold text-slate-500 sm:block">{formatSaleTime(sale.sold_at)}</span>
                </li>)}
              </ul>
            </div>
          )}
        </section>
      </div>
    </main>
  )
}

function StandingCard({ team, leading }: { team: AuctionTeamSummary; leading: boolean }) {
  return <article className={`min-w-0 rounded-2xl border p-4 shadow-[0_14px_40px_rgba(0,0,0,.2)] sm:p-5 ${leading ? 'border-emerald-200/45 bg-emerald-300/[.08] shadow-[0_0_28px_rgba(52,211,153,.09)]' : 'border-white/10 bg-slate-950/60'}`}>
    <h3 className="truncate text-base font-black text-white sm:text-lg" title={team.name}>{team.name}</h3>
    {leading && <p className="mt-1 text-[9px] font-black uppercase tracking-[.16em] text-emerald-200">Leading</p>}
    <div className="mt-4 grid grid-cols-2 gap-2 border-t border-white/[.08] pt-3">
      <div><p className="text-[8px] font-black uppercase tracking-[.12em] text-slate-500 sm:text-[9px]">Purse</p><p className="mt-1 text-sm font-black tabular-nums text-amber-100 sm:text-base">{team.purse_remaining}<span className="ml-0.5 text-[10px] font-semibold text-slate-500">/1000</span></p></div>
      <div><p className="text-[8px] font-black uppercase tracking-[.12em] text-slate-500 sm:text-[9px]">Players</p><p className="mt-1 text-sm font-black tabular-nums text-cyan-100 sm:text-base">{team.total_players}<span className="ml-0.5 text-[10px] font-semibold text-slate-500">/{team.max_players}</span></p></div>
    </div>
  </article>
}
