'use client';

import { motion } from 'framer-motion';
import { Lock, FileX, Eye, Database } from 'lucide-react';

const privacyFeatures = [
  {
    icon: Lock,
    title: 'End-to-End Encrypted',
    description: 'Your data is encrypted locally before any transmission',
  },
  {
    icon: FileX,
    title: 'Zero Code Access',
    description: 'We never read or upload your actual code content',
  },
  {
    icon: Eye,
    title: 'Anonymous Metadata',
    description: 'Only activity timestamps and durations are tracked',
  },
  {
    icon: Database,
    title: 'Local-First Storage',
    description: 'Data stays on your machine with optional cloud sync',
  },
];

export default function Privacy() {
  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      <div className="max-w-7xl mx-auto">
        {/* Background decoration */}
        <div className="absolute top-1/2 right-0 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16 relative z-10"
        >
          <h2 className="text-4xl sm:text-5xl font-bold mb-4">
            Privacy-First by Design
          </h2>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Your trust is our foundation. Complete transparency in how we handle your data.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16 relative z-10"
        >
          {privacyFeatures.map((feature, idx) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={idx}
                whileHover={{ scale: 1.02 }}
                className="flex gap-4 bg-gradient-to-br from-gray-900/50 to-black border border-gray-800 hover:border-blue-500/50 rounded-xl p-6 transition-all duration-300"
              >
                <motion.div
                  whileHover={{ rotate: 10 }}
                  className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-600 to-blue-400 flex items-center justify-center flex-shrink-0"
                >
                  <Icon className="w-6 h-6 text-white" />
                </motion.div>
                <div>
                  <h3 className="text-lg font-bold text-white mb-2">{feature.title}</h3>
                  <p className="text-gray-400">{feature.description}</p>
                </div>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Trust badge */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="relative z-10"
        >
          <div className="bg-gradient-to-r from-blue-900/30 to-purple-900/30 border border-blue-500/30 rounded-xl p-8 text-center">
            <p className="text-gray-300 mb-4">
              Built by developers, for developers. We value your privacy as much as you do.
            </p>
            <div className="flex flex-wrap justify-center gap-4 text-sm text-gray-400">
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 bg-green-400 rounded-full" />
                SOC 2 Compliant
              </span>
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 bg-green-400 rounded-full" />
                GDPR Compliant
              </span>
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 bg-green-400 rounded-full" />
                Open Source
              </span>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
