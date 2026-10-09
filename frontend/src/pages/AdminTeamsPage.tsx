import axios from 'axios'
import { useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { teamsApi } from '../api/client'
import type { Team, TeamCreate } from '../api/types'

const MAX_TEAMS = 11

const emptyForm: TeamCreate = {
  name: '',
  captain_name: '',
  captain_photo_url: '',
  coordinator_name: '',
  coordinator_photo_url: '',
}

function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const detail = (error.response?.data as { detail?: unknown } | undefined)?.detail
    if (typeof detail === 'string') return detail
    if (Array.isArray(detail)) {
      const messages = detail
        .map((item) => typeof item === 'object' && item !== null && 'msg' in item ? String(item.msg) : '')
        .filter(Boolean)
      if (messages.length) return messages.join('; ')
    }
    return error.message || 'The request could not be completed.'
  }
  return error instanceof Error ? error.message : 'The request could not be completed.'
}

function TeamPortrait({ name, url, role }: { name: string; url: string; role: string }) {
  const [failed, setFailed] = useState(false)
  if (failed || !url) {
    return <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border border-cyan-200/20 bg-cyan-300/10 text-2xl font-black text-cyan-100" aria-label={`${role} photo unavailable`}>{name.charAt(0).toUpperCase()}</div>
  }
  return <img src={url} alt={name} loading="lazy" onError={() => setFailed(true)} className="h-16 w-16 shrink-0 rounded-full border border-white/10 bg-slate-900 object-cover" />
}

export function AdminTeamsPage() {
  const [teams, setTeams] = useState<Team[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [actionError, setActionError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [form, setForm] = useState<TeamCreate>(emptyForm)
  const [editingTeam, setEditingTeam] = useState<Team | null>(null)
  const [saving, setSaving] = useState(false)
  const [deletingTeamId, setDeletingTeamId] = useState<number | null>(null)
  const [retry, setRetry] = useState(0)

  useEffect(() => {
    let active = true
    setLoading(true)
    setLoadError('')
    teamsApi.list()
      .then((result) => { if (active) setTeams(result) })
      .catch((error: unknown) => { if (active) { setTeams([]); setLoadError(getErrorMessage(error)) } })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [retry])

  const setField = (field: keyof TeamCreate, value: string) => {
    setForm((current) => ({ ...current, [field]: value }))
    setActionError('')
    setSuccessMessage('')
  }

  const resetForm = () => {
    setForm(emptyForm)
    setEditingTeam(null)
  }

  const beginEdit = (team: Team) => {
    setEditingTeam(team)
    setForm({
      name: team.name,
      captain_name: team.captain_name,
      captain_photo_url: team.captain_photo_url,
      coordinator_name: team.coordinator_name,
      coordinator_photo_url: team.coordinator_photo_url,
    })
    setActionError('')
    setSuccessMessage('')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setActionError('')
    setSuccessMessage('')
    const payload: TeamCreate = {
      name: form.name.trim(),
      captain_name: form.captain_name.trim(),
      captain_photo_url: form.captain_photo_url.trim(),
      coordinator_name: form.coordinator_name.trim(),
      coordinator_photo_url: form.coordinator_photo_url.trim(),
    }
    if (Object.values(payload).some((value) => !value)) {
      setActionError('Complete every field before saving.')
      return
    }

    setSaving(true)
    try {
      if (editingTeam) {
        const updated = await teamsApi.update(editingTeam.id, payload)
        setTeams((current) => current.map((team) => team.id === updated.id ? updated : team))
        setSuccessMessage(`${updated.name} updated successfully.`)
      } else {
        const created = await teamsApi.create(payload)
        setTeams((current) => [...current, created])
        setSuccessMessage(`${created.name} added successfully.`)
      }
      resetForm()
    } catch (error) {
      setActionError(getErrorMessage(error))
    } finally {
      setSaving(false)
    }
  }

  const deleteTeam = async (team: Team) => {
    if (!window.confirm(`Delete ${team.name}? This action cannot be undone.`)) return
    setDeletingTeamId(team.id)
    setActionError('')
    setSuccessMessage('')
    try {
      await teamsApi.remove(team.id)
      setTeams((current) => current.filter((item) => item.id !== team.id))
      if (editingTeam?.id === team.id) resetForm()
      setSuccessMessage(`${team.name} deleted successfully.`)
    } catch (error) {
      setActionError(getErrorMessage(error))
    } finally {
      setDeletingTeamId(null)
    }
  }

  const atTeamLimit = teams.length >= MAX_TEAMS
  const formDisabled = saving || (!editingTeam && atTeamLimit)

  return (
    <main className="relative isolate min-h-[calc(100svh-76px)] overflow-hidden bg-[#07131c] px-4 py-10 sm:px-7 sm:py-14 lg:px-10">
      <div className="stadium-grid pointer-events-none absolute inset-0 -z-20 opacity-35" />
      <div className="stadium-light pointer-events-none absolute inset-x-[-35%] bottom-[-20%] -z-10 h-[70%] opacity-45" />

      <div className="mx-auto max-w-6xl">
        <header className="mb-8 flex flex-col gap-4 border-b border-white/10 pb-7 sm:mb-10 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[.28em] text-cyan-300">ACC Control Room</p>
            <h1 className="mt-2 font-display text-4xl font-black text-white sm:text-5xl">Assign Team and Add Captain</h1>
            <p className="mt-2 text-sm leading-6 text-slate-400">Create and maintain the teams taking part in the carnival.</p>
          </div>
          <Link to="/admin" className="inline-flex w-fit items-center rounded-xl border border-white/15 bg-white/[.04] px-4 py-2.5 text-sm font-bold text-slate-200 transition hover:border-cyan-200/40 hover:bg-white/[.08]">Back to Dashboard</Link>
        </header>

        <section className="mb-9 rounded-3xl border border-white/10 bg-slate-950/50 p-5 shadow-[0_22px_70px_rgba(0,0,0,.25)] sm:p-7">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-[.2em] text-cyan-300">Team registration</p>
              <h2 className="mt-1 text-2xl font-black text-white">{editingTeam ? 'Edit team' : 'Add a team'}</h2>
            </div>
            <span className={`rounded-full border px-4 py-2 text-sm font-extrabold tabular-nums ${atTeamLimit ? 'border-amber-200/30 bg-amber-300/[.08] text-amber-100' : 'border-cyan-200/20 bg-cyan-300/[.06] text-cyan-100'}`}>
              {teams.length} / {MAX_TEAMS} teams added
            </span>
          </div>

          {atTeamLimit && !editingTeam && <p className="mb-5 rounded-xl border border-amber-200/20 bg-amber-300/[.06] px-4 py-3 text-sm font-medium text-amber-100" role="status">The maximum of 11 teams has been reached. Delete a team to add another.</p>}

          <form onSubmit={handleSubmit} className="space-y-5">
            <fieldset disabled={formDisabled} className="grid gap-4 sm:grid-cols-2">
              <label className="text-sm font-semibold text-slate-200">
                Team Name
                <input required maxLength={120} value={form.name} onChange={(event) => setField('name', event.target.value)} placeholder="Team name" className="mt-2 w-full rounded-xl border border-white/10 bg-slate-950/80 px-4 py-3 text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-300/70 focus:ring-2 focus:ring-cyan-300/15 disabled:cursor-not-allowed disabled:opacity-50" />
              </label>
              <label className="text-sm font-semibold text-slate-200">
                Captain Name
                <input required maxLength={200} value={form.captain_name} onChange={(event) => setField('captain_name', event.target.value)} placeholder="Captain name" className="mt-2 w-full rounded-xl border border-white/10 bg-slate-950/80 px-4 py-3 text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-300/70 focus:ring-2 focus:ring-cyan-300/15 disabled:cursor-not-allowed disabled:opacity-50" />
              </label>
              <label className="text-sm font-semibold text-slate-200">
                Captain Photo URL
                <input required type="url" value={form.captain_photo_url} onChange={(event) => setField('captain_photo_url', event.target.value)} placeholder="https://example.com/captain.jpg" className="mt-2 w-full rounded-xl border border-white/10 bg-slate-950/80 px-4 py-3 text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-300/70 focus:ring-2 focus:ring-cyan-300/15 disabled:cursor-not-allowed disabled:opacity-50" />
              </label>
              <label className="text-sm font-semibold text-slate-200">
                Team Coordinator Name
                <input required maxLength={200} value={form.coordinator_name} onChange={(event) => setField('coordinator_name', event.target.value)} placeholder="Coordinator name" className="mt-2 w-full rounded-xl border border-white/10 bg-slate-950/80 px-4 py-3 text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-300/70 focus:ring-2 focus:ring-cyan-300/15 disabled:cursor-not-allowed disabled:opacity-50" />
              </label>
              <label className="text-sm font-semibold text-slate-200 sm:col-span-2">
                Coordinator Photo URL
                <input required type="url" value={form.coordinator_photo_url} onChange={(event) => setField('coordinator_photo_url', event.target.value)} placeholder="https://example.com/coordinator.jpg" className="mt-2 w-full rounded-xl border border-white/10 bg-slate-950/80 px-4 py-3 text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-300/70 focus:ring-2 focus:ring-cyan-300/15 disabled:cursor-not-allowed disabled:opacity-50" />
              </label>
            </fieldset>

            {actionError && <p className="rounded-xl border border-rose-300/20 bg-rose-400/[.06] px-4 py-3 text-sm text-rose-100" role="alert">{actionError}</p>}
            {successMessage && <p className="rounded-xl border border-emerald-300/20 bg-emerald-400/[.06] px-4 py-3 text-sm text-emerald-100" role="status">{successMessage}</p>}

            <div className="flex flex-wrap gap-3">
              <button type="submit" disabled={formDisabled} className="rounded-xl bg-cyan-300 px-6 py-3 text-sm font-extrabold text-slate-950 transition hover:bg-cyan-200 disabled:cursor-not-allowed disabled:opacity-50">
                {saving ? 'Saving…' : editingTeam ? 'Save Changes' : 'Add'}
              </button>
              {editingTeam && <button type="button" onClick={resetForm} disabled={saving} className="rounded-xl border border-white/15 px-5 py-3 text-sm font-bold text-slate-200 transition hover:bg-white/[.06] disabled:opacity-50">Cancel edit</button>}
            </div>
          </form>
        </section>

        <section aria-labelledby="team-list-heading">
          <div className="mb-5 flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[.2em] text-cyan-300">Carnival teams</p>
              <h2 id="team-list-heading" className="mt-1 text-2xl font-black text-white">Added Teams</h2>
            </div>
          </div>

          {loading && <div className="rounded-2xl border border-white/10 bg-slate-950/45 px-5 py-12 text-center text-slate-300" role="status">Loading teams…</div>}
          {!loading && loadError && <div className="rounded-2xl border border-rose-300/20 bg-rose-400/[.06] px-5 py-8 text-center" role="alert"><p className="font-semibold text-rose-100">{loadError}</p><button type="button" onClick={() => setRetry((value) => value + 1)} className="mt-4 rounded-xl border border-rose-200/25 px-4 py-2 text-sm font-bold text-rose-100 transition hover:bg-rose-300/10">Try again</button></div>}
          {!loading && !loadError && teams.length === 0 && <div className="rounded-2xl border border-white/10 bg-slate-950/45 px-5 py-14 text-center"><p className="text-lg font-bold text-white">No teams yet</p><p className="mt-2 text-sm text-slate-400">Add the first team using the form above.</p></div>}
          {!loading && !loadError && teams.length > 0 && (
            <div className="grid gap-5 md:grid-cols-2">
              {teams.map((team) => (
                <article key={team.id} className="rounded-2xl border border-white/10 bg-slate-950/65 p-5 shadow-[0_18px_48px_rgba(0,0,0,.2)] sm:p-6">
                  <div className="flex flex-wrap items-start justify-between gap-3 border-b border-white/10 pb-4">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-[.18em] text-slate-500">Team {String(team.id).padStart(2, '0')}</p>
                      <h3 className="mt-1 text-2xl font-black text-white">{team.name}</h3>
                    </div>
                    <span className="rounded-lg border border-amber-200/20 bg-amber-300/[.06] px-3 py-1.5 text-xs font-bold text-amber-100">Purse {team.purse}</span>
                  </div>
                  <div className="grid gap-4 py-5 sm:grid-cols-2">
                    <div className="flex items-center gap-3">
                      <TeamPortrait name={team.captain_name} url={team.captain_photo_url} role="Captain" />
                      <div className="min-w-0"><p className="text-[10px] font-bold uppercase tracking-[.16em] text-cyan-300">Captain</p><p className="mt-1 truncate font-bold text-white">{team.captain_name}</p></div>
                    </div>
                    <div className="flex items-center gap-3">
                      <TeamPortrait name={team.coordinator_name} url={team.coordinator_photo_url} role="Coordinator" />
                      <div className="min-w-0"><p className="text-[10px] font-bold uppercase tracking-[.16em] text-slate-400">Team Coordinator</p><p className="mt-1 truncate font-bold text-white">{team.coordinator_name}</p></div>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-3 border-t border-white/10 pt-4">
                    <button type="button" onClick={() => beginEdit(team)} className="rounded-lg border border-cyan-200/25 bg-cyan-300/[.06] px-4 py-2 text-sm font-bold text-cyan-100 transition hover:border-cyan-200/50 hover:bg-cyan-300/10">Edit</button>
                    <button type="button" onClick={() => void deleteTeam(team)} disabled={deletingTeamId === team.id} className="rounded-lg border border-rose-200/25 bg-rose-300/[.05] px-4 py-2 text-sm font-bold text-rose-100 transition hover:border-rose-200/50 hover:bg-rose-300/10 disabled:cursor-wait disabled:opacity-50">{deletingTeamId === team.id ? 'Deleting…' : 'Delete'}</button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  )
}
