'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const NAV = [
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'My Bracket', href: '/bracket' },
]

export function Header() {
  const pathname = usePathname()
  if (pathname === '/') return null

  return (
    <header className="sticky top-0 z-50 border-b border-pitch-600 bg-pitch-950/90 backdrop-blur-md px-5 py-3">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        <Link href="/dashboard" className="flex items-center gap-3 group">
          <div className="w-8 h-8 rounded-full bg-gold flex items-center justify-center flex-shrink-0 group-hover:bg-gold-hover transition-colors">
            <span className="font-display text-[13px] text-pitch-950 leading-none">26</span>
          </div>
          <div>
            <p className="font-display text-base leading-none tracking-widest text-[#EBF0FF]">FIFA 2026</p>
            <p className="text-[10px] leading-none mt-0.5 tracking-widest uppercase text-pitch-300">World Cup Predictor</p>
          </div>
        </Link>

        <nav className="flex items-center gap-1">
          {NAV.map(({ label, href }) => {
            const active = pathname === href || pathname.startsWith(href + '/')
            return (
              <Link
                key={href}
                href={href}
                className={`tab-btn ${active ? 'tab-active' : 'tab-inactive'}`}
              >
                {label}
              </Link>
            )
          })}
        </nav>
      </div>
    </header>
  )
}
