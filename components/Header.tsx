'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const NAV = [
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'My Bracket', href: '/bracket' },
]

const HIDE_ON = ['/', '/login', '/register']

export function Header({ isLoggedIn }: { isLoggedIn: boolean }) {
  const pathname = usePathname()
  if (HIDE_ON.includes(pathname)) return null

  return (
    <header className="sticky top-0 z-50 border-b border-pitch-600 bg-pitch-950/90 backdrop-blur-md">
      <div className="max-w-6xl mx-auto w-full flex items-center justify-between px-5 py-3">
        <Link href={isLoggedIn ? '/dashboard' : '/'} className="flex items-center gap-3 group">
          <img src="/trophy.png" alt="FIFA World Cup trophy" className="w-9 h-9 object-contain flex-shrink-0" />
          <div>
            <p className="font-display text-base leading-none tracking-widest text-[#EBF0FF]">FIFA 2026</p>
            <p className="text-[10px] leading-none mt-0.5 tracking-widest uppercase text-pitch-300">World Cup Predictor</p>
          </div>
        </Link>

        <nav className="flex items-center gap-5">
          {isLoggedIn ? (
            <>
              {NAV.map(({ label, href }) => {
                const active = pathname === href || pathname.startsWith(href + '/')
                return (
                  <Link
                    key={href}
                    href={href}
                    className={`text-xs uppercase tracking-widest transition-colors ${active ? 'text-[#EBF0FF]' : 'text-pitch-300 hover:text-[#EBF0FF]'}`}
                  >
                    {label}
                  </Link>
                )
              })}
              <form action="/api/auth/logout" method="POST" className="flex items-center">
                <button className="text-xs uppercase tracking-widest text-pitch-300 hover:text-[#EBF0FF] transition-colors">
                  Logout
                </button>
              </form>
            </>
          ) : (
            <Link
              href="/login"
              className="text-xs uppercase tracking-widest text-pitch-300 hover:text-[#EBF0FF] transition-colors"
            >
              Login
            </Link>
          )}
        </nav>
      </div>
    </header>
  )
}
