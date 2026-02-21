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
      // mark the current step complete when user advances
      markStepComplete(currentStep)
      setCurrentStep(currentStep + 1)
    }
  }

  const goToPrevStep = () => {
    if (currentStep > 1) {
      const newStep = currentStep - 1
      // keep only steps up to the new current step completed
      setCompletedSteps(prev => prev.filter(id => id <= newStep))
      setCurrentStep(newStep)
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
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
      </div>
    )
  }

  if (!session) return null

  const activeStep = steps[currentStep - 1]
  const isStepComplete = completedSteps.includes(currentStep)
  const allStepsComplete = completedSteps.length >= steps.length

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      {/* Header */}
      <nav className="sticky top-0 z-50 backdrop-blur-md bg-black/80 border-b border-gray-800 shrink-0">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
              <Code2 className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-bold text-white">
              vs-integrate
            </span>
          </Link>
          
          <button
            onClick={skipOnboarding}
            className="text-xs text-gray-500 hover:text-white transition-colors"
          >
            Skip for now
          </button>
        </div>
      </nav>

      <main className="flex-1 flex flex-col max-w-5xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-4 sm:py-5">
        {/* Progress Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-5"
        >
          <h1 className="text-xl font-bold mb-1.5 text-white">
            Welcome, {session.user?.name?.split(' ')[0] || 'Developer'}! 👋
          </h1>
          <p className="text-gray-400 text-sm">
            Let's get your VS Code extension set up in just a few steps
          </p>
        </motion.div>

        {/* Progress Bar */}
        <div className="mb-5">
          <div className="flex items-center justify-between mb-2">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center flex-1">
                <motion.button
                  onClick={() => setCurrentStep(step.id)}
                  className={`relative w-8 h-8 rounded-full flex items-center justify-center transition-all shrink-0 ${
                    currentStep === step.id
                      ? 'bg-blue-600 text-white ring-2 ring-blue-600/30'
                      : completedSteps.includes(step.id)
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-800 text-gray-500'
                  }`}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {completedSteps.includes(step.id) && currentStep !== step.id ? (
                    <Check className="w-3.5 h-3.5" />
                  ) : (
                    <span className="text-xs font-semibold">{step.id}</span>
                  )}
                </motion.button>
                {index < steps.length - 1 && (
                  <div
                    className={`flex-1 h-1 mx-1 ${
                      completedSteps.includes(step.id) && currentStep !== step.id ? 'bg-green-600' : 'bg-gray-800'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
          <p className="text-center text-sm text-gray-400">
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
            className="bg-gray-900 border border-gray-800 rounded-xl p-5 flex-1 overflow-y-auto"
          >
            <div className="flex items-start gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center shrink-0">
                <activeStep.icon className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-semibold mb-0.5 text-white">{activeStep.title}</h2>
                <p className="text-gray-400 text-sm">{activeStep.description}</p>
              </div>
            </div>

            {/* Step-specific content */}
            {currentStep === 1 && (
              <div className="space-y-3">
                {apiKey ? (
                  <div className="space-y-2">
                    <label className="text-xs text-gray-400">Your API Key:</label>
                    <div className="flex items-center gap-1.5">
                      <code className="flex-1 p-2 bg-gray-800 rounded-lg text-xs font-mono break-all border border-gray-700 text-gray-300">
                        {apiKey}
                      </code>
                      <button
                        onClick={copyApiKey}
                        className="p-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors border border-gray-700"
                        title="Copy to clipboard"
                      >
                        {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4 text-gray-400" />}
                      </button>
                      <button
                        onClick={generateApiKey}
                        disabled={apiKeyLoading}
                        className="p-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors border border-gray-700"
                        title="Regenerate key"
                      >
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      </button>
                    </div>
                    <p className="text-sm text-green-500 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      API key generated successfully!
                    </p>
                  </div>
                ) : (
                  <button
                    onClick={generateApiKey}
                    disabled={apiKeyLoading}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors flex items-center gap-2 text-sm font-medium"
                  >
                    {apiKeyLoading ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <Key className="w-4 h-4" />
                    )}
                    Generate API Key
                  </button>
                )}
              </div>
            )}

            {currentStep === 2 && (
              <div className="space-y-3">
                <div className="relative">
                  <pre className="bg-gray-800 border border-gray-700 rounded-lg p-3 overflow-x-auto text-sm text-gray-300">
                    <code>
{`cd vscode-extension
npm install
npm run compile`}
                    </code>
                  </pre>
                  <CopyButton text={`cd vscode-extension\nnpm install\nnpm run compile`} />
                </div>
              </div>
            )}

            {currentStep === 3 && (
              <div className="space-y-3">
                <div className="relative">
                  <pre className="bg-gray-800 border border-gray-700 rounded-lg p-3 overflow-x-auto text-sm text-gray-300">
                    <code>npx @vscode/vsce package</code>
                  </pre>
                  <CopyButton text="npx @vscode/vsce package" />
                </div>
                <p className="text-sm text-gray-400">
                  Creates <code className="px-1 bg-gray-800 rounded text-gray-300">vs-integrate-tracker-0.1.0.vsix</code>
                </p>
              </div>
            )}

            {currentStep === 4 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <p className="text-sm font-medium">Option 1: Terminal</p>
                  <div className="relative">
                    <pre className="bg-gray-800 border border-gray-700 rounded-lg p-2.5 overflow-x-auto text-sm text-gray-300">
                      <code>code --install-extension vs-integrate-tracker-0.1.0.vsix</code>
                    </pre>
                    <CopyButton text="code --install-extension vs-integrate-tracker-0.1.0.vsix" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <p className="text-sm font-medium">Option 2: VS Code UI</p>
                  <ol className="list-decimal list-inside text-sm text-gray-400 space-y-1">
                    <li>Open Extensions <span className="text-gray-500">(Ctrl+Shift+X)</span></li>
                    <li>Click "..." menu at the top</li>
                    <li>Select "Install from VSIX..."</li>
                    <li>Choose the .vsix file</li>
                  </ol>
                </div>
              </div>
            )}

            {currentStep === 5 && (
              <div className="space-y-3">
                <ol className="list-decimal list-inside text-gray-400 text-sm space-y-2">
                  <li>Open VS Code</li>
                  <li>Press <code className="px-1 py-0.5 bg-gray-800 rounded text-white">Ctrl+Shift+P</code> (or <code className="px-1 py-0.5 bg-gray-800 rounded text-white">Cmd+Shift+P</code> on Mac)</li>
                  <li>Type <code className="px-1 py-0.5 bg-gray-800 rounded text-white">VS Integrate: Set API Key</code></li>
                  <li>Paste your API key when prompted</li>
                </ol>

                {apiKey && (
                  <div className="p-3 bg-blue-900/20 border border-blue-800/30 rounded-lg">
                    <p className="text-xs text-blue-300 mb-1">Your API Key (click to copy):</p>
                    <button
                      onClick={copyApiKey}
                      className="font-mono text-xs bg-gray-800 px-2 py-1.5 rounded border border-gray-700 hover:bg-gray-700 transition-colors w-full text-left break-all text-gray-300"
                    >
                      {apiKey}
                      {copied && <span className="ml-2 text-green-500">(Copied!)</span>}
                    </button>
                  </div>
                )}
              </div>
            )}

            {currentStep === 6 && (
              <div className="space-y-3">
                <p className="text-sm text-gray-400">
                  Open a file in VS Code and start coding for a few seconds, then verify below.
                </p>
                
                <button
                  onClick={testConnection}
                  disabled={testStatus === 'testing'}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-600/50 text-white rounded-lg transition-colors flex items-center gap-2 text-sm font-medium"
                >
                  {testStatus === 'testing' ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Play className="w-4 h-4" />
                  )}
                  {testStatus === 'testing' ? 'Testing...' : 'Test Connection'}
                </button>

                {testStatus !== 'idle' && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`p-3 rounded-lg flex items-start gap-2 ${
                      testStatus === 'success'
                        ? 'bg-green-900/20 border border-green-600/30'
                        : testStatus === 'error'
                        ? 'bg-red-900/20 border border-red-600/30'
                        : 'bg-blue-900/20 border border-blue-600/30'
                    }`}
                  >
                    {testStatus === 'success' && <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />}
                    {testStatus === 'error' && <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />}
                    {testStatus === 'testing' && <Loader2 className="w-4 h-4 text-blue-500 animate-spin shrink-0 mt-0.5" />}
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
                  <div className="p-3 bg-gray-800/50 rounded-lg space-y-1">
                    <p className="text-sm font-medium text-white">Troubleshooting tips:</p>
                    <ul className="list-disc list-inside text-sm text-gray-400 space-y-1">
                      <li>Make sure VS Code is open with the extension installed</li>
                      <li>Check that you've set the correct API key</li>
                      <li>Look for "VS Integrate: Tracking" in the status bar</li>
                      <li>Try reloading VS Code (Ctrl+Shift+P → "Reload Window")</li>
                    </ul>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between pt-4 shrink-0">
          <button
            onClick={goToPrevStep}
            disabled={currentStep === 1}
            className="px-5 py-2.5 bg-gray-800 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors flex items-center gap-1.5 text-sm text-gray-300"
          >
            <ArrowLeft className="w-4 h-4" />
            Previous
          </button>

          <a
            href="https://github.com/SATWIKKKKK/ide-grate"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-gray-500 hover:text-white transition-colors flex items-center gap-1"
          >
            <ExternalLink className="w-3 h-3" />
            Help
          </a>

          {currentStep < steps.length ? (
            <button
              onClick={goToNextStep}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors flex items-center gap-1.5 text-sm"
            >
              Next
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={finishOnboarding}
              className="px-5 py-2.5 bg-green-600 hover:bg-green-500 text-white rounded-lg transition-colors flex items-center gap-1.5 text-sm"
            >
              <Check className="w-4 h-4" />
              Dashboard
            </button>
          )}
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
      className="absolute top-2 right-2 p-2 rounded bg-black/80 hover:bg-gray-800 transition-colors border border-gray-700"
      title="Copy to clipboard"
    >
      {copied ? (
        <Check className="w-4 h-4 text-green-500" />
      ) : (
        <Copy className="w-4 h-4 text-gray-400" />
      )}
    </button>
  )
}
