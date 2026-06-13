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

const APP_URL = 'https://fifa2026bracket.com'
const TITLE = 'FIFA2026 World Cup Bracket Brawl'
const DESCRIPTION =
  'Predict the FIFA World Cup 2026 knockout bracket, compete in private leagues, and see how your picks stack up against friends.'

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: {
    default: TITLE,
    template: `%s | FIFA2026 World Cup Bracket Brawl`,
  },
  description: DESCRIPTION,
  keywords: [
    'FIFA 2026',
    'World Cup 2026',
    'bracket predictor',
    'tournament bracket',
    'football predictions',
    'soccer predictions',
    'World Cup bracket',
    'Bracket Brawl',
  ],
  authors: [{ name: 'FIFA2026 World Cup Bracket Brawl' }],
  creator: 'FIFA2026 World Cup Bracket Brawl',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: APP_URL,
    siteName: TITLE,
    title: TITLE,
    description: DESCRIPTION,
    images: [
      {
        url: '/bg.png',
        width: 1200,
        height: 630,
        alt: 'FIFA 2026 Bracket Predictor',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: TITLE,
    description: DESCRIPTION,
    images: ['/bg.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
    },
  },
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession()
  const isLoggedIn = !!session.playerId

  return (
    <html lang="en" className={`${bebas.variable} ${outfit.variable}`}>
      <body className="min-h-screen bg-pitch-950 text-pitch-200 antialiased overflow-x-hidden">
        <Header isLoggedIn={isLoggedIn} />
        {children}
      </body>
    </html>
  )
}
