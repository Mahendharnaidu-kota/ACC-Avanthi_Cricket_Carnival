import axios from 'axios'
import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react'
import { playersApi } from '../api/client'
import type { Course, PlayerCreate, SkillType } from '../api/types'

const branchesByCourse: Record<Course, string[]> = {
  BTech: ['CSE', 'CSM', 'CSD', 'ECE', 'EEE', 'MECH'],
  Diploma: ['CM', 'EC', 'EE', 'M'],
  MBA: ['General'],
  MCA: ['General'],
  MTech: ['General'],
}

const courses: Course[] = ['BTech', 'Diploma', 'MBA', 'MCA', 'MTech']
const basePrices = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 120, 140, 160, 180, 200, 230, 250]
const basePricePattern = '^(10|20|30|40|50|60|70|80|90|100|120|140|160|180|200|230|250)$'
const inputClass = 'mt-2 w-full rounded-xl border border-white/10 bg-slate-950/75 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-300/70 focus:ring-2 focus:ring-cyan-300/15 disabled:cursor-not-allowed disabled:opacity-45'

interface RegistrationForm {
  roll_number: string
  mobile: string
  name: string
  photo_url: string
  course: Course | ''
  branch: string
  year: string
  cricheroes_url: string
  base_price: string
  skill_type: SkillType | ''
  batting_style: PlayerCreate['batting_style']
  bowling_style: PlayerCreate['bowling_style']
  is_wicket_keeper: boolean
}

const emptyForm: RegistrationForm = {
  roll_number: '',
  mobile: '',
  name: '',
  photo_url: '',
  course: '',
  branch: '',
  year: '',
  cricheroes_url: '',
  base_price: '',
  skill_type: '',
  batting_style: null,
  bowling_style: null,
  is_wicket_keeper: false,
}

function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const detail = (error.response?.data as { detail?: unknown } | undefined)?.detail
    if (typeof detail === 'string') return detail
    if (Array.isArray(detail)) {
      const messages = detail
        .map((item) => (typeof item === 'object' && item !== null && 'msg' in item ? String(item.msg) : ''))
        .filter(Boolean)
      if (messages.length > 0) return messages.join('; ')
    }
    return error.message || 'Registration failed. Please try again.'
  }
  return error instanceof Error ? error.message : 'Registration failed. Please try again.'
}

function CricketDecorations() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      <div className="cricket-drift absolute left-[7%] top-[13%] hidden h-40 w-16 opacity-35 sm:block" style={{ animationDelay: '-2s' }}>
        <svg viewBox="0 0 64 180" className="h-full w-full drop-shadow-[0_0_18px_rgba(251,191,36,.3)]">
          <path d="M26 10h12v42l8 10v88c0 12-6 19-14 19s-14-7-14-19V62l8-10z" fill="#d9a441" stroke="#ffe7a3" strokeWidth="3" />
          <path d="M26 47h12M21 70h22" stroke="#fff1c2" strokeOpacity=".6" strokeWidth="3" />
        </svg>
      </div>

      <div className="cricket-drift absolute right-[10%] top-[17%] h-16 w-16 opacity-45 sm:h-20 sm:w-20" style={{ animationDelay: '-4s' }}>
        <svg viewBox="0 0 100 100" className="cricket-spin h-full w-full drop-shadow-[0_0_20px_rgba(248,113,113,.4)]">
          <circle cx="50" cy="50" r="40" fill="#b91c1c" stroke="#fb7185" strokeWidth="3" />
          <path d="M30 16c20 20 20 48 0 68M38 12c20 20 20 56 0 76" fill="none" stroke="#fecdd3" strokeWidth="2.5" strokeDasharray="4 5" />
        </svg>
      </div>

      <div className="cricket-drift absolute bottom-[15%] right-[8%] hidden h-36 w-28 opacity-35 md:block" style={{ animationDelay: '-1s' }}>
        <svg viewBox="0 0 120 150" className="h-full w-full drop-shadow-[0_0_18px_rgba(103,232,249,.35)]">
          <path d="M26 25h68l-6 111H32z" fill="#082d3a" fillOpacity=".3" stroke="#67e8f9" strokeWidth="3" />
          <path d="M38 23V8h10v15M56 23V8h10v15M74 23V8h10v15" fill="none" stroke="#a5f3fc" strokeLinecap="round" strokeWidth="8" />
          <path d="M28 40h64" stroke="#67e8f9" strokeOpacity=".6" strokeWidth="2" />
        </svg>
      </div>

      <div className="cricket-drift absolute bottom-[23%] left-[13%] hidden h-14 w-14 opacity-40 lg:block" style={{ animationDelay: '-5s' }}>
        <svg viewBox="0 0 100 100" className="cricket-spin h-full w-full drop-shadow-[0_0_18px_rgba(248,113,113,.35)]">
          <circle cx="50" cy="50" r="38" fill="#991b1b" stroke="#f87171" strokeWidth="3" />
          <path d="M30 15c19 19 21 51 2 70M39 12c19 19 22 57 2 76" fill="none" stroke="#fecaca" strokeWidth="2.5" strokeDasharray="4 5" />
        </svg>
      </div>
    </div>
  )
}

function FormField({ label, required = false, children }: { label: string; required?: boolean; children: ReactNode }) {
  return (
    <label className="block text-sm font-semibold text-slate-200">
      {label}{required && <span className="ml-1 text-rose-300" aria-hidden="true">*</span>}
      {children}
    </label>
  )
}

export function RegisterPage() {
  const [formOpen, setFormOpen] = useState(false)
  const [form, setForm] = useState<RegistrationForm>(emptyForm)
  const [apiError, setApiError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const branches = useMemo(() => (form.course ? branchesByCourse[form.course] : []), [form.course])

  useEffect(() => {
    if (!formOpen) return
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !submitting) setFormOpen(false)
    }
    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [formOpen, submitting])

  const openForm = () => {
    setApiError('')
    setSuccessMessage('')
    setFormOpen(true)
  }

  const updateForm = <K extends keyof RegistrationForm>(key: K, value: RegistrationForm[K]) => {
    setForm((current) => ({ ...current, [key]: value }))
    setApiError('')
    setSuccessMessage('')
  }

  const chooseSkill = (skill: SkillType) => {
    setForm((current) => ({ ...current, skill_type: skill, batting_style: null, bowling_style: null }))
    setApiError('')
    setSuccessMessage('')
  }

  const changeSkill = () => {
    setForm((current) => ({ ...current, skill_type: '', batting_style: null, bowling_style: null }))
  }

  const changeBasePrice = (value: string) => {
    const partialMatch = value === '' || basePrices.some((price) => String(price).startsWith(value))
    if (partialMatch) updateForm('base_price', value)
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setApiError('')
    setSuccessMessage('')

    if (!/^\d{10}$/.test(form.mobile)) {
      setApiError('Mobile number must contain exactly 10 digits.')
      return
    }
    if (!basePrices.includes(Number(form.base_price))) {
      setApiError('Choose one of the listed base prices.')
      return
    }
    if (!form.skill_type) {
      setApiError('Choose one primary skill.')
      return
    }
    if (form.skill_type === 'batting' && !form.batting_style) {
      setApiError('Choose a batting style.')
      return
    }
    if (form.skill_type === 'bowling' && !form.bowling_style) {
      setApiError('Choose a bowling style.')
      return
    }

    const payload: PlayerCreate = {
      roll_number: form.roll_number.trim(),
      mobile: form.mobile,
      name: form.name.trim(),
      photo_url: form.photo_url.trim(),
      course: form.course as Course,
      branch: form.branch,
      year: Number(form.year),
      cricheroes_url: form.cricheroes_url.trim() || null,
      base_price: Number(form.base_price),
      skill_type: form.skill_type,
      batting_style: form.skill_type === 'batting' ? form.batting_style : null,
      bowling_style: form.skill_type === 'bowling' ? form.bowling_style : null,
      is_wicket_keeper: form.is_wicket_keeper,
    }

    setSubmitting(true)
    try {
      const player = await playersApi.register(payload)
      setForm(emptyForm)
      setSuccessMessage(`Registration complete for ${player.name}. Payment status: Not Paid.`)
    } catch (error) {
      setApiError(getErrorMessage(error))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="relative isolate flex min-h-[calc(100svh-76px)] items-center justify-center overflow-hidden bg-[#07131c] px-5 py-16 sm:px-8">
      <div className="stadium-grid pointer-events-none absolute inset-0 -z-20 opacity-50" />
      <div className="stadium-light pointer-events-none absolute inset-x-[-35%] bottom-[-10%] -z-10 h-[85%] opacity-70" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-1/2 bg-gradient-to-t from-emerald-950/40 to-transparent" />
      <CricketDecorations />

      <section className="relative z-10 flex w-full max-w-3xl flex-col items-center text-center">
        <p className="mb-3 text-xs font-bold uppercase tracking-[.32em] text-cyan-200/80 sm:text-sm">Avanthi Cricket Carnival</p>
        <h1 className="font-display text-4xl font-black uppercase tracking-wide text-white drop-shadow-[0_0_26px_rgba(34,211,238,.18)] sm:text-6xl">Step up to the crease</h1>
        <p className="mt-4 max-w-lg text-sm leading-6 text-slate-300 sm:text-base">Register as a player and get ready for the ACC auction.</p>
        <button
          type="button"
          onClick={openForm}
          className="mt-9 rounded-full border border-cyan-100/70 bg-cyan-300 px-8 py-4 text-sm font-black uppercase tracking-[.14em] text-slate-950 shadow-[0_0_32px_rgba(34,211,238,.28)] transition hover:-translate-y-0.5 hover:bg-cyan-200 hover:shadow-[0_0_42px_rgba(34,211,238,.42)] focus:outline-none focus:ring-4 focus:ring-cyan-200/30 sm:px-10 sm:text-base"
        >
          Register Here
        </button>
        <p className="mt-4 text-xs text-slate-400">All player details are required except your CricHeroes profile.</p>
      </section>

      {formOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 px-3 py-4 backdrop-blur-md sm:px-6 sm:py-8"
          onMouseDown={(event) => { if (event.target === event.currentTarget && !submitting) setFormOpen(false) }}
        >
          <section role="dialog" aria-modal="true" aria-labelledby="registration-title" className="relative max-h-full w-full max-w-4xl overflow-y-auto rounded-3xl border border-cyan-200/20 bg-[#091521] p-5 shadow-[0_0_90px_rgba(34,211,238,.14)] sm:p-8">
            <button type="button" onClick={() => setFormOpen(false)} disabled={submitting} aria-label="Close registration form" className="absolute right-4 top-4 rounded-lg px-3 py-1 text-2xl leading-none text-slate-400 transition hover:bg-white/10 hover:text-white disabled:opacity-40">×</button>
            <div className="pr-9">
              <p className="text-xs font-bold uppercase tracking-[.24em] text-cyan-300">Player registration</p>
              <h2 id="registration-title" className="mt-2 font-display text-3xl font-black text-white sm:text-4xl">Register for the auction</h2>
              <p className="mt-2 text-sm leading-6 text-slate-400">Enter your details carefully. Required fields are marked with an asterisk.</p>
            </div>

            {successMessage && <p role="status" className="mt-5 rounded-xl border border-emerald-300/30 bg-emerald-300/10 px-4 py-3 text-sm font-semibold text-emerald-200">{successMessage}</p>}
            {apiError && <p role="alert" className="mt-5 rounded-xl border border-rose-300/30 bg-rose-400/10 px-4 py-3 text-sm font-semibold text-rose-200">{apiError}</p>}

            <form onSubmit={handleSubmit} className="mt-6 space-y-7">
              <div className="grid gap-x-5 gap-y-4 sm:grid-cols-2">
                <FormField label="Roll Number" required>
                  <input className={inputClass} name="roll_number" autoComplete="off" maxLength={50} required value={form.roll_number} onChange={(event) => updateForm('roll_number', event.target.value)} placeholder="e.g. 22A91A0501" />
                </FormField>
                <FormField label="Mobile Number" required>
                  <input className={inputClass} name="mobile" type="tel" inputMode="numeric" autoComplete="tel-national" pattern="[0-9]{10}" maxLength={10} minLength={10} required value={form.mobile} onChange={(event) => updateForm('mobile', event.target.value.replace(/\D/g, '').slice(0, 10))} placeholder="10-digit mobile number" />
                </FormField>
                <FormField label="Full Name" required>
                  <input className={inputClass} name="name" autoComplete="name" maxLength={200} required value={form.name} onChange={(event) => updateForm('name', event.target.value)} placeholder="Your name" />
                </FormField>
                <FormField label="Photograph URL" required>
                  <input className={inputClass} name="photo_url" type="url" required value={form.photo_url} onChange={(event) => updateForm('photo_url', event.target.value)} placeholder="https://example.com/photo.jpg" />
                </FormField>
                <FormField label="Course" required>
                  <select className={inputClass} name="course" required value={form.course} onChange={(event) => setForm((current) => ({ ...current, course: event.target.value as Course | '', branch: '' }))}>
                    <option value="" disabled>Select your course</option>
                    {courses.map((course) => <option key={course} value={course} className="bg-slate-900">{course}</option>)}
                  </select>
                </FormField>
                <FormField label="Branch" required>
                  <select className={inputClass} name="branch" required disabled={!form.course} value={form.branch} onChange={(event) => updateForm('branch', event.target.value)}>
                    <option value="" disabled>{form.course ? 'Select your branch' : 'Choose a course first'}</option>
                    {branches.map((branch) => <option key={branch} value={branch} className="bg-slate-900">{branch}</option>)}
                  </select>
                </FormField>
                <FormField label="Year" required>
                  <select className={inputClass} name="year" required value={form.year} onChange={(event) => updateForm('year', event.target.value)}>
                    <option value="" disabled>Select your year</option>
                    {[1, 2, 3, 4].map((year) => <option key={year} value={year} className="bg-slate-900">{['', '1st', '2nd', '3rd', '4th'][year]} Year</option>)}
                  </select>
                </FormField>
                <FormField label="CricHeroes Profile URL">
                  <input className={inputClass} name="cricheroes_url" type="url" value={form.cricheroes_url} onChange={(event) => updateForm('cricheroes_url', event.target.value)} placeholder="Optional" />
                </FormField>
                <FormField label="Base Price (₹)" required>
                  <input className={inputClass} name="base_price" type="text" inputMode="numeric" list="base-price-options" pattern={basePricePattern} title="Choose an allowed base price from the list" required value={form.base_price} onChange={(event) => changeBasePrice(event.target.value)} placeholder="Select or type a price" />
                  <datalist id="base-price-options">{basePrices.map((price) => <option key={price} value={price} />)}</datalist>
                  <span className="mt-1.5 block text-xs font-normal text-slate-500">Allowed values: {basePrices.join(', ')}</span>
                </FormField>
              </div>

              <fieldset className="rounded-2xl border border-white/10 bg-white/[.025] p-4 sm:p-5">
                <legend className="px-2 text-sm font-bold text-slate-100">Primary Skill <span className="text-rose-300">*</span></legend>
                <p className="mb-4 text-xs text-slate-400">Choose exactly one. Wicket Keeper can be added separately.</p>
                {!form.skill_type ? (
                  <div className="grid gap-3 sm:grid-cols-3">
                    {([
                      ['batting', 'Batting', 'Choose a batting style'],
                      ['bowling', 'Bowling', 'Choose a bowling style'],
                      ['allrounder', 'All-rounder', 'No additional style needed'],
                    ] as const).map(([value, label, description]) => (
                      <button key={value} type="button" onClick={() => chooseSkill(value)} className="rounded-xl border border-white/10 bg-slate-950/40 p-4 text-left transition hover:border-cyan-300/50 hover:bg-cyan-300/[.06] focus:outline-none focus:ring-2 focus:ring-cyan-300/30">
                        <span className="block font-bold text-white">{label}</span>
                        <span className="mt-1 block text-xs text-slate-400">{description}</span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-cyan-300/25 bg-cyan-300/[.06] px-4 py-3">
                    <span className="text-sm font-bold text-cyan-100">Selected: {form.skill_type === 'allrounder' ? 'All-rounder' : form.skill_type[0].toUpperCase() + form.skill_type.slice(1)}</span>
                    <button type="button" onClick={changeSkill} className="rounded-lg border border-white/15 px-3 py-2 text-xs font-bold text-slate-200 transition hover:bg-white/10">Change skill</button>
                  </div>
                )}

                {form.skill_type === 'batting' && (
                  <div className="mt-4">
                    <p className="mb-2 text-sm font-semibold text-slate-200">Batting style <span className="text-rose-300">*</span></p>
                    <div className="grid gap-2 sm:grid-cols-3">
                      {(['strike rotator', 'aggressive batter', 'big hitter'] as const).map((style) => (
                        <label key={style} className={`flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-3 text-sm capitalize transition ${form.batting_style === style ? 'border-cyan-300/60 bg-cyan-300/10 text-cyan-100' : 'border-white/10 bg-slate-950/40 text-slate-300 hover:border-white/20'}`}>
                          <input type="radio" name="batting_style" required checked={form.batting_style === style} onChange={() => updateForm('batting_style', style)} className="accent-cyan-300" />
                          {style}
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {form.skill_type === 'bowling' && (
                  <div className="mt-4">
                    <p className="mb-2 text-sm font-semibold text-slate-200">Bowling style <span className="text-rose-300">*</span></p>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {(['fast', 'spin'] as const).map((style) => (
                        <label key={style} className={`flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-3 text-sm capitalize transition ${form.bowling_style === style ? 'border-cyan-300/60 bg-cyan-300/10 text-cyan-100' : 'border-white/10 bg-slate-950/40 text-slate-300 hover:border-white/20'}`}>
                          <input type="radio" name="bowling_style" required checked={form.bowling_style === style} onChange={() => updateForm('bowling_style', style)} className="accent-cyan-300" />
                          {style}
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                <label className="mt-4 flex w-fit cursor-pointer items-center gap-3 rounded-xl border border-white/10 bg-slate-950/40 px-4 py-3 text-sm font-semibold text-slate-200 transition hover:border-white/20">
                  <input type="checkbox" checked={form.is_wicket_keeper} onChange={(event) => updateForm('is_wicket_keeper', event.target.checked)} className="h-4 w-4 accent-cyan-300" />
                  Wicket Keeper
                </label>
              </fieldset>

              <div className="flex flex-col-reverse gap-3 border-t border-white/10 pt-5 sm:flex-row sm:justify-end">
                <button type="button" onClick={() => setFormOpen(false)} disabled={submitting} className="rounded-xl border border-white/15 px-6 py-3 text-sm font-bold text-slate-300 transition hover:bg-white/5 disabled:opacity-50">Cancel</button>
                <button type="submit" disabled={submitting} className="rounded-xl bg-cyan-300 px-7 py-3 text-sm font-black text-slate-950 transition hover:bg-cyan-200 disabled:cursor-wait disabled:opacity-60">
                  {submitting ? 'Submitting…' : 'Register'}
                </button>
              </div>
              <p className="text-center text-xs text-slate-500">Your registration will start with payment status Not Paid.</p>
            </form>
          </section>
        </div>
      )}
    </main>
  )
}
