'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Code2, 
  Key, 
  Download, 
  Settings, 
  Package, 
  Check, 
  Copy, 
  RefreshCw,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Terminal,
  Play,
  ExternalLink
} from 'lucide-react'
import Link from 'next/link'

interface Step {
  id: number
  title: string
  description: string
  icon: any
  action?: 'generate-key' | 'test-connection' | 'none'
}

const steps: Step[] = [
  {
    id: 1,
    title: 'Generate Your API Key',
    description: 'This unique key connects your VS Code to your account. Keep it secure - it\'s your personal tracker ID.',
    icon: Key,
    action: 'generate-key',
  },
  {
    id: 2,
    title: 'Install Extension Dependencies',
    description: 'Navigate to the vscode-extension folder and install the required packages.',
    icon: Package,
    action: 'none',
  },
  {
    id: 3,
    title: 'Package the Extension',
    description: 'Create a VSIX file that can be installed into VS Code.',
    icon: Download,
    action: 'none',
  },
  {
    id: 4,
    title: 'Install in VS Code',
    description: 'Install the packaged extension using the VS Code CLI or through the Extensions panel.',
    icon: Code2,
    action: 'none',
  },
  {
    id: 5,
    title: 'Configure Your API Key',
    description: 'Open VS Code, use the command palette (Ctrl+Shift+P), and run "VS Integrate: Set API Key".',
    icon: Settings,
    action: 'none',
  },
  {
    id: 6,
    title: 'Test Connection',
    description: 'Verify that your extension is properly connected and tracking your activity.',
    icon: Play,
    action: 'test-connection',
  },
]

export default function OnboardingPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [apiKey, setApiKey] = useState<string | null>(null)
  const [apiKeyLoading, setApiKeyLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [completedSteps, setCompletedSteps] = useState<number[]>([])
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle')
  const [testMessage, setTestMessage] = useState('')

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
  }, [status, router])

  useEffect(() => {
    if (session?.user) {
      fetchApiKey()
    }
  }, [session])

  const fetchApiKey = async () => {
    try {
      const res = await fetch('/api/apikey')
      if (res.ok) {
        const data = await res.json()
        if (data.apiKey) {
          setApiKey(data.apiKey)
          // Mark step 1 as completed if they already have a key
          if (!completedSteps.includes(1)) {
            setCompletedSteps(prev => [...prev, 1])
          }
        }
      }
    } catch (error) {
      console.error('Failed to fetch API key:', error)
    }
  }

  const generateApiKey = async () => {
    setApiKeyLoading(true)
    try {
      const res = await fetch('/api/apikey', { method: 'POST' })
      if (res.ok) {
        const data = await res.json()
        setApiKey(data.apiKey)
        markStepComplete(1)
      }
    } catch (error) {
      console.error('Failed to generate API key:', error)
    } finally {
      setApiKeyLoading(false)
    }
  }

  const copyApiKey = () => {
    if (apiKey) {
      navigator.clipboard.writeText(apiKey)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const markStepComplete = (stepId: number) => {
    if (!completedSteps.includes(stepId)) {
      setCompletedSteps(prev => [...prev, stepId])
    }
  }

  const testConnection = async () => {
    setTestStatus('testing')
    setTestMessage('Checking for recent activity from your extension...')
    
    try {
      // Check analytics to see if there's any recent activity
      const res = await fetch('/api/analytics')
      if (res.ok) {
        const data = await res.json()
        
        // Check if there's any activity data
        if (data.stats?.totalSessions > 0 || data.recentActivities?.length > 0) {
          setTestStatus('success')
          setTestMessage('Connection verified! Your extension is tracking activity successfully.')
          markStepComplete(6)
        } else {
          setTestStatus('error')
          setTestMessage('No activity detected yet. Make sure VS Code is open with the extension configured, then try coding for a few seconds.')
        }
      } else {
        setTestStatus('error')
        setTestMessage('Failed to check connection. Please try again.')
      }
    } catch (error) {
      setTestStatus('error')
      setTestMessage('Connection test failed. Please ensure your server is running.')
    }
  }

  const goToNextStep = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1)
    }
  }

  const goToPrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const skipOnboarding = () => {
    router.push('/dashboard')
  }

  const finishOnboarding = () => {
    // Save onboarding completion status
    localStorage.setItem('onboarding_completed', 'true')
    router.push('/dashboard')
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
      </div>
    )
  }

  if (!session) return null

  const activeStep = steps[currentStep - 1]
  const isStepComplete = completedSteps.includes(currentStep)
  const allStepsComplete = completedSteps.length >= steps.length

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-blue-950/20">
      {/* Header */}
      <nav className="sticky top-0 z-50 backdrop-blur-md bg-background/80 border-b border-border">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center">
              <Code2 className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-foreground to-blue-400 bg-clip-text text-transparent">
              vs-integrate
            </span>
          </Link>
          
          <button
            onClick={skipOnboarding}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Skip for now
          </button>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Progress Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-3xl font-bold mb-3">
            Welcome, {session.user?.name?.split(' ')[0] || 'Developer'}! 👋
          </h1>
          <p className="text-muted-foreground text-lg">
            Let's get your VS Code extension set up in just a few steps
          </p>
        </motion.div>

        {/* Progress Bar */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-4">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <motion.button
                  onClick={() => setCurrentStep(step.id)}
                  className={`relative w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                    completedSteps.includes(step.id)
                      ? 'bg-green-600 text-white'
                      : currentStep === step.id
                      ? 'bg-blue-600 text-white ring-4 ring-blue-600/30'
                      : 'bg-muted text-muted-foreground'
                  }`}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {completedSteps.includes(step.id) ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    <span className="text-sm font-semibold">{step.id}</span>
                  )}
                </motion.button>
                {index < steps.length - 1 && (
                  <div 
                    className={`w-12 sm:w-20 h-1 mx-2 rounded ${
                      completedSteps.includes(step.id) ? 'bg-green-600' : 'bg-muted'
                    }`} 
                  />
                )}
              </div>
            ))}
          </div>
          <p className="text-center text-sm text-muted-foreground">
            Step {currentStep} of {steps.length}: {activeStep.title}
          </p>
        </div>

        {/* Step Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="bg-card border border-border rounded-2xl p-8 mb-8"
          >
            <div className="flex items-start gap-6 mb-6">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center flex-shrink-0">
                <activeStep.icon className="w-7 h-7 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-semibold mb-2">{activeStep.title}</h2>
                <p className="text-muted-foreground">{activeStep.description}</p>
              </div>
            </div>

            {/* Step-specific content */}
            {currentStep === 1 && (
              <div className="space-y-4">
                {apiKey ? (
                  <div className="space-y-3">
                    <label className="text-sm text-muted-foreground">Your API Key:</label>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 p-4 bg-muted rounded-lg text-sm font-mono break-all border border-border">
                        {apiKey}
                      </code>
                      <button
                        onClick={copyApiKey}
                        className="p-4 bg-muted hover:bg-muted/80 rounded-lg transition-colors border border-border"
                        title="Copy to clipboard"
                      >
                        {copied ? <Check className="w-5 h-5 text-green-500" /> : <Copy className="w-5 h-5" />}
                      </button>
                      <button
                        onClick={generateApiKey}
                        disabled={apiKeyLoading}
                        className="p-4 bg-muted hover:bg-muted/80 rounded-lg transition-colors border border-border"
                        title="Regenerate key"
                      >
                        <RefreshCw className={`w-5 h-5 ${apiKeyLoading ? 'animate-spin' : ''}`} />
                      </button>
                    </div>
                    <p className="text-sm text-green-500 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4" />
                      API key generated successfully!
                    </p>
                  </div>
                ) : (
                  <button
                    onClick={generateApiKey}
                    disabled={apiKeyLoading}
                    className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors flex items-center gap-2 font-medium"
                  >
                    {apiKeyLoading ? (
                      <RefreshCw className="w-5 h-5 animate-spin" />
                    ) : (
                      <Key className="w-5 h-5" />
                    )}
                    Generate API Key
                  </button>
                )}
              </div>
            )}

            {currentStep === 2 && (
              <div className="space-y-4">
                <div className="relative">
                  <pre className="bg-muted border border-border rounded-lg p-4 overflow-x-auto">
                    <code className="text-sm">
{`cd vscode-extension
npm install
npm run compile`}
                    </code>
                  </pre>
                  <CopyButton text={`cd vscode-extension\nnpm install\nnpm run compile`} />
                </div>
                <button
                  onClick={() => markStepComplete(2)}
                  className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                    isStepComplete
                      ? 'bg-green-600/20 text-green-500 border border-green-600/30'
                      : 'bg-muted hover:bg-muted/80 text-foreground border border-border'
                  }`}
                >
                  {isStepComplete ? <Check className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                  {isStepComplete ? 'Completed' : 'Mark as done'}
                </button>
              </div>
            )}

            {currentStep === 3 && (
              <div className="space-y-4">
                <div className="relative">
                  <pre className="bg-muted border border-border rounded-lg p-4 overflow-x-auto">
                    <code className="text-sm">npx @vscode/vsce package</code>
                  </pre>
                  <CopyButton text="npx @vscode/vsce package" />
                </div>
                <p className="text-sm text-muted-foreground">
                  This will create a file called <code className="px-1 bg-muted rounded">vs-integrate-tracker-0.1.0.vsix</code>
                </p>
                <button
                  onClick={() => markStepComplete(3)}
                  className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                    isStepComplete
                      ? 'bg-green-600/20 text-green-500 border border-green-600/30'
                      : 'bg-muted hover:bg-muted/80 text-foreground border border-border'
                  }`}
                >
                  {isStepComplete ? <Check className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                  {isStepComplete ? 'Completed' : 'Mark as done'}
                </button>
              </div>
            )}

            {currentStep === 4 && (
              <div className="space-y-4">
                <p className="text-muted-foreground mb-4">
                  You can install the extension via command line or through VS Code's UI:
                </p>
                
                <div className="space-y-3">
                  <p className="text-sm font-medium">Option 1: Command Line</p>
                  <div className="relative">
                    <pre className="bg-muted border border-border rounded-lg p-4 overflow-x-auto">
                      <code className="text-sm">code --install-extension vs-integrate-tracker-0.1.0.vsix</code>
                    </pre>
                    <CopyButton text="code --install-extension vs-integrate-tracker-0.1.0.vsix" />
                  </div>
                </div>

                <div className="space-y-3">
                  <p className="text-sm font-medium">Option 2: VS Code UI</p>
                  <ol className="list-decimal list-inside text-sm text-muted-foreground space-y-1">
                    <li>Open VS Code</li>
                    <li>Go to Extensions (Ctrl+Shift+X)</li>
                    <li>Click the "..." menu at the top</li>
                    <li>Select "Install from VSIX..."</li>
                    <li>Choose the generated .vsix file</li>
                  </ol>
                </div>

                <button
                  onClick={() => markStepComplete(4)}
                  className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                    isStepComplete
                      ? 'bg-green-600/20 text-green-500 border border-green-600/30'
                      : 'bg-muted hover:bg-muted/80 text-foreground border border-border'
                  }`}
                >
                  {isStepComplete ? <Check className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                  {isStepComplete ? 'Completed' : 'Mark as done'}
                </button>
              </div>
            )}

            {currentStep === 5 && (
              <div className="space-y-4">
                <ol className="list-decimal list-inside text-muted-foreground space-y-3">
                  <li>Open VS Code</li>
                  <li>Press <code className="px-2 py-1 bg-muted rounded text-foreground">Ctrl+Shift+P</code> (or <code className="px-2 py-1 bg-muted rounded text-foreground">Cmd+Shift+P</code> on Mac)</li>
                  <li>Type <code className="px-2 py-1 bg-muted rounded text-foreground">VS Integrate: Set API Key</code></li>
                  <li>Paste your API key when prompted</li>
                </ol>

                {apiKey && (
                  <div className="mt-4 p-4 bg-blue-900/20 border border-blue-800/30 rounded-lg">
                    <p className="text-sm text-blue-300 mb-2">Your API Key (click to copy):</p>
                    <button
                      onClick={copyApiKey}
                      className="font-mono text-sm bg-muted px-3 py-2 rounded border border-border hover:bg-muted/80 transition-colors w-full text-left break-all"
                    >
                      {apiKey}
                      {copied && <span className="ml-2 text-green-500">(Copied!)</span>}
                    </button>
                  </div>
                )}

                <button
                  onClick={() => markStepComplete(5)}
                  className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                    isStepComplete
                      ? 'bg-green-600/20 text-green-500 border border-green-600/30'
                      : 'bg-muted hover:bg-muted/80 text-foreground border border-border'
                  }`}
                >
                  {isStepComplete ? <Check className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                  {isStepComplete ? 'Completed' : 'Mark as done'}
                </button>
              </div>
            )}

            {currentStep === 6 && (
              <div className="space-y-6">
                <p className="text-muted-foreground">
                  Open a file in VS Code and start coding for a few seconds. Then click the button below to verify the connection.
                </p>
                
                <button
                  onClick={testConnection}
                  disabled={testStatus === 'testing'}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-600/50 text-white rounded-lg transition-colors flex items-center gap-2 font-medium"
                >
                  {testStatus === 'testing' ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Play className="w-5 h-5" />
                  )}
                  {testStatus === 'testing' ? 'Testing...' : 'Test Connection'}
                </button>

                {testStatus !== 'idle' && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`p-4 rounded-lg flex items-start gap-3 ${
                      testStatus === 'success'
                        ? 'bg-green-900/20 border border-green-600/30'
                        : testStatus === 'error'
                        ? 'bg-red-900/20 border border-red-600/30'
                        : 'bg-blue-900/20 border border-blue-600/30'
                    }`}
                  >
                    {testStatus === 'success' && <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />}
                    {testStatus === 'error' && <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />}
                    {testStatus === 'testing' && <Loader2 className="w-5 h-5 text-blue-500 animate-spin flex-shrink-0 mt-0.5" />}
                    <p className={`text-sm ${
                      testStatus === 'success' ? 'text-green-400' :
                      testStatus === 'error' ? 'text-red-400' :
                      'text-blue-400'
                    }`}>
                      {testMessage}
                    </p>
                  </motion.div>
                )}

                {testStatus === 'error' && (
                  <div className="p-4 bg-muted/50 rounded-lg space-y-2">
                    <p className="text-sm font-medium">Troubleshooting tips:</p>
                    <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                      <li>Make sure VS Code is open with the extension installed</li>
                      <li>Check that you've set the correct API key</li>
                      <li>Look for "VS Integrate: Tracking" in the VS Code status bar</li>
                      <li>Try reloading VS Code (Ctrl+Shift+P → "Reload Window")</li>
                    </ul>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between">
          <button
            onClick={goToPrevStep}
            disabled={currentStep === 1}
            className="px-6 py-3 bg-muted hover:bg-muted/80 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors flex items-center gap-2"
          >
            <ArrowLeft className="w-5 h-5" />
            Previous
          </button>

          {currentStep < steps.length ? (
            <button
              onClick={goToNextStep}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors flex items-center gap-2"
            >
              Next
              <ArrowRight className="w-5 h-5" />
            </button>
          ) : (
            <button
              onClick={finishOnboarding}
              className="px-6 py-3 bg-green-600 hover:bg-green-500 text-white rounded-lg transition-colors flex items-center gap-2"
            >
              <Check className="w-5 h-5" />
              Go to Dashboard
            </button>
          )}
        </div>

        {/* Quick Actions */}
        <div className="mt-12 p-6 bg-muted/30 rounded-2xl border border-border">
          <h3 className="font-semibold mb-4">Need help?</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <a
              href="https://github.com/SATWIKKKKK/ide-grate"
              target="_blank"
              rel="noopener noreferrer"
              className="p-4 bg-card border border-border rounded-lg hover:border-blue-600/50 transition-colors flex items-center gap-3"
            >
              <ExternalLink className="w-5 h-5 text-muted-foreground" />
              <span className="text-sm">View on GitHub</span>
            </a>
            <button
              onClick={skipOnboarding}
              className="p-4 bg-card border border-border rounded-lg hover:border-blue-600/50 transition-colors flex items-center gap-3"
            >
              <ArrowRight className="w-5 h-5 text-muted-foreground" />
              <span className="text-sm">Skip to Dashboard</span>
            </button>
            <Link
              href="/"
              className="p-4 bg-card border border-border rounded-lg hover:border-blue-600/50 transition-colors flex items-center gap-3"
            >
              <Code2 className="w-5 h-5 text-muted-foreground" />
              <span className="text-sm">Back to Home</span>
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button
      onClick={handleCopy}
      className="absolute top-2 right-2 p-2 rounded bg-background/80 hover:bg-background transition-colors border border-border"
      title="Copy to clipboard"
    >
      {copied ? (
        <Check className="w-4 h-4 text-green-500" />
      ) : (
        <Copy className="w-4 h-4 text-muted-foreground" />
      )}
    </button>
  )
}
