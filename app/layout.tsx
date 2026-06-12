import type { Metadata } from 'next'
import { Bebas_Neue, Outfit } from 'next/font/google'
import './globals.css'
import { Header } from '@/components/Header'
import { getSession } from '@/lib/session'

const bebas = Bebas_Neue({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-bebas',
  display: 'swap',
})

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-outfit',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'FIFA 2026 Bracket Predictor',
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession()
  const isLoggedIn = !!session.playerId

  return (
    <html lang="en" className={`${bebas.variable} ${outfit.variable}`}>
      <body className="min-h-screen bg-pitch-950 text-pitch-200 antialiased">
        <Header isLoggedIn={isLoggedIn} />
        {children}
      </body>
    </html>
  )
}
