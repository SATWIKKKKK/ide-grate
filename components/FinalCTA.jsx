'use client';

import { motion } from 'framer-motion';
import { Code2, Github, Zap, ArrowRight } from 'lucide-react';

export default function FinalCTA() {
  return (
    <section className="py-24 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Radial gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-900/30 via-black to-black pointer-events-none" />
      <div className="absolute top-1/2 -translate-y-1/2 right-1/4 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-4xl mx-auto text-center relative z-10">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-5xl sm:text-6xl font-bold mb-6"
        >
          Your contribution graph{' '}
          <span className="bg-gradient-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent">
            deserves the truth.
          </span>
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-xl text-gray-400 mb-12 max-w-2xl mx-auto"
        >
          Stop hiding your real productivity behind commits. Get the insights you deserve.
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="flex flex-col sm:flex-row gap-4 justify-center mb-8"
        >
          <motion.button
            whileHover={{
              scale: 1.05,
              boxShadow: '0 0 40px rgba(59, 130, 246, 0.8)',
            }}
            whileTap={{ scale: 0.95 }}
            className="px-10 py-4 bg-blue-600 text-white rounded-lg font-semibold flex items-center justify-center gap-2 hover:bg-blue-500 transition-all duration-300 group text-lg"
          >
            <Code2 className="w-6 h-6" />
            Sign in with VS Code
            <motion.div
              animate={{ x: [0, 4, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              <ArrowRight className="w-5 h-5" />
            </motion.div>
          </motion.button>

          <motion.button
            whileHover={{
              scale: 1.05,
              boxShadow: '0 0 40px rgba(59, 130, 246, 0.8)',
            }}
            whileTap={{ scale: 0.95 }}
            className="px-10 py-4 bg-blue-600 text-white rounded-lg font-semibold flex items-center justify-center gap-2 hover:bg-blue-500 transition-all duration-300 group text-lg"
          >
            <Zap className="w-6 h-6" />
            Sign in with Microsoft
          </motion.button>

          <motion.button
            whileHover={{
              scale: 1.05,
              boxShadow: '0 0 40px rgba(59, 130, 246, 0.8)',
            }}
            whileTap={{ scale: 0.95 }}
            className="px-10 py-4 bg-blue-600 text-white rounded-lg font-semibold flex items-center justify-center gap-2 hover:bg-blue-500 transition-all duration-300 group text-lg"
          >
            <Github className="w-6 h-6" />
            Sign in with GitHub
          </motion.button>
        </motion.div>

        {/* Footer message */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="text-gray-500 text-sm"
        >
          <p>
            Built by developers who code at 2 AM.{' '}
            <span className="text-gray-400">We get it.</span>
          </p>
        </motion.div>
      </div>

      {/* Sticky mobile CTA */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="fixed bottom-0 left-0 right-0 md:hidden bg-gradient-to-t from-black via-black to-transparent pt-4 pb-6 px-4 z-40 border-t border-gray-800"
      >
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.95 }}
          className="w-full py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-500 transition-all duration-300 flex items-center justify-center gap-2"
        >
          <Code2 className="w-5 h-5" />
          Get Started Now
        </motion.button>
      </motion.div>
    </section>
  );
}
