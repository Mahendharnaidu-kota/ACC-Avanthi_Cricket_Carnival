import axios from 'axios'
import { useEffect, useMemo, useState } from 'react'
import { playersApi } from '../api/client'
import type { Player } from '../api/types'

function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const detail = (error.response?.data as { detail?: unknown } | undefined)?.detail
    if (typeof detail === 'string') return detail
    return error.message || 'Players could not be loaded.'
  }
  return error instanceof Error ? error.message : 'Players could not be loaded.'
}

function PlayerPhoto({ player }: { player: Player }) {
  const [failed, setFailed] = useState(false)
  if (failed || !player.photo_url) {
    return (
      <div className="flex h-48 items-center justify-center bg-gradient-to-br from-cyan-300/15 to-slate-900 text-5xl font-black text-cyan-100" aria-label={`No photo available for ${player.name}`}>
        {player.name.charAt(0).toUpperCase()}
      </div>
    )
  }
  return <img src={player.photo_url} alt={player.name} loading="lazy" onError={() => setFailed(true)} className="h-48 w-full bg-slate-900 object-cover" />
}

function skillLabel(player: Player): string {
  if (player.skill_type === 'batting') return `Batting · ${player.batting_style ?? 'Style not listed'}`
  if (player.skill_type === 'bowling') return `Bowling · ${player.bowling_style ?? 'Style not listed'}`
  return 'All-rounder'
}

export function PlayersPage() {
  const [players, setPlayers] = useState<Player[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [retry, setRetry] = useState(0)
  const [search, setSearch] = useState('')

  const filteredPlayers = useMemo(() => {
    const query = search.trim().toLocaleLowerCase()
    return query ? players.filter((player) => player.name.toLocaleLowerCase().includes(query)) : players
  }, [players, search])

  useEffect(() => {
    let active = true
    setLoading(true)
    setError('')
    playersApi.list({ payment_status: 'paid' })
      .then((result) => { if (active) setPlayers([...result].sort((a, b) => a.name.localeCompare(b.name))) })
      .catch((reason: unknown) => { if (active) { setPlayers([]); setError(getErrorMessage(reason)) } })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [retry])

  return (
    <main className="relative isolate min-h-[calc(100svh-76px)] overflow-hidden bg-[#07131c] px-4 py-10 sm:px-7 sm:py-14 lg:px-10">
      <div className="stadium-grid pointer-events-none absolute inset-0 -z-20 opacity-35" />
      <div className="stadium-light pointer-events-none absolute inset-x-[-35%] bottom-[-20%] -z-10 h-[70%] opacity-45" />

      <div className="mx-auto max-w-7xl">
        <header className="mb-8 flex flex-col gap-4 border-b border-white/10 pb-7 sm:mb-10 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[.28em] text-cyan-300">Avanthi Cricket Carnival</p>
            <h1 className="mt-2 font-display text-4xl font-black text-white sm:text-5xl">Registered Players</h1>
            <p className="mt-2 max-w-xl text-sm leading-6 text-slate-400">Meet the paid players ready for the carnival.</p>
          </div>
          <div className="flex items-center gap-3 self-start rounded-2xl border border-cyan-200/20 bg-cyan-300/[.06] px-5 py-3 sm:self-auto">
            <span className="text-3xl font-black tabular-nums text-cyan-200">{loading ? '—' : players.length}</span>
            <span className="text-xs font-bold uppercase tracking-[.16em] text-slate-300">Players</span>
          </div>
        </header>

        <div className="mb-6 max-w-xl">
          <label htmlFor="player-search" className="mb-2 block text-xs font-bold uppercase tracking-[.16em] text-slate-300">Search by name</label>
          <input
            id="player-search"
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Type a player name…"
            className="w-full rounded-xl border border-white/15 bg-slate-950/65 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-200/50 focus:ring-2 focus:ring-cyan-300/15"
          />
        </div>

        {loading && <div className="rounded-2xl border border-white/10 bg-slate-950/45 px-5 py-12 text-center text-slate-300" role="status">Loading players…</div>}
        {!loading && error && (
          <div className="rounded-2xl border border-rose-300/20 bg-rose-400/[.06] px-5 py-8 text-center" role="alert">
            <p className="font-semibold text-rose-100">{error}</p>
            <button type="button" onClick={() => setRetry((value) => value + 1)} className="mt-4 rounded-xl border border-rose-200/25 px-4 py-2 text-sm font-bold text-rose-100 transition hover:bg-rose-300/10">Try again</button>
          </div>
        )}
        {!loading && !error && players.length === 0 && (
          <div className="rounded-2xl border border-white/10 bg-slate-950/45 px-5 py-14 text-center">
            <p className="text-lg font-bold text-white">No paid players yet</p>
            <p className="mt-2 text-sm text-slate-400">Registered players will appear here once their payment is confirmed.</p>
          </div>
        )}
        {!loading && !error && players.length > 0 && filteredPlayers.length === 0 && (
          <div className="rounded-2xl border border-white/10 bg-slate-950/45 px-5 py-12 text-center">
            <p className="font-bold text-white">No players match “{search.trim()}”</p>
            <p className="mt-2 text-sm text-slate-400">Try another name or clear your search.</p>
          </div>
        )}
        {!loading && !error && filteredPlayers.length > 0 && (
          <section aria-label="Paid players" className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredPlayers.map((player) => (
              <article key={player.id} className="group overflow-hidden rounded-2xl border border-white/10 bg-slate-950/65 shadow-[0_18px_48px_rgba(0,0,0,.2)] transition duration-300 hover:-translate-y-1 hover:border-cyan-200/30 hover:shadow-[0_20px_55px_rgba(6,182,212,.1)]">
                <div className="relative overflow-hidden">
                  <PlayerPhoto player={player} />
                  {player.is_wicket_keeper && <span className="absolute right-3 top-3 rounded-full border border-amber-200/30 bg-slate-950/85 px-3 py-1.5 text-[10px] font-black uppercase tracking-[.12em] text-amber-200 shadow-lg">Wicket Keeper</span>}
                </div>
                <div className="p-5">
                  <h2 className="truncate text-xl font-extrabold text-white" title={player.name}>{player.name}</h2>
                  <p className="mt-1 text-sm font-medium text-cyan-200">{player.course} <span className="text-slate-500">·</span> Year {player.year}</p>
                  <div className="mt-4 border-t border-white/10 pt-4">
                    <p className="text-[10px] font-bold uppercase tracking-[.18em] text-slate-500">Skill</p>
                    <p className="mt-1 text-sm font-semibold capitalize text-slate-200">{skillLabel(player)}</p>
                  </div>
                </div>
              </article>
            ))}
          </section>
        )}
      </div>
    </main>
  )
}
