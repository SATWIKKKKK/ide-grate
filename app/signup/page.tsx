'use client'

import { Suspense } from 'react'
import { signIn } from 'next-auth/react'
import { useState } from 'react'
import { Github, ArrowRight, Eye, EyeOff } from 'lucide-react'
import Image from 'next/image'
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
  const callbackUrl = searchParams.get('callbackUrl') || '/'

  const handleSignIn = async (providerId: string) => {
    setIsLoading(providerId)
    await signIn(providerId, { callbackUrl })
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
    setIsLoading('dev-login')
    await signIn('dev-login', {
      email: devEmail,
      name: devName,
      callbackUrl,
    })
  }

  const isFormValid = devEmail && devName && devPassword.length >= 8 && confirmPassword === devPassword

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <Link href="/" className="flex items-center justify-center mb-8">
          <Image
            src="/logo.png"
            alt="vs-integrate"
            width={400}
            height={400}
            className="h-36 w-auto object-contain"
            priority
          />
        </Link>

        <Card className="bg-gray-900 border-gray-800">
          <CardHeader className="text-center">
            <CardTitle className="text-xl text-white">Create Your Account</CardTitle>
            <CardDescription className="text-gray-400">
              Track your VS Code time, streaks & language stats
            </CardDescription>
            <div className="flex items-center justify-center gap-3 mt-2 flex-wrap">
              {['⏱ Live Timer', '🔥 Streaks', '📊 Stats'].map(f => (
                <span key={f} className="text-[11px] bg-gray-800 text-gray-400 px-2 py-0.5 rounded-full border border-gray-700">{f}</span>
              ))}
            </div>
          </CardHeader>

          <CardContent>
            {error && (
              <div className="mb-4 p-3 bg-red-900/30 border border-red-600/30 rounded-lg text-red-400 text-sm text-center">
                {error === 'OAuthAccountNotLinked'
                  ? 'This email is already registered with a different provider.'
                  : 'An error occurred during sign up. Please try again.'}
              </div>
            )}

            <form onSubmit={handleDevSignUp} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-gray-300">Full Name</Label>
                <Input
                  id="name"
                  type="text"
                  value={devName}
                  onChange={(e) => setDevName(e.target.value)}
                  placeholder="John Doe"
                  required
                  className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500 focus:border-blue-500 focus:ring-blue-500/30"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-gray-300">Email</Label>
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
                    onChange={(e) => {
                      setDevPassword(e.target.value)
                      if (passwordError) validatePassword(e.target.value)
                      if (confirmError && confirmPassword) validateConfirmPassword(e.target.value, confirmPassword)
                    }}
                    placeholder="Min. 8 characters"
                    required
                    minLength={8}
                    className={`bg-gray-800 text-white placeholder:text-gray-500 focus:ring-blue-500/30 pr-10 ${
                      passwordError ? 'border-red-500 focus:border-red-500' : 'border-gray-700 focus:border-blue-500'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {passwordError && <p className="text-xs text-red-400">{passwordError}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-gray-300">Confirm Password</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value)
                      if (confirmError) validateConfirmPassword(devPassword, e.target.value)
                    }}
                    placeholder="Re-enter your password"
                    required
                    className={`bg-gray-800 text-white placeholder:text-gray-500 focus:ring-blue-500/30 pr-10 ${
                      confirmError ? 'border-red-500 focus:border-red-500' : 'border-gray-700 focus:border-blue-500'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {confirmError && <p className="text-xs text-red-400">{confirmError}</p>}
              </div>

              <Button
                type="submit"
                disabled={isLoading !== null || !isFormValid}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-medium"
              >
                {isLoading === 'dev-login' ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    Create Account
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            </form>

            {/* OAuth Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-700" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-gray-900 text-gray-500">or continue with</span>
              </div>
            </div>

            {/* OAuth Buttons — always visible */}
            <div className="space-y-3">
              {[
                { id: 'github', name: 'GitHub', Icon: Github, bg: 'bg-gray-800 hover:bg-gray-700 border-gray-700', text: 'text-white' },
                { id: 'google', name: 'Google', Icon: GoogleIcon, bg: 'bg-white hover:bg-gray-100 border-gray-300', text: 'text-gray-800' },
              ].map(({ id, name, Icon, bg, text }) => (
                <Button
                  key={id}
                  variant="outline"
                  onClick={() => handleSignIn(id)}
                  disabled={isLoading !== null}
                  className={`w-full h-12 ${bg} ${text} font-medium flex items-center justify-center gap-3 text-sm`}
                  title={`Sign up with ${name}`}
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
          </CardContent>

          <CardFooter className="justify-center">
            <p className="text-gray-500 text-sm">
              Already have an account?{' '}
              <Link href="/login" className="text-blue-400 hover:text-blue-300 font-medium transition-colors">
                Sign in
              </Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}

export default function SignUpPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
      </div>
    }>
      <SignUpContent />
    </Suspense>
  )
}
