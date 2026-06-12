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
    <header className="border-b border-slate-800 bg-slate-950 px-4 py-3">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        <div>
          <p className="text-base font-bold leading-tight">FIFA 2026</p>
          <p className="text-xs text-slate-500 leading-tight">World Cup Bracket Predictor</p>
        </div>
        <nav className="flex items-center gap-1">
          {NAV.map(({ label, href }) => (
            <Link
              key={href}
              href={href}
              className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                pathname === href || pathname.startsWith(href + '/')
                  ? 'bg-slate-800 text-white'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              {label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  )
}
