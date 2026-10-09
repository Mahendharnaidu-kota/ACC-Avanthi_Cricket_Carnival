import axios from 'axios'
import { useEffect, useState } from 'react'
import { teamsApi } from '../api/client'
import type { PublicPlayer, Team } from '../api/types'

const categoryOrder = [
  'BTech 1st Year',
  'BTech 2nd Year',
  'BTech 3rd Year',
  'BTech 4th Year',
  'Diploma',
  'Others',
] as const

type TeamPlayerCategory = (typeof categoryOrder)[number]

function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const detail = (error.response?.data as { detail?: unknown } | undefined)?.detail
    if (typeof detail === 'string') return detail
    return error.message || 'Teams could not be loaded.'
  }
  return error instanceof Error ? error.message : 'Teams could not be loaded.'
}

function categoryFor(player: PublicPlayer): TeamPlayerCategory {
  if (player.course === 'BTech' && player.year >= 1 && player.year <= 4) {
    return `BTech ${player.year === 1 ? '1st' : player.year === 2 ? '2nd' : player.year === 3 ? '3rd' : '4th'} Year`
  }
  if (player.course === 'Diploma') return 'Diploma'
  return 'Others'
}

function playerCourseYear(player: PublicPlayer): string {
  const ordinal = player.year === 1 ? '1st' : player.year === 2 ? '2nd' : player.year === 3 ? '3rd' : `${player.year}th`
  return `${player.course} · ${ordinal} Year`
}

function TeamPortrait({ name, photoUrl, title }: { name: string; photoUrl: string; title: string }) {
  const [failed, setFailed] = useState(false)
  if (failed || !photoUrl) {
    return (
      <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border border-cyan-200/20 bg-cyan-300/10 text-2xl font-black text-cyan-100 sm:h-20 sm:w-20" aria-label={`${title} photo unavailable`}>
        {name.charAt(0).toUpperCase()}
      </div>
    )
  }
  return <img src={photoUrl} alt={name} loading="lazy" onError={() => setFailed(true)} className="h-16 w-16 shrink-0 rounded-full border border-white/10 bg-slate-900 object-cover sm:h-20 sm:w-20" />
}

function TeamCard({ team }: { team: Team }) {
  const playersByCategory = new Map<TeamPlayerCategory, PublicPlayer[]>(categoryOrder.map((category) => [category, []]))
  team.players.forEach((player) => playersByCategory.get(categoryFor(player))?.push(player))
  const populatedCategories = categoryOrder.filter((category) => (playersByCategory.get(category)?.length ?? 0) > 0)

  return (
    <article className="overflow-hidden rounded-3xl border border-cyan-100/10 bg-slate-950/70 shadow-[0_24px_75px_rgba(0,0,0,.32)] ring-1 ring-white/[.03]">
      <header className="border-b border-cyan-100/10 bg-gradient-to-r from-cyan-300/[.12] via-slate-900/40 to-transparent px-5 py-6 sm:px-7 sm:py-7">
        <p className="text-[10px] font-black uppercase tracking-[.28em] text-cyan-300">Carnival Team</p>
        <h2 className="mt-2 break-words font-display text-3xl font-black leading-tight text-white sm:text-4xl">{team.name}</h2>
      </header>

      <div className="grid gap-4 border-b border-white/[.07] p-5 sm:grid-cols-2 sm:p-7">
        <div className="flex min-w-0 items-center gap-4 rounded-2xl border border-white/[.07] bg-white/[.025] p-4">
          <TeamPortrait name={team.captain_name} photoUrl={team.captain_photo_url} title="Captain" />
          <div className="min-w-0">
            <p className="text-[10px] font-black uppercase tracking-[.2em] text-cyan-300">Captain</p>
            <p className="mt-1 break-words text-lg font-extrabold leading-snug text-white sm:text-xl">{team.captain_name}</p>
          </div>
        </div>
        <div className="flex min-w-0 items-center gap-4 rounded-2xl border border-white/[.07] bg-white/[.025] p-4">
          <TeamPortrait name={team.coordinator_name} photoUrl={team.coordinator_photo_url} title="Team Coordinator" />
          <div className="min-w-0">
            <p className="text-[10px] font-black uppercase tracking-[.2em] text-slate-400">Team Coordinator</p>
            <p className="mt-1 break-words text-lg font-extrabold leading-snug text-white sm:text-xl">{team.coordinator_name}</p>
          </div>
        </div>
      </div>

      <section className="p-5 sm:p-7">
        <div className="mb-5 flex items-center justify-between gap-3">
          <h3 className="font-display text-xl font-black uppercase tracking-[.09em] text-white sm:text-2xl">Team Players</h3>
          {team.players.length > 0 && <span className="rounded-full border border-cyan-200/20 bg-cyan-300/[.06] px-3 py-1 text-xs font-bold text-cyan-100">{team.players.length} players</span>}
        </div>

        {team.players.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/15 bg-white/[.02] px-4 py-8 text-center text-sm font-medium text-slate-400">No players bought yet</div>
        ) : (
          <div className="space-y-4">
            {populatedCategories.map((category) => (
              <section key={category} aria-label={category} className="overflow-hidden rounded-2xl border border-white/[.08] bg-[#07131c]/75">
                <h4 className="border-b border-white/[.07] px-4 py-3 text-xs font-black uppercase tracking-[.15em] text-cyan-200 sm:px-5">{category}</h4>
                <ul className="divide-y divide-white/[.06]">
                  {playersByCategory.get(category)?.map((player) => (
                    <li key={player.id} className="flex flex-col gap-1 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:px-5">
                      <span className="break-words text-base font-bold text-white sm:text-lg">{player.name}</span>
                      <span className="text-sm font-medium text-slate-400 sm:shrink-0">{playerCourseYear(player)}</span>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        )}
      </section>
    </article>
  )
}

export function TeamsPage() {
  const [teams, setTeams] = useState<Team[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    let firstLoad = true
    const loadTeams = async () => {
      if (firstLoad && active) setLoading(true)
      try {
        const result = await teamsApi.list()
        if (active) {
          setTeams(result.slice(0, 11))
          setError('')
        }
      } catch (reason: unknown) {
        if (active) setError(getErrorMessage(reason))
      } finally {
        if (active && firstLoad) setLoading(false)
        firstLoad = false
      }
    }

    void loadTeams()
    const interval = window.setInterval(() => { void loadTeams() }, 5000)
    return () => {
      active = false
      window.clearInterval(interval)
    }
  }, [])

  return (
    <main className="relative isolate min-h-[calc(100svh-76px)] overflow-hidden bg-[#07131c] px-4 py-10 sm:px-7 sm:py-14 lg:px-10">
      <div className="stadium-grid pointer-events-none absolute inset-0 -z-20 opacity-35" />
      <div className="stadium-light pointer-events-none absolute inset-x-[-35%] bottom-[-20%] -z-10 h-[70%] opacity-45" />

      <div className="mx-auto max-w-[1500px]">
        <header className="mb-8 flex flex-col gap-4 border-b border-white/10 pb-7 sm:mb-10 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[.28em] text-cyan-300">Avanthi Cricket Carnival</p>
            <h1 className="mt-2 font-display text-4xl font-black text-white sm:text-5xl lg:text-6xl">Meet the Teams</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400 sm:text-base">Captains, coordinators, and players bought for the carnival.</p>
          </div>
          {!loading && !error && <div className="flex items-center gap-3 self-start rounded-2xl border border-cyan-200/20 bg-cyan-300/[.06] px-5 py-3 sm:self-auto"><span className="text-3xl font-black tabular-nums text-cyan-200">{teams.length}</span><span className="text-xs font-bold uppercase tracking-[.16em] text-slate-300">Teams</span></div>}
        </header>

        {error && <div className="mb-6 rounded-2xl border border-rose-300/20 bg-rose-400/[.06] px-5 py-4 text-sm font-medium text-rose-100" role="alert">{error}</div>}
        {loading && <div className="rounded-2xl border border-white/10 bg-slate-950/45 px-5 py-14 text-center text-slate-300" role="status">Loading teams…</div>}
        {!loading && !error && teams.length === 0 && <div className="rounded-2xl border border-white/10 bg-slate-950/45 px-5 py-16 text-center"><p className="text-xl font-bold text-white">No teams added yet</p><p className="mt-2 text-sm text-slate-400">Team details will appear here once they have been added.</p></div>}
        {!loading && teams.length > 0 && <section aria-label="Carnival teams" className="grid grid-cols-1 gap-6 2xl:grid-cols-2 2xl:gap-8">{teams.map((team) => <TeamCard key={team.id} team={team} />)}</section>}
      </div>
    </main>
  )
}
