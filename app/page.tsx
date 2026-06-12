import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getSession } from '@/lib/session'

export default async function LandingPage() {
  const session = await getSession()
  if (session.playerId) redirect('/dashboard')

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-start overflow-hidden px-6 pt-14 sm:pt-20 md:pt-28">

      {/* Ambient background glows */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 h-[520px] w-[520px] rounded-full bg-gold/10 blur-[120px]" />
        <div className="absolute bottom-0 left-0 h-64 w-64 rounded-full bg-blue-600/8 blur-[80px]" />
        <div className="absolute bottom-0 right-0 h-64 w-64 rounded-full bg-blue-600/6 blur-[80px]" />
      </div>

      <div className="relative z-10 flex flex-col items-center text-center max-w-md">

        {/* Logo badge */}
        <div className="anim-fade-up mb-8">
          <img src="/trophy.png" alt="FIFA World Cup trophy" className="w-[100px] h-[100px] sm:w-[140px] sm:h-[140px] md:w-[180px] md:h-[180px] object-contain" />
        </div>

        {/* Hero heading */}
        <div className="anim-fade-up anim-delay-1 leading-none">
          <div className="font-display text-[80px] tracking-widest text-[#EBF0FF] leading-none">FIFA</div>
          <div className="font-display text-[80px] tracking-widest text-gold leading-none">2026</div>
        </div>

        <p className="anim-fade-up anim-delay-2 mt-5 text-xs uppercase tracking-[0.3em] text-pitch-300">
          World Cup Bracket Predictor
        </p>

        {/* CTA */}
        <div className="anim-fade-up anim-delay-3 mt-12 flex w-full flex-col gap-3">
          <Link href="/register" className="btn-gold w-full text-sm tracking-widest uppercase">
            Create Account
          </Link>
          <Link href="/login" className="btn-ghost w-full text-sm">
            Sign In
          </Link>
        </div>

      </div>
    </main>
  )
}
