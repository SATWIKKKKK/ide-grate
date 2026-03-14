'use client'

import { useState } from 'react'
import { Check, Copy, Download, Key, Settings, Terminal, Monitor } from 'lucide-react'

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button
      onClick={handleCopy}
      className="absolute top-2 right-2 p-2 rounded bg-gray-800 hover:bg-gray-700 transition-colors"
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

function InstallTabs() {
  const [tab, setTab] = useState('oneliner')
  const siteUrl = typeof window !== 'undefined' ? window.location.origin : 'https://vs-integrate.vercel.app'

  const tabs = [
    { key: 'oneliner', label: 'One-Liner (macOS/Linux)', icon: Terminal },
    { key: 'powershell', label: 'PowerShell (Windows)', icon: Monitor },
    { key: 'manual', label: 'Manual', icon: Download },
  ]

  const commands = {
    oneliner: `curl -fsSL ${siteUrl}/api/download/vsix -o vs-integrate.vsix && code --install-extension vs-integrate.vsix && rm vs-integrate.vsix`,
    powershell: `Invoke-WebRequest -Uri "${siteUrl}/api/download/vsix" -OutFile "vs-integrate.vsix"; code --install-extension vs-integrate.vsix; Remove-Item vs-integrate.vsix`,
    manual: `# 1. Download from: ${siteUrl}/api/download/vsix\n# 2. Open VS Code → Extensions (Ctrl+Shift+X)\n# 3. Click ⋯ menu → "Install from VSIX..."\n# 4. Select the downloaded file`,
  }

  return (
    <div>
      <div className="flex gap-1 mb-3 flex-wrap">
        {tabs.map(t => {
          const Icon = t.icon
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 ${
                tab === t.key
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-800 text-gray-400 hover:text-gray-300 hover:bg-gray-700'
              }`}
            >
              <Icon className="w-3 h-3" />
              {t.label}
            </button>
          )
        })}
      </div>
      <div className="relative">
        <pre className="bg-gray-900 border border-gray-800 rounded-lg p-4 overflow-x-auto text-sm">
          <code className="text-gray-300">{commands[tab]}</code>
        </pre>
        <CopyButton text={commands[tab]} />
      </div>
    </div>
  )
}

export default function GetStarted() {
  const steps = [
    {
      icon: Download,
      title: 'Install the VS Code Extension',
      description: 'Run one command in your terminal to download and install the extension:',
      custom: 'install-tabs',
    },
    {
      icon: Key,
      title: 'Generate & Set API Key',
      description: 'Sign in to VS Integrate, go to Settings → VS Code Connection, and generate an API key. Then use "Connect VS Code Automatically" or set it manually:',
      commands: [
        '# In VS Code: Ctrl+Shift+P → "VS Integrate: Set API Key"',
        '# Paste your API key when prompted',
      ],
    },
    {
      icon: Settings,
      title: 'Start Coding',
      description: 'Open any file in VS Code and start coding. The extension automatically sends heartbeats. Check your dashboard to see live tracking and contribution graphs.',
      commands: [],
    },
  ]

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-black">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4 text-white">Get Started</h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Install the VS Code extension with a single command and start tracking your coding activity.
          </p>
        </div>

        <div className="relative">
          <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gray-800" />

          <div className="space-y-12">
            {steps.map((step, index) => {
              const Icon = step.icon
              return (
                <div key={index} className="relative flex gap-6">
                  <div className="relative z-10 shrink-0">
                    <div className="w-16 h-16 rounded-full bg-blue-600 flex items-center justify-center shadow-lg">
                      <Icon className="w-7 h-7 text-white" />
                    </div>
                  </div>

                  <div className="flex-1 pb-8">
                    <h3 className="text-xl font-semibold mb-2 text-white">
                      {index + 1}. {step.title}
                    </h3>
                    <p className="text-gray-400 mb-4">
                      {step.description}
                    </p>

                    {step.custom === 'install-tabs' && <InstallTabs />}

                    {step.commands && step.commands.length > 0 && (
                      <div className="relative">
                        <pre className="bg-gray-900 border border-gray-800 rounded-lg p-4 overflow-x-auto text-sm">
                          <code className="text-gray-300">
                            {step.commands.join('\n')}
                          </code>
                        </pre>
                        <CopyButton text={step.commands.join('\n')} />
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="mt-12 p-6 bg-gray-900/50 rounded-lg text-center border border-gray-800">
          <p className="text-sm text-gray-400">
            💡 <strong>Tip:</strong> The extension works out of the box once you set your API key. 
            No additional configuration needed — just install, connect, and code!
          </p>
        </div>
      </div>
    </section>
  )
}
