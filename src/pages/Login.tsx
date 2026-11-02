import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'

export default function Login() {
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [showPassword, setShowPassword] = useState(false);
  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    const { error } = await signIn(email, password)
    setSubmitting(false)
    if (error) {
      setError(error)
    } else {
      navigate('/patients')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-ink)] px-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <img
    src="/Screenshot 2026-08-31 055944.png"
    alt="Toothcom logo"
    className="h-10 w-auto object-contain"
  />
             <p className="text-white/50 text-sm mt-1">Staff &amp; admin portal</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-2xl shadow-xl p-6 space-y-4"
        >
          <div>
            <label className="block text-sm font-medium text-slate-text mb-1">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-[var(--color-border-soft)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-clinic-orange)]"
              placeholder="you@toothcom.clinic"
            />
          </div>
         <div>
  <label className="block text-sm font-medium text-slate-text mb-1">
    Password
  </label>

  <div className="relative">
    <input
      type={showPassword ? "text" : "password"}
      required
      value={password}
      onChange={(e) => setPassword(e.target.value)}
      className="w-full rounded-lg border border-[var(--color-border-soft)] px-3 py-2 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-clinic-orange)]"
      placeholder="••••••••"
    />

    <button
      type="button"
      onClick={() => setShowPassword(!showPassword)}
      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
      aria-label={showPassword ? "Hide password" : "Show password"}
    >
      {showPassword ? (
        // Eye-off icon
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.8}
          stroke="currentColor"
          className="h-5 w-5"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3.98 8.223A10.477 10.477 0 0 0 2.25 12c1.5 4.5 5.75 7.5 9.75 7.5 1.61 0 3.14-.39 4.48-1.077M6.228 6.228A10.45 10.45 0 0 1 12 4.5c4 0 8.25 3 9.75 7.5a10.52 10.52 0 0 1-4.072 5.294M6.228 6.228 3 3m3.228 3.228 3.37 3.37m0 0a3 3 0 1 0 4.243 4.243M9.598 9.598 3.98 3.98m5.618 5.618 4.243 4.243m0 0 3.37 3.37"
          />
        </svg>
      ) : (
        // Eye icon
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.8}
          stroke="currentColor"
          className="h-5 w-5"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M2.25 12s3.75-7.5 9.75-7.5 9.75 7.5 9.75 7.5-3.75 7.5-9.75 7.5S2.25 12 2.25 12Z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
          />
        </svg>
      )}
    </button>
  </div>
</div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-lg bg-[var(--color-clinic-orange)] hover:bg-[var(--color-clinic-orange-dark)] text-white font-medium py-2.5 text-sm transition-colors disabled:opacity-60"
          >
            {submitting ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <p className="text-center text-white/40 text-xs mt-6">
          Staff accounts are created by an admin. Contact your clinic admin for access.
        </p>
      </div>
    </div>
  )
}
