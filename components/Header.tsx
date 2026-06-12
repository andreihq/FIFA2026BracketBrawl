'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'

const NAV = [
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'My Bracket', href: '/bracket' },
]

const HIDE_ON = ['/', '/login', '/register']

export function Header({ isLoggedIn }: { isLoggedIn: boolean }) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  if (HIDE_ON.includes(pathname)) return null

  return (
    <header className="sticky top-0 z-50 border-b border-pitch-600 bg-pitch-950/90 backdrop-blur-md">
      <div className="max-w-6xl mx-auto w-full flex items-center justify-between px-5 py-3">
        <Link href={isLoggedIn ? '/dashboard' : '/'} className="flex items-center gap-3 group" onClick={() => setOpen(false)}>
          <img src="/trophy.png" alt="FIFA World Cup trophy" className="w-9 h-9 object-contain flex-shrink-0" />
          <div>
            <p className="font-display text-base leading-none tracking-widest text-[#EBF0FF]">FIFA 2026</p>
            <p className="text-[10px] leading-none mt-0.5 tracking-widest uppercase text-pitch-300">World Cup Predictor</p>
          </div>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden sm:flex items-center gap-5">
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
            <Link href="/login" className="text-xs uppercase tracking-widest text-pitch-300 hover:text-[#EBF0FF] transition-colors">
              Login
            </Link>
          )}
        </nav>

        {/* Mobile hamburger */}
        <div className="sm:hidden relative">
          <button
            className="flex flex-col justify-center items-center gap-1.5 w-8 h-8"
            onClick={() => setOpen(o => !o)}
            aria-label="Toggle menu"
          >
            <span className={`block h-0.5 w-5 bg-pitch-300 transition-all duration-200 ${open ? 'translate-y-2 rotate-45' : ''}`} />
            <span className={`block h-0.5 w-5 bg-pitch-300 transition-all duration-200 ${open ? 'opacity-0' : ''}`} />
            <span className={`block h-0.5 w-5 bg-pitch-300 transition-all duration-200 ${open ? '-translate-y-2 -rotate-45' : ''}`} />
          </button>

          {open && (
            <div className="absolute right-0 top-full mt-3 min-w-[160px] rounded-xl border border-pitch-600 bg-pitch-950/95 backdrop-blur-md py-3 flex flex-col items-end">
              {isLoggedIn ? (
                <>
                  {NAV.map(({ label, href }) => {
                    const active = pathname === href || pathname.startsWith(href + '/')
                    return (
                      <Link
                        key={href}
                        href={href}
                        onClick={() => setOpen(false)}
                        className={`w-full text-right px-5 py-2.5 text-xs uppercase tracking-widest transition-colors ${active ? 'text-[#EBF0FF]' : 'text-pitch-300'}`}
                      >
                        {label}
                      </Link>
                    )
                  })}
                  <form action="/api/auth/logout" method="POST" className="w-full">
                    <button className="w-full text-right px-5 py-2.5 text-xs uppercase tracking-widest text-pitch-300">
                      Logout
                    </button>
                  </form>
                </>
              ) : (
                <Link
                  href="/login"
                  onClick={() => setOpen(false)}
                  className="w-full text-right px-5 py-2.5 text-xs uppercase tracking-widest text-pitch-300"
                >
                  Login
                </Link>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
