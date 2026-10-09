import axios from 'axios'
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { playersApi } from '../api/client'
import type { BasePrice, Player } from '../api/types'

const basePrices: BasePrice[] = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 120, 140, 160, 180, 200, 230, 250]

function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const detail = (error.response?.data as { detail?: unknown } | undefined)?.detail
    if (typeof detail === 'string') return detail
    if (Array.isArray(detail)) {
      const messages = detail.map((item) => typeof item === 'object' && item !== null && 'msg' in item ? String(item.msg) : '').filter(Boolean)
      if (messages.length) return messages.join('; ')
    }
    return error.message || 'The request could not be completed.'
  }
  return error instanceof Error ? error.message : 'The request could not be completed.'
}

function PlayerPhoto({ player }: { player: Player }) {
  const [failed, setFailed] = useState(false)
  if (failed || !player.photo_url) {
    return <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl border border-cyan-200/15 bg-cyan-300/10 text-2xl font-black text-cyan-100" aria-label={`No photo available for ${player.name}`}>{player.name.charAt(0).toUpperCase()}</div>
  }
  return <img src={player.photo_url} alt={player.name} loading="lazy" onError={() => setFailed(true)} className="h-16 w-16 shrink-0 rounded-xl border border-white/10 bg-slate-900 object-cover" />
}

function skillLabel(player: Player): string {
  if (player.skill_type === 'batting') return `Batting · ${player.batting_style ?? 'Style not listed'}`
  if (player.skill_type === 'bowling') return `Bowling · ${player.bowling_style ?? 'Style not listed'}`
  return 'All-rounder'
}

function auctionStatusLabel(status: Player['auction_status']): string {
  return status.charAt(0).toUpperCase() + status.slice(1)
}

export function AdminPlayersPage() {
  const [players, setPlayers] = useState<Player[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [actionError, setActionError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [search, setSearch] = useState('')
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null)
  const [selectedPrice, setSelectedPrice] = useState<BasePrice>(40)
  const [savingPrice, setSavingPrice] = useState(false)
  const [removingPlayerId, setRemovingPlayerId] = useState<number | null>(null)
  const [retry, setRetry] = useState(0)

  useEffect(() => {
    let active = true
    setLoading(true)
    setLoadError('')
    playersApi.list({ payment_status: 'paid' })
      .then((result) => {
        if (active) setPlayers([...result].sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })))
      })
      .catch((error: unknown) => { if (active) { setPlayers([]); setLoadError(getErrorMessage(error)) } })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [retry])

  const filteredPlayers = useMemo(() => {
    const query = search.trim().toLocaleLowerCase()
    return query ? players.filter((player) => player.name.toLocaleLowerCase().includes(query)) : players
  }, [players, search])

  const openPriceDialog = (player: Player) => {
    setActionError('')
    setSuccessMessage('')
    setEditingPlayer(player)
    setSelectedPrice(player.base_price as BasePrice)
  }

  const savePrice = async () => {
    if (!editingPlayer) return
    setSavingPrice(true)
    setActionError('')
    setSuccessMessage('')
    try {
      const updated = await playersApi.updateBasePrice(editingPlayer.id, selectedPrice)
      setPlayers((current) => current.map((player) => player.id === updated.id ? updated : player))
      setSuccessMessage(`${updated.name}'s base price updated to ${updated.base_price}. Auction status: ${auctionStatusLabel(updated.auction_status)}.`)
      setEditingPlayer(null)
    } catch (error) {
      setActionError(getErrorMessage(error))
    } finally {
      setSavingPrice(false)
    }
  }

  const removePlayer = async (player: Player) => {
    if (!window.confirm(`Permanently delete ${player.name}? This cannot be undone`)) return
    setRemovingPlayerId(player.id)
    setActionError('')
    setSuccessMessage('')
    try {
      await playersApi.remove(player.id)
      setPlayers((current) => current.filter((item) => item.id !== player.id))
      setSuccessMessage(`${player.name} was permanently deleted.`)
    } catch (error) {
      setActionError(getErrorMessage(error))
    } finally {
      setRemovingPlayerId(null)
    }
  }

  return (
    <main className="relative isolate min-h-[calc(100svh-76px)] overflow-hidden bg-[#07131c] px-4 py-10 sm:px-7 sm:py-14 lg:px-10">
      <div className="stadium-grid pointer-events-none absolute inset-0 -z-20 opacity-35" />
      <div className="stadium-light pointer-events-none absolute inset-x-[-35%] bottom-[-20%] -z-10 h-[70%] opacity-45" />

      <div className="mx-auto max-w-6xl">
        <header className="mb-8 flex flex-col gap-4 border-b border-white/10 pb-7 sm:mb-10 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[.28em] text-cyan-300">ACC Control Room</p>
            <h1 className="mt-2 font-display text-4xl font-black text-white sm:text-5xl">Manage Players</h1>
            <p className="mt-2 text-sm leading-6 text-slate-400">Review paid registrations, update base prices, and manage the auction pool.</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <span className="rounded-xl border border-cyan-200/20 bg-cyan-300/[.06] px-4 py-2.5 text-sm font-bold text-cyan-100"><strong className="mr-1 text-lg tabular-nums">{loading ? '—' : players.length}</strong> paid players</span>
            <Link to="/admin" className="inline-flex w-fit items-center rounded-xl border border-white/15 bg-white/[.04] px-4 py-2.5 text-sm font-bold text-slate-200 transition hover:border-cyan-200/40 hover:bg-white/[.08]">Back to Dashboard</Link>
          </div>
        </header>

        {actionError && <p className="mb-5 rounded-xl border border-rose-300/20 bg-rose-400/[.06] px-4 py-3 text-sm text-rose-100" role="alert">{actionError}</p>}
        {successMessage && <p className="mb-5 rounded-xl border border-emerald-300/20 bg-emerald-400/[.06] px-4 py-3 text-sm text-emerald-100" role="status">{successMessage}</p>}

        <div className="mb-6 max-w-xl">
          <label htmlFor="admin-player-search" className="mb-2 block text-xs font-bold uppercase tracking-[.16em] text-slate-300">Search by name</label>
          <input id="admin-player-search" type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Type a player name…" className="w-full rounded-xl border border-white/15 bg-slate-950/65 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-200/50 focus:ring-2 focus:ring-cyan-300/15" />
        </div>

        {loading && <div className="rounded-2xl border border-white/10 bg-slate-950/45 px-5 py-12 text-center text-slate-300" role="status">Loading paid players…</div>}
        {!loading && loadError && <div className="rounded-2xl border border-rose-300/20 bg-rose-400/[.06] px-5 py-8 text-center" role="alert"><p className="font-semibold text-rose-100">{loadError}</p><button type="button" onClick={() => setRetry((value) => value + 1)} className="mt-4 rounded-xl border border-rose-200/25 px-4 py-2 text-sm font-bold text-rose-100 transition hover:bg-rose-300/10">Try again</button></div>}
        {!loading && !loadError && players.length === 0 && <div className="rounded-2xl border border-white/10 bg-slate-950/45 px-5 py-14 text-center"><p className="text-lg font-bold text-white">No paid players yet</p><p className="mt-2 text-sm text-slate-400">Paid registrations will appear here.</p></div>}
        {!loading && !loadError && players.length > 0 && filteredPlayers.length === 0 && <div className="rounded-2xl border border-white/10 bg-slate-950/45 px-5 py-12 text-center"><p className="font-bold text-white">No players match “{search.trim()}”</p><p className="mt-2 text-sm text-slate-400">Try another name or clear your search.</p></div>}
        {!loading && !loadError && filteredPlayers.length > 0 && (
          <section aria-label="Paid players" className="space-y-4">
            {filteredPlayers.map((player) => (
              <article key={player.id} className="rounded-2xl border border-white/10 bg-slate-950/60 p-4 shadow-[0_18px_48px_rgba(0,0,0,.2)] transition hover:border-cyan-200/25 sm:p-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
                  <div className="flex min-w-0 items-center gap-4 lg:w-[28%]">
                    <PlayerPhoto player={player} />
                    <div className="min-w-0"><h2 className="truncate text-lg font-extrabold text-white" title={player.name}>{player.name}</h2><p className="mt-1 text-sm font-medium text-cyan-200">{player.course} · Year {player.year}</p></div>
                  </div>
                  <div className="grid flex-1 grid-cols-2 gap-3 border-y border-white/[.07] py-3 sm:grid-cols-3 lg:border-y-0 lg:py-0">
                    <div><p className="text-[10px] font-bold uppercase tracking-[.16em] text-slate-500">Skill</p><p className="mt-1 text-sm font-semibold capitalize text-slate-200">{skillLabel(player)}</p></div>
                    <div><p className="text-[10px] font-bold uppercase tracking-[.16em] text-slate-500">Base Price</p><p className="mt-1 text-sm font-extrabold text-cyan-100">{player.base_price}</p></div>
                    <div><p className="text-[10px] font-bold uppercase tracking-[.16em] text-slate-500">Auction Status</p><p className="mt-1 text-sm font-bold capitalize text-slate-200">{player.auction_status}</p></div>
                  </div>
                  <div className="flex flex-wrap gap-2 lg:justify-end">
                    <button type="button" onClick={() => openPriceDialog(player)} className="rounded-lg border border-cyan-200/25 bg-cyan-300/[.06] px-3.5 py-2.5 text-sm font-bold text-cyan-100 transition hover:border-cyan-200/50 hover:bg-cyan-300/10">Edit Base Price</button>
                    <button type="button" onClick={() => void removePlayer(player)} disabled={removingPlayerId === player.id} className="rounded-lg border border-rose-200/25 bg-rose-300/[.05] px-3.5 py-2.5 text-sm font-bold text-rose-100 transition hover:border-rose-200/50 hover:bg-rose-300/10 disabled:cursor-wait disabled:opacity-50">{removingPlayerId === player.id ? 'Removing…' : 'Remove'}</button>
                  </div>
                </div>
              </article>
            ))}
          </section>
        )}
      </div>

      {editingPlayer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm" onMouseDown={(event) => { if (event.target === event.currentTarget && !savingPrice) setEditingPlayer(null) }}>
          <section role="dialog" aria-modal="true" aria-labelledby="base-price-title" className="w-full max-w-md rounded-2xl border border-cyan-200/20 bg-[#08151f] p-6 shadow-[0_0_70px_rgba(34,211,238,.12)] sm:p-7">
            <p className="text-xs font-bold uppercase tracking-[.2em] text-cyan-300">Player auction settings</p>
            <h2 id="base-price-title" className="mt-2 text-2xl font-black text-white">Edit Base Price</h2>
            <p className="mt-2 text-sm text-slate-300">{editingPlayer.name}</p>
            <label htmlFor="base-price-select" className="mt-6 block text-sm font-semibold text-slate-200">Select base price</label>
            <select id="base-price-select" value={selectedPrice} onChange={(event) => setSelectedPrice(Number(event.target.value) as BasePrice)} className="mt-2 w-full rounded-xl border border-white/15 bg-slate-950 px-4 py-3 text-white outline-none focus:border-cyan-200/50 focus:ring-2 focus:ring-cyan-300/15">
              {basePrices.map((price) => <option key={price} value={price}>{price}</option>)}
            </select>
            {actionError && <p className="mt-4 rounded-lg border border-rose-300/20 bg-rose-400/[.06] px-3 py-2 text-sm text-rose-100" role="alert">{actionError}</p>}
            <div className="mt-6 flex justify-end gap-3">
              <button type="button" onClick={() => { setEditingPlayer(null); setActionError('') }} disabled={savingPrice} className="rounded-xl border border-white/15 px-4 py-2.5 text-sm font-bold text-slate-200 transition hover:bg-white/[.06] disabled:opacity-50">Cancel</button>
              <button type="button" onClick={() => void savePrice()} disabled={savingPrice} className="rounded-xl bg-cyan-300 px-5 py-2.5 text-sm font-extrabold text-slate-950 transition hover:bg-cyan-200 disabled:cursor-wait disabled:opacity-50">{savingPrice ? 'Saving…' : 'OK'}</button>
            </div>
          </section>
        </div>
      )}
    </main>
  )
}
