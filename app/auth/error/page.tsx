'use client'

import { Suspense } from 'react'
import { motion } from 'framer-motion'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { AlertTriangle } from 'lucide-react'

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
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-blue-950 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="bg-gray-900/80 backdrop-blur-xl border border-red-900/40 rounded-2xl p-8 shadow-2xl text-center">
          <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-red-900/30 flex items-center justify-center">
            <AlertTriangle className="w-8 h-8 text-red-400" />
          </div>

          <h1 className="text-xl font-semibold text-white mb-2">
            Authentication Error
          </h1>
          
          <p className="text-gray-400 mb-4">
            {message}
          </p>

          {error && (
            <p className="text-xs text-gray-500 mb-8 font-mono">
              Error code: {error}
            </p>
          )}

          <Link
            href="/auth/signin"
            className="inline-block px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white font-semibold rounded-xl transition-all duration-300"
          >
            Try Again
          </Link>

          <Link
            href="/"
            className="block mt-4 text-gray-500 hover:text-blue-400 transition-colors"
          >
            ← Back to home
          </Link>
        </div>
      </motion.div>
    </div>
  )
}

export default function AuthError() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-blue-950 flex items-center justify-center p-4">
        <div className="text-white">Loading...</div>
      </div>
    }>
      <AuthErrorContent />
    </Suspense>
  )
}
