'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Logo from '@/components/Logo'
import { AlertTriangle, ArrowLeft, RotateCcw } from 'lucide-react'

function AuthErrorContent() {
  const searchParams = useSearchParams()
  const error = searchParams.get('error')

  const errorMessages: Record<string, string> = {
    Configuration: 'There is a problem with the server configuration. Check environment variables.',
    AccessDenied: 'You do not have permission to sign in.',
    Verification: 'The sign in link is no longer valid. It may have been used already or expired.',
    OAuthSignin: 'Error starting OAuth sign in. Check provider configuration.',
    OAuthCallback: 'Error in the OAuth callback. Provider may have rejected the request.',
    OAuthCreateAccount: 'Could not create your account. Database may be unavailable.',
    EmailCreateAccount: 'Could not create an email account. Please try again.',
    Callback: 'Error in the callback handler. Database connection may have failed.',
    OAuthAccountNotLinked: 'This email is already associated with another account. Sign in with the original provider.',
    EmailSignin: 'Error sending the verification email. Please try again.',
    CredentialsSignin: 'Sign in failed. Check your credentials and try again.',
    SessionRequired: 'Please sign in to access this page.',
    Default: 'An unexpected error occurred. Please try again.',
  }

  const message = error ? errorMessages[error] || errorMessages.Default : errorMessages.Default

  return (
    <div className="page-shell flex min-h-screen items-center justify-center p-4">
      <section className="w-full max-w-md overflow-hidden rounded-lg border border-border bg-card shadow-xl" data-gsap="fade-up">
        <div className="border-b border-border p-6 text-center">
          <div className="mb-6 flex justify-center">
            <Logo size="md" />
          </div>
          <div className="mx-auto mb-5 flex size-14 items-center justify-center rounded-md bg-[var(--color-danger-soft)] text-destructive">
            <AlertTriangle className="size-7" />
          </div>
          <h1 className="font-display text-3xl">Authentication error</h1>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{message}</p>
          {error && <p className="mt-4 font-mono text-xs text-muted-foreground">Error code: {error}</p>}
        </div>
        <div className="grid gap-3 p-6">
          <Link href="/login" className="signal-button">
            <RotateCcw className="size-4" />
            Try again
          </Link>
          <Link href="/" className="signal-button signal-button-secondary">
            <ArrowLeft className="size-4" />
            Back home
          </Link>
        </div>
      </section>
    </div>
  )
}

export default function AuthError() {
  return (
    <Suspense fallback={<div className="page-shell flex min-h-screen items-center justify-center"><div className="size-8 rounded-full border-4 border-primary/30 border-t-primary animate-spin" /></div>}>
      <AuthErrorContent />
    </Suspense>
  )
}

