'use client'

import { Suspense } from 'react'
import { signIn, getProviders } from 'next-auth/react'
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Github, Zap, Code2, User, Mail, ArrowRight, Eye, EyeOff, Check } from 'lucide-react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'

/* Simple inline Google "G" icon */
function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  )
}

function SignUpContent() {
  const [providers, setProviders] = useState<any>(null)
  const [isLoading, setIsLoading] = useState<string | null>(null)
  const [devEmail, setDevEmail] = useState('')
  const [devName, setDevName] = useState('')
  const [devPassword, setDevPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [acceptTerms, setAcceptTerms] = useState(false)
  const searchParams = useSearchParams()
  const router = useRouter()
  const error = searchParams.get('error')
  const callbackUrl = searchParams.get('callbackUrl') || '/onboarding'

  useEffect(() => {
    getProviders().then(setProviders)
  }, [])

  const handleSignIn = async (providerId: string) => {
    setIsLoading(providerId)
    await signIn(providerId, { callbackUrl })
  }

  const handleDevSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!devEmail || !devName || !acceptTerms) return
    setIsLoading('dev-login')
    await signIn('dev-login', {
      email: devEmail,
      name: devName,
      callbackUrl,
    })
  }

  const providerMeta: Record<string, { icon: any; label: string; gradient: string }> = {
    github: {
      icon: Github,
      label: 'GitHub',
      gradient: 'from-gray-800 to-gray-900 hover:from-gray-700 hover:to-gray-800 border-gray-700 hover:border-gray-500',
    },
    google: {
      icon: GoogleIcon,
      label: 'Google',
      gradient: 'from-white/10 to-white/5 hover:from-white/15 hover:to-white/10 border-gray-700 hover:border-blue-400',
    },
    'azure-ad': {
      icon: Zap,
      label: 'Microsoft',
      gradient: 'from-blue-900/40 to-blue-950/60 hover:from-blue-800/50 hover:to-blue-900/60 border-blue-800/50 hover:border-blue-500/60',
    },
  }

  const oauthProviders = providers
    ? Object.values(providers).filter((p: any) => p.id !== 'dev-login')
    : []
  const hasDevLogin = providers
    ? Object.values(providers).some((p: any) => p.id === 'dev-login')
    : false

  const features = [
    'Track your real coding activity',
    'Beautiful contribution graphs',
    'Privacy-focused - no code content stored',
    'Free forever for personal use',
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-blue-950 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="bg-gray-900/80 backdrop-blur-xl border border-blue-900/40 rounded-2xl p-8 shadow-2xl">
          {/* Logo */}
          <Link href="/" className="flex items-center justify-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center">
              <Code2 className="w-7 h-7 text-white" />
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-white to-blue-400 bg-clip-text text-transparent">
              vs-integrate
            </span>
          </Link>

          <h1 className="text-2xl font-semibold text-center text-white mb-2">
            Create Your Account
          </h1>
          <p className="text-gray-400 text-center mb-6">
            Start tracking your coding activity today
          </p>

          {/* Features */}
          <div className="mb-6 p-4 bg-blue-900/20 border border-blue-800/30 rounded-xl">
            <ul className="space-y-2">
              {features.map((feature, i) => (
                <li key={i} className="flex items-center gap-2 text-sm text-gray-300">
                  <Check className="w-4 h-4 text-green-400 flex-shrink-0" />
                  {feature}
                </li>
              ))}
            </ul>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-900/30 border border-red-500/50 rounded-lg text-red-400 text-sm text-center">
              {error === 'OAuthAccountNotLinked'
                ? 'This email is already registered with a different provider.'
                : 'An error occurred during sign up. Please try again.'}
            </div>
          )}

          <div className="space-y-3">
            {/* OAuth Providers */}
            {oauthProviders.map((provider: any) => {
              const meta = providerMeta[provider.id] || {
                icon: Code2,
                label: provider.name,
                gradient: 'from-gray-800 to-gray-900 border-gray-700',
              }
              const Icon = meta.icon

              return (
                <motion.button
                  key={provider.id}
                  whileHover={{ scale: 1.02, boxShadow: '0 0 30px rgba(59, 130, 246, 0.25)' }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleSignIn(provider.id)}
                  disabled={isLoading !== null}
                  className={`w-full px-6 py-4 bg-gradient-to-r ${meta.gradient} border rounded-xl font-semibold flex items-center justify-center gap-3 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed text-white`}
                >
                  {isLoading === provider.id ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Icon className="w-5 h-5" />
                  )}
                  Sign up with {meta.label}
                </motion.button>
              )
            })}

            {/* Development Sign Up Form */}
            {hasDevLogin && (
              <>
                {oauthProviders.length > 0 && (
                  <div className="relative my-6">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-700"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="px-4 bg-gray-900/80 text-gray-400">or sign up with email</span>
                    </div>
                  </div>
                )}

                <form onSubmit={handleDevSignUp} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm text-gray-400">Full Name</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                      <input
                        type="text"
                        value={devName}
                        onChange={(e) => setDevName(e.target.value)}
                        placeholder="John Doe"
                        required
                        className="w-full pl-11 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder:text-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm text-gray-400">Email</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                      <input
                        type="email"
                        value={devEmail}
                        onChange={(e) => setDevEmail(e.target.value)}
                        placeholder="you@example.com"
                        required
                        className="w-full pl-11 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder:text-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm text-gray-400">Password</label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={devPassword}
                        onChange={(e) => setDevPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full pl-4 pr-11 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder:text-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <button
                      type="button"
                      onClick={() => setAcceptTerms(!acceptTerms)}
                      className={`w-5 h-5 mt-0.5 rounded border flex items-center justify-center transition-colors flex-shrink-0 ${
                        acceptTerms 
                          ? 'bg-blue-600 border-blue-600' 
                          : 'border-gray-600 hover:border-gray-500'
                      }`}
                    >
                      {acceptTerms && <Check className="w-3 h-3 text-white" />}
                    </button>
                    <span className="text-sm text-gray-400">
                      I agree to the{' '}
                      <a href="#" className="text-blue-400 hover:text-blue-300">Terms of Service</a>
                      {' '}and{' '}
                      <a href="#" className="text-blue-400 hover:text-blue-300">Privacy Policy</a>
                    </span>
                  </div>

                  <motion.button
                    type="submit"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    disabled={isLoading !== null || !devEmail || !devName || !acceptTerms}
                    className="w-full px-6 py-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 rounded-xl font-semibold flex items-center justify-center gap-3 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed text-white"
                  >
                    {isLoading === 'dev-login' ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        Create Account
                        <ArrowRight className="w-5 h-5" />
                      </>
                    )}
                  </motion.button>
                </form>
              </>
            )}
          </div>

          <p className="text-center text-gray-400 mt-8">
            Already have an account?{' '}
            <Link href="/login" className="text-blue-400 hover:text-blue-300 font-medium transition-colors">
              Sign in
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  )
}

export default function SignUpPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-blue-950 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
      </div>
    }>
      <SignUpContent />
    </Suspense>
  )
}
