import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CheckCircle2, Eye, EyeOff, XCircle } from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'

type PageState = 'checking' | 'ready' | 'invalid' | 'submitting' | 'success'

const MIN_PASSWORD_LENGTH = 8

export default function SetPassword() {
  const navigate = useNavigate()
  const [pageState, setPageState] = useState<PageState>('checking')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // The Supabase client auto-parses the invite token out of the URL and
  // creates a session on page load. We just need to confirm that a session
  // actually landed — if not, the link was invalid, expired, or already used.
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setPageState(session ? 'ready' : 'invalid')
    })
  }, [])

  function validate(): string | null {
    if (password.length < MIN_PASSWORD_LENGTH) {
      return `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`
    }
    if (password !== confirmPassword) {
      return "Passwords don't match."
    }
    return null
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const validationError = validate()
    if (validationError) {
      setError(validationError)
      return
    }

    setError(null)
    setPageState('submitting')

    const { error: updateError } = await supabase.auth.updateUser({ password })

    if (updateError) {
      setError(updateError.message)
      setPageState('ready')
      return
    }

    // Flip this staff member from "invited" to "active" now that they've
    // actually completed setup. Not fatal if it fails — worst case their
    // row still shows "Pending" in Staff Management even though they can
    // now log in fine; an admin can flip it manually if needed.
    await supabase.rpc('mark_staff_active')

    setPageState('success')
    setTimeout(() => navigate('/patients'), 1800)
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-6">
          <h1 className="font-display font-semibold text-xl text-slate-text">Toothcom</h1>
          <p className="text-slate-muted text-xs tracking-wide">DENTAL CLINICS</p>
        </div>

        <div className="bg-white rounded-xl border border-[var(--color-border-soft)] p-6">
          {pageState === 'checking' && (
            <p className="text-center text-slate-muted text-sm py-6">Checking your invite…</p>
          )}

          {pageState === 'invalid' && (
            <div className="text-center py-4">
              <XCircle className="mx-auto mb-3 text-red-500" size={32} />
              <h2 className="font-display font-semibold text-lg text-slate-text mb-1">
                This link isn't valid
              </h2>
              <p className="text-slate-muted text-sm">
                It may have expired or already been used. Ask an admin to send you a new invite.
              </p>
            </div>
          )}

          {pageState === 'success' && (
            <div className="text-center py-4">
              <CheckCircle2 className="mx-auto mb-3 text-emerald-500" size={32} />
              <h2 className="font-display font-semibold text-lg text-slate-text mb-1">
                Password set
              </h2>
              <p className="text-slate-muted text-sm">Taking you to the staff portal…</p>
            </div>
          )}

          {(pageState === 'ready' || pageState === 'submitting') && (
            <form onSubmit={handleSubmit}>
              <h2 className="font-display font-semibold text-lg text-slate-text mb-1">
                Set your password
              </h2>
              <p className="text-slate-muted text-sm mb-5">
                Choose a password to finish creating your account.
              </p>

              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      autoFocus
                      className="w-full rounded-lg border border-[var(--color-border-soft)] px-3 py-2 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-clinic-orange)]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-muted hover:text-slate-text"
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  <p className="text-xs text-slate-muted mt-1">
                    At least {MIN_PASSWORD_LENGTH} characters.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Confirm password</label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full rounded-lg border border-[var(--color-border-soft)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-clinic-orange)]"
                  />
                </div>

                {error && <p className="text-sm text-red-600">{error}</p>}
              </div>

              <button
                type="submit"
                disabled={pageState === 'submitting'}
                className="w-full mt-5 px-4 py-2.5 rounded-lg text-sm font-medium bg-[var(--color-clinic-orange)] hover:bg-[var(--color-clinic-orange-dark)] text-white disabled:opacity-60 transition-colors"
              >
                {pageState === 'submitting' ? 'Setting password…' : 'Set password & continue'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}