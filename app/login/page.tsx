'use client'

import { Suspense } from 'react'
import { signIn } from 'next-auth/react'
import { useState } from 'react'
import { Github, ArrowRight, Eye, EyeOff } from 'lucide-react'
import Logo from '@/components/Logo'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'

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

  // Always show GitHub + Google buttons
  const oauthButtons = [
    { id: 'github', name: 'GitHub', Icon: Github, bg: 'bg-gray-800 hover:bg-white border-gray-700 hover:border-white', text: 'text-white hover:text-black' },
    { id: 'google', name: 'Google', Icon: GoogleIcon, bg: 'bg-white hover:bg-white border-gray-300 hover:border-white', text: 'text-white hover:text-black' },
  ]

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <Link href="/" className="flex items-center justify-center mb-8">
          <Logo size="xl" />
        </Link>

        <Card className="bg-gray-900 border-gray-800">
          <CardHeader className="text-center">
            <CardTitle className="text-xl text-white">Welcome Back</CardTitle>
            <CardDescription className="text-gray-400">
              Sign in to continue tracking your coding activity
            </CardDescription>
            
          </CardHeader>

          <CardContent>
            {(error || loginError) && (
              <div className="mb-4 p-3 bg-red-900/30 border border-red-600/30 rounded-lg text-red-400 text-sm text-center">
                {error === 'OAuthAccountNotLinked'
                  ? 'Linking your account — please try signing in again.'
                  : loginError || 'An error occurred during sign in. Please try again.'}
              </div>
            )}

            {/* OAuth Buttons — always visible */}
            <div className="space-y-3">
              {oauthButtons.map(({ id, name, Icon, bg, text }) => (
                <Button
                  key={id}
                  variant="outline"
                  onClick={() => handleSignIn(id)}
                  disabled={isLoading !== null}
                  className={`w-full h-12 ${bg} ${text} font-medium flex items-center justify-center gap-3 text-sm`}
                  title={`Sign in with ${name}`}
                >
                  {isLoading === id ? (
                    <div className="w-5 h-5 border-2 border-current/30 border-t-current rounded-full animate-spin" />
                  ) : (
                    <>
                      <Icon className="w-5 h-5" />
                      Continue with {name}
                    </>
                  )}
                </Button>
              ))}
            </div>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-700" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-gray-900 text-gray-500">or sign in with email</span>
              </div>
            </div>

            <form onSubmit={handleEmailLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-gray-300">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={devEmail}
                  onChange={(e) => setDevEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500 focus:border-blue-500 focus:ring-blue-500/30"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-gray-300">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={devPassword}
                    onChange={(e) => setDevPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500 focus:border-blue-500 focus:ring-blue-500/30 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                disabled={isLoading !== null || !devEmail || !devPassword}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-medium"
              >
                {isLoading === 'credentials' ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    Sign In
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            </form>
          </CardContent>

          <CardFooter className="justify-center">
            <p className="text-gray-500 text-sm">
              Don&apos;t have an account?{' '}
              <Link href="/signup" className="text-blue-400 hover:text-blue-300 font-medium transition-colors">
                Sign up
              </Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
      </div>
    }>
      <LoginContent />
    </Suspense>
  )
}
