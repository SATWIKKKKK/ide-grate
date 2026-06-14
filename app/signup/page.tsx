'use client'

import { Suspense, useState } from 'react'
import { signIn } from 'next-auth/react'
import { Github, ArrowRight, Eye, EyeOff } from 'lucide-react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { AuthShell, GoogleIcon } from '@/components/auth/AuthShell'

function SignUpContent() {
  const [isLoading, setIsLoading] = useState<string | null>(null)
  const [devEmail, setDevEmail] = useState('')
  const [devName, setDevName] = useState('')
  const [devPassword, setDevPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [passwordError, setPasswordError] = useState('')
  const [confirmError, setConfirmError] = useState('')
  const searchParams = useSearchParams()
  const error = searchParams.get('error')

  const handleSignIn = async (providerId: string) => {
    setIsLoading(providerId)
    await signIn(providerId, { callbackUrl: '/' })
  }

  const validatePassword = (pwd: string) => {
    if (pwd.length < 8) {
      setPasswordError('Password must be at least 8 characters')
      return false
    }
    setPasswordError('')
    return true
  }

  const validateConfirmPassword = (pwd: string, confirm: string) => {
    if (pwd !== confirm) {
      setConfirmError('Passwords do not match')
      return false
    }
    setConfirmError('')
    return true
  }

  const handleDevSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!devEmail || !devName) return
    if (!validatePassword(devPassword)) return
    if (!validateConfirmPassword(devPassword, confirmPassword)) return
    setIsLoading('credentials')

    const result = await signIn('credentials', {
      email: devEmail,
      password: devPassword,
      name: devName,
      isSignUp: 'true',
      redirect: false,
    })

    if (result?.error) {
      setIsLoading(null)
      setPasswordError(result.error.includes('exists') ? 'An account with this email already exists. Please sign in.' : 'Failed to create account. Please try again.')
      return
    }

    window.location.href = '/'
  }

  const isFormValid = devEmail && devName && devPassword.length >= 8 && confirmPassword === devPassword

  return (
    <AuthShell mode="signup" title="Create account" subtitle="Start tracking editor time, streaks, goals, and language stats.">
      <div className="p-3 sm:p-4">
        {error && (
          <div className="mb-3 rounded-md border border-destructive/30 bg-[var(--color-danger-soft)] p-2 text-center text-xs text-destructive">
            {error === 'OAuthAccountNotLinked'
              ? 'This email is already registered with a different provider.'
              : 'An error occurred during sign up. Please try again.'}
          </div>
        )}

        <form onSubmit={handleDevSignUp} className="space-y-3">
          <div className="space-y-2.5">
            <Label htmlFor="name" className="block font-sans text-sm font-medium normal-case leading-normal tracking-normal text-muted-foreground">Full name</Label>
            <Input id="name" type="text" value={devName} onChange={(e) => setDevName(e.target.value)} placeholder="Ada Lovelace" required className="h-10 font-sans text-sm" />
          </div>

          <div className="space-y-2.5">
            <Label htmlFor="email" className="block font-sans text-sm font-medium normal-case leading-normal tracking-normal text-muted-foreground">Email</Label>
            <Input
              id="email"
              type="email"
              value={devEmail}
              onChange={(e) => {
                setDevEmail(e.target.value)
                if (!devName && e.target.value.includes('@')) {
                  setDevName(e.target.value.split('@')[0].replace(/[^a-zA-Z0-9 ]/g, ' ').replace(/\b\w/g, c => c.toUpperCase()))
                }
              }}
              placeholder="you@example.com"
              required
              className="h-10 font-sans text-sm"
            />
          </div>

          <PasswordField
            id="password"
            label="Password"
            value={devPassword}
            show={showPassword}
            setShow={setShowPassword}
            error={passwordError}
            placeholder="Min. 8 characters"
            onChange={(value) => {
              setDevPassword(value)
              if (passwordError) validatePassword(value)
              if (confirmError && confirmPassword) validateConfirmPassword(value, confirmPassword)
            }}
          />

          <PasswordField
            id="confirmPassword"
            label="Confirm password"
            value={confirmPassword}
            show={showConfirmPassword}
            setShow={setShowConfirmPassword}
            error={confirmError}
            placeholder="Re-enter your password"
            onChange={(value) => {
              setConfirmPassword(value)
              if (confirmError) validateConfirmPassword(devPassword, value)
            }}
          />

          <Button type="submit" disabled={isLoading !== null || !isFormValid} className="h-10 w-full font-sans text-sm">
            {isLoading === 'credentials' ? (
              <span className="size-5 rounded-full border-2 border-background/30 border-t-background animate-spin" />
            ) : (
              <>
                Create account
                <ArrowRight className="size-4" />
              </>
            )}
          </Button>
        </form>

        <div className="relative my-2.5">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="bg-card px-3 font-sans text-sm text-muted-foreground">or continue with</span>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-2 min-[360px]:grid-cols-2">
          {[
            { id: 'github', name: 'GitHub', Icon: Github },
            { id: 'google', name: 'Google', Icon: GoogleIcon },
          ].map(({ id, name, Icon }) => (
            <Button
              key={id}
              variant="outline"
              onClick={() => handleSignIn(id)}
              disabled={isLoading !== null}
              className="h-10 w-full justify-center bg-background"
              title={`Sign up with ${name}`}
              aria-label={`Sign up with ${name}`}
            >
              {isLoading === id ? (
                <span className="size-5 rounded-full border-2 border-current/30 border-t-current animate-spin" />
              ) : (
                <Icon className="size-5" />
              )}
            </Button>
          ))}
        </div>
      </div>

      <div className="border-t border-border px-5 py-3 text-center font-sans text-sm text-muted-foreground">
        Already have an account?{' '}
        <Link href="/login" className="font-semibold text-primary hover:text-foreground">
          Sign in
        </Link>
      </div>
    </AuthShell>
  )
}

function PasswordField({
  id,
  label,
  value,
  show,
  setShow,
  onChange,
  error,
  placeholder,
}: {
  id: string
  label: string
  value: string
  show: boolean
  setShow: (value: boolean) => void
  onChange: (value: string) => void
  error?: string
  placeholder: string
}) {
  return (
    <div className="space-y-2.5">
      <Label htmlFor={id} className="block font-sans text-sm font-medium normal-case leading-normal tracking-normal text-muted-foreground">{label}</Label>
      <div className="relative">
        <Input
          id={id}
          type={show ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          required
          minLength={8}
          className="h-10 pr-11 font-sans text-sm"
          aria-invalid={Boolean(error)}
        />
        <button
          type="button"
          onClick={() => setShow(!show)}
          className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md text-muted-foreground hover:text-foreground"
          aria-label={show ? 'Hide password' : 'Show password'}
        >
          {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
        </button>
      </div>
      {error && <p className="text-[11px] text-destructive">{error}</p>}
    </div>
  )
}

export default function SignUpPage() {
  return (
    <Suspense fallback={<div className="page-shell flex min-h-screen items-center justify-center"><div className="size-8 rounded-full border-4 border-primary/30 border-t-primary animate-spin" /></div>}>
      <SignUpContent />
    </Suspense>
  )
}
