import { useState } from 'react'

export function HomePage() {
  const [accLogoUnavailable, setAccLogoUnavailable] = useState(false)

  return (
    <main className="relative isolate flex min-h-[calc(100svh-76px)] items-center justify-center overflow-hidden px-5 py-16 sm:px-8 lg:py-20">
      <div className="stadium-grid pointer-events-none absolute inset-0 -z-20 opacity-70" />
      <div className="stadium-light pointer-events-none absolute inset-x-[-35%] bottom-[-10%] -z-10 h-[85%] opacity-80" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-1/2 bg-gradient-to-t from-[#07131c] via-[#07131c]/80 to-transparent" />

      <div className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-[38%] overflow-hidden opacity-40" aria-hidden="true">
        <div className="pitch-markings absolute left-1/2 top-[-30%] h-[150%] w-[min(1050px,120vw)] -translate-x-1/2 rounded-[50%] border border-cyan-200/20" />
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-emerald-950/70 to-transparent" />
      </div>

      <div className="absolute left-[7%] top-[15%] hidden h-2 w-2 rounded-full bg-cyan-200 shadow-[0_0_18px_5px_rgba(103,232,249,.5)] sm:block" aria-hidden="true" />
      <div className="absolute right-[12%] top-[27%] hidden h-1.5 w-1.5 rounded-full bg-emerald-200 shadow-[0_0_16px_4px_rgba(110,231,183,.5)] sm:block" aria-hidden="true" />
      <div className="absolute bottom-[24%] left-[18%] hidden h-1.5 w-1.5 rounded-full bg-cyan-100 shadow-[0_0_16px_4px_rgba(165,243,252,.5)] md:block" aria-hidden="true" />

      <section className="relative mx-auto flex w-full max-w-5xl flex-col items-center text-center">
        <div className="absolute left-1/2 top-1/2 -z-10 aspect-square w-[min(80vw,680px)] -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-400/[.07] blur-[100px]" aria-hidden="true" />
        <div className="mb-7 flex h-48 w-48 items-center justify-center rounded-full border border-cyan-200/20 bg-slate-950/35 p-5 shadow-[0_0_35px_rgba(34,211,238,.1),inset_0_0_32px_rgba(34,211,238,.08)] sm:mb-9 sm:h-64 sm:w-64 sm:p-7 lg:h-[300px] lg:w-[300px]">
          {accLogoUnavailable ? (
            <div className="flex flex-col items-center text-center" aria-label="ACC — Avanthi Cricket Carnival">
              <span className="font-display text-6xl font-black tracking-widest text-cyan-100 drop-shadow-[0_0_18px_rgba(103,232,249,.65)] sm:text-8xl">ACC</span>
              <span className="mt-1 text-[9px] font-bold uppercase tracking-[.22em] text-emerald-100 sm:text-[11px]">Avanthi Cricket Carnival</span>
            </div>
          ) : (
            <span className="flex h-full w-full items-center justify-center rounded-[1.75rem] bg-black p-3">
              <img src="/ACC-logo.jpeg" alt="ACC — Avanthi Cricket Carnival" onError={() => setAccLogoUnavailable(true)} className="h-full w-full object-contain drop-shadow-[0_0_20px_rgba(103,232,249,.32)]" />
            </span>
          )}
        </div>
        <p className="mb-3 text-xs font-bold uppercase tracking-[.36em] text-cyan-200/80 sm:text-sm">Avanthi Institute of Engineering</p>
        <h1 className="font-display max-w-4xl text-4xl font-black uppercase leading-[.95] tracking-[.03em] text-white drop-shadow-[0_4px_24px_rgba(34,211,238,.2)] sm:text-6xl lg:text-7xl">
          Avanthi Cricket <span className="block bg-gradient-to-r from-cyan-200 via-white to-emerald-200 bg-clip-text text-transparent">Carnival</span>
        </h1>
        <div className="mt-7 flex items-center gap-3 text-[10px] font-bold uppercase tracking-[.3em] text-slate-400 sm:mt-9 sm:text-xs">
          <span className="h-px w-8 bg-gradient-to-r from-transparent to-cyan-300/70 sm:w-14" />
          The auction begins here
          <span className="h-px w-8 bg-gradient-to-l from-transparent to-cyan-300/70 sm:w-14" />
        </div>
      </section>
    </main>
  )
}
