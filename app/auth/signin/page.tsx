'use client'

import { Suspense } from 'react'
import { signIn, getProviders } from 'next-auth/react'
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Github, Zap, Code2 } from 'lucide-react'
import { useSearchParams } from 'next/navigation'

function SignInContent() {
  const [providers, setProviders] = useState<any>(null)
  const [isLoading, setIsLoading] = useState<string | null>(null)
  const searchParams = useSearchParams()
  const error = searchParams.get('error')
  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard'

  useEffect(() => {
    getProviders().then(setProviders)
  }, [])

  const handleSignIn = async (providerId: string) => {
    setIsLoading(providerId)
    await signIn(providerId, { callbackUrl })
  }

  const providerIcons: Record<string, any> = {
    github: Github,
    'azure-ad': Zap,
  }

  const providerLabels: Record<string, string> = {
    github: 'GitHub',
    'azure-ad': 'Microsoft',
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-blue-950 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="bg-gray-900/80 backdrop-blur-xl border border-blue-900/40 rounded-2xl p-8 shadow-2xl">
          {/* Logo */}
          <div className="flex items-center justify-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center">
              <Code2 className="w-7 h-7 text-white" />
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-white to-blue-400 bg-clip-text text-transparent">
              vs-integrate
            </span>
          </div>

          <h1 className="text-xl font-semibold text-center text-white mb-2">
            Welcome Back
          </h1>
          <p className="text-gray-400 text-center mb-8">
            Sign in to track your real coding activity
          </p>

          {error && (
            <div className="mb-6 p-4 bg-red-900/30 border border-red-500/50 rounded-lg text-red-400 text-sm text-center">
              {error === 'OAuthAccountNotLinked' 
                ? 'This email is already registered with a different provider.'
                : 'An error occurred during sign in. Please try again.'}
            </div>
          )}

          <div className="space-y-4">
            {providers &&
              Object.values(providers).map((provider: any) => {
                const Icon = providerIcons[provider.id] || Code2
                const label = providerLabels[provider.id] || provider.name
                
                return (
                  <motion.button
                    key={provider.name}
                    whileHover={{ scale: 1.02, boxShadow: '0 0 30px rgba(59, 130, 246, 0.3)' }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleSignIn(provider.id)}
                    disabled={isLoading !== null}
                    className="w-full px-6 py-4 bg-gradient-to-r from-gray-800 to-gray-900 hover:from-blue-900/50 hover:to-gray-800 border border-gray-700 hover:border-blue-500/50 rounded-xl font-semibold flex items-center justify-center gap-3 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed text-white"
                  >
                    {isLoading === provider.id ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <Icon className="w-5 h-5" />
                    )}
                    Continue with {label}
                  </motion.button>
                )
              })}
          </div>

          <p className="mt-8 text-center text-xs text-gray-500">
            By signing in, you agree to our Terms of Service and Privacy Policy.
            <br />
            No code access. No file names. Just your real activity.
          </p>
        </div>

        <motion.a
          href="/"
          whileHover={{ scale: 1.02 }}
          className="block text-center mt-6 text-gray-500 hover:text-blue-400 transition-colors"
        >
          ← Back to home
        </motion.a>
      </motion.div>
    </div>
  )
}

export default function SignIn() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-blue-950 flex items-center justify-center p-4">
        <div className="text-white">Loading...</div>
      </div>
    }>
      <SignInContent />
    </Suspense>
  )
}
