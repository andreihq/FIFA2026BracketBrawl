import Link from 'next/link'

export default function LandingPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 p-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold">FIFA 2026</h1>
        <p className="mt-2 text-slate-400">World Cup Bracket Predictor</p>
      </div>
      <div className="flex flex-col gap-3 w-full max-w-xs">
        <Link
          href="/register"
          className="w-full rounded-lg bg-blue-600 px-6 py-3 text-center font-semibold hover:bg-blue-500 transition-colors"
        >
          Register
        </Link>
        <Link
          href="/login"
          className="w-full rounded-lg bg-slate-700 px-6 py-3 text-center font-semibold hover:bg-slate-600 transition-colors"
        >
          Login
        </Link>
      </div>
    </main>
  )
}
