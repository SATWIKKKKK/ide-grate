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

function LoginContent() {
  const [isLoading, setIsLoading] = useState<string | null>(null)
  const [devEmail, setDevEmail] = useState('')
  const [devPassword, setDevPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loginError, setLoginError] = useState('')
  const searchParams = useSearchParams()
  const error = searchParams.get('error')
  const callbackUrl = searchParams.get('callbackUrl') || '/'

  const handleSignIn = async (providerId: string) => {
    setIsLoading(providerId)
    await signIn(providerId, { callbackUrl })
  }

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!devEmail || !devPassword) return
    setLoginError('')
    setIsLoading('credentials')

    const result = await signIn('credentials', {
      email: devEmail,
      password: devPassword,
      redirect: false,
    })

    if (result?.error) {
      setIsLoading(null)
      setLoginError('Invalid email or password')
      return
    }

    window.location.href = callbackUrl === '/' ? '/' : callbackUrl
  }

  const oauthButtons = [
    { id: 'github', name: 'GitHub', Icon: Github },
    { id: 'google', name: 'Google', Icon: GoogleIcon },
  ]

  return (
    <AuthShell mode="login" title="Welcome back" subtitle="Sign in to continue tracking your coding activity.">
      <div className="p-6">
        {(error || loginError) && (
          <div className="mb-4 rounded-md border border-destructive/30 bg-[var(--color-danger-soft)] p-3 text-center text-sm text-destructive">
            {error === 'OAuthAccountNotLinked'
              ? 'Linking your account. Please try signing in again.'
              : loginError || 'An error occurred during sign in. Please try again.'}
          </div>
        )}

        <div className="space-y-3">
          {oauthButtons.map(({ id, name, Icon }) => (
            <Button
              key={id}
              variant="outline"
              onClick={() => handleSignIn(id)}
              disabled={isLoading !== null}
              className="h-12 w-full justify-center gap-3 bg-background"
              title={`Sign in with ${name}`}
            >
              {isLoading === id ? (
                <span className="size-5 rounded-full border-2 border-current/30 border-t-current animate-spin" />
              ) : (
                <>
                  <Icon className="size-5" />
                  Continue with {name}
                </>
              )}
            </Button>
          ))}
        </div>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="bg-card px-3 font-mono text-muted-foreground">email access</span>
          </div>
        </div>

        <form onSubmit={handleEmailLogin} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-muted-foreground">Email</Label>
            <Input id="email" type="email" value={devEmail} onChange={(e) => setDevEmail(e.target.value)} placeholder="you@example.com" required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-muted-foreground">Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={devPassword}
                onChange={(e) => setDevPassword(e.target.value)}
                placeholder="Password"
                required
                className="pr-11"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md text-muted-foreground hover:text-foreground"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
          </div>

          <Button type="submit" disabled={isLoading !== null || !devEmail || !devPassword} className="h-12 w-full">
            {isLoading === 'credentials' ? (
              <span className="size-5 rounded-full border-2 border-background/30 border-t-background animate-spin" />
            ) : (
              <>
                Sign in
                <ArrowRight className="size-4" />
              </>
            )}
          </Button>
        </form>
      </div>

      <div className="border-t border-border px-6 py-4 text-center text-sm text-muted-foreground">
        Don&apos;t have an account?{' '}
        <Link href="/signup" className="font-semibold text-primary hover:text-foreground">
          Sign up
        </Link>
      </div>
    </AuthShell>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="page-shell flex min-h-screen items-center justify-center"><div className="size-8 rounded-full border-4 border-primary/30 border-t-primary animate-spin" /></div>}>
      <LoginContent />
    </Suspense>
  )
}

