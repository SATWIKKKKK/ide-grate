'use client'

import { useState } from 'react'
import { Check, Copy, Download, Key, Settings } from 'lucide-react'

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
  const siteUrl = 'https://vs-integrate.vercel.app'

  return (
    <div className="space-y-3">
      <a
        href={`${siteUrl}/api/download/vsix`}
        download="vs-integrate-extension.vsix"
        className="w-full py-3 bg-blue-600 hover:bg-blue-500 rounded-lg text-white font-medium transition-colors flex items-center justify-center gap-2"
      >
        <Download className="w-4 h-4" />
        Download .vsix File
      </a>
      <div className="space-y-1.5">
        {[
          'Open VS Code → Extensions panel (Ctrl+Shift+X)',
          'Click the ⋯ menu (three dots) → "Install from VSIX..."',
          'Select the downloaded .vsix file',
        ].map((text, i) => (
          <div key={i} className="flex items-start gap-2.5 p-2 bg-gray-800/50 rounded-lg">
            <span className="w-5 h-5 rounded-full bg-blue-600/30 text-blue-400 flex items-center justify-center text-[10px] font-bold shrink-0">
              {i + 1}
            </span>
            <span className="text-xs text-gray-400">{text}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function GetStarted() {
  const steps = [
    {
      icon: Download,
      title: 'Install the VS Code Extension',
      description: 'Download the .vsix file and install it in VS Code:',
      custom: 'install-tabs',
    },
    {
      icon: Key,
      title: 'Generate & Set API Key',
      description: 'Sign in to VS Integrate, go to Settings → VS Code Connection, and generate an API key. Then in VS Code:',
      commands: [
        '# Press Ctrl+Shift+P → "VS Integrate: Set API Key"',
        '# Paste your API key when prompted',
        '# Set endpoint: https://vs-integrate.vercel.app/api/heartbeat',
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
            Install the VS Code extension and start tracking your coding activity in minutes.
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
