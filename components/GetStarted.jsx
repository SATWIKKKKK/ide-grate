'use client'

import { useState } from 'react'
import { Check, Copy, Download, Package, Settings } from 'lucide-react'

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
      className="absolute top-2 right-2 p-2 rounded bg-muted hover:bg-muted/80 transition-colors"
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

export default function GetStarted() {
  const steps = [
    {
      icon: Download,
      title: 'Install dependencies',
      description: 'Navigate to the vscode-extension folder and install required packages:',
      commands: [
        'cd vscode-extension',
        'npm install',
        'npm run compile'
      ]
    },
    {
      icon: Package,
      title: 'Package the extension',
      description: 'Create a VSIX file that can be installed into VS Code:',
      commands: [
        'npx @vscode/vsce package'
      ]
    },
    {
      icon: Download,
      title: 'Install in VS Code',
      description: 'Install the packaged extension using the VS Code CLI or UI:',
      commands: [
        'code --install-extension vs-integrate-tracker-0.1.0.vsix'
      ]
    },
    {
      icon: Settings,
      title: 'Configure API key',
      description: 'Go to your dashboard, generate an API key (Settings → VS Code Setup), and add it to the extension settings. Reload VS Code to start tracking.',
      commands: []
    }
  ]

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-background">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">Get Started</h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Follow these steps to install the VS Code extension and start tracking your coding activity.
          </p>
        </div>

        <div className="relative">
          {/* Vertical timeline line */}
          <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-border" />

          {/* Steps */}
          <div className="space-y-12">
            {steps.map((step, index) => {
              const Icon = step.icon
              return (
                <div key={index} className="relative flex gap-6">
                  {/* Icon circle */}
                  <div className="relative z-10 flex-shrink-0">
                    <div className="w-16 h-16 rounded-full bg-blue-600 flex items-center justify-center shadow-lg">
                      <Icon className="w-7 h-7 text-white" />
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 pb-8">
                    <h3 className="text-xl font-semibold mb-2">
                      {index + 1}. {step.title}
                    </h3>
                    <p className="text-muted-foreground mb-4">
                      {step.description}
                    </p>

                    {/* Commands */}
                    {step.commands.length > 0 && (
                      <div className="relative">
                        <pre className="bg-card border border-border rounded-lg p-4 overflow-x-auto text-sm">
                          <code className="text-muted-foreground">
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

        <div className="mt-12 p-6 bg-muted/50 rounded-lg text-center">
          <p className="text-sm text-muted-foreground">
            💡 <strong>Tip:</strong> If you don't have a database configured, the app runs in demo mode. 
            You can still explore the dashboard and see sample data.
          </p>
        </div>
      </div>
    </section>
  )
}
