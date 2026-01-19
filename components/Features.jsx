'use client';

import { motion } from 'framer-motion';
import { BarChart3, Clock, Flame, Code } from 'lucide-react';

const features = [
  {
    icon: BarChart3,
    title: 'VS Code Contribution Graph',
    description: 'GitHub-style heatmap based on real editor usage. Intensity calculated using active coding time, file edits, and session length.',
    color: 'from-blue-600 to-blue-400',
  },
  {
    icon: Clock,
    title: 'Automatic Session Tracking',
    description: 'Tracks when VS Code is opened and actively used. Smart idle detection ensures no fake hours are counted.',
    color: 'from-purple-600 to-purple-400',
  },
  {
    icon: Flame,
    title: 'True Coding Streaks',
    description: 'Streaks based on actual coding activity, no commits required. Visual streak counter motivates consistency.',
    color: 'from-orange-600 to-orange-400',
  },
  {
    icon: Code,
    title: 'Language Analytics',
    description: 'Track the languages you actually code in with daily, weekly, and monthly breakdowns. Perfect for interview prep.',
    color: 'from-green-600 to-green-400',
  },
];

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6 } },
};

export default function Features() {
  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl sm:text-5xl font-bold mb-4">
            Core Features
          </h2>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Everything you need to understand your real coding habits
          </p>
        </motion.div>

        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-2 gap-8"
        >
          {features.map((feature, idx) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={idx}
                variants={item}
                whileHover={{ y: -8, boxShadow: '0 20px 40px rgba(59, 130, 246, 0.2)' }}
                className="group relative bg-gradient-to-br from-gray-900/50 to-black border border-gray-800 hover:border-blue-500/50 rounded-2xl p-8 transition-all duration-300"
              >
                {/* Background gradient on hover */}
                <div className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-5 rounded-2xl transition-opacity duration-300`} />

                <div className="relative z-10">
                  <motion.div
                    whileHover={{ rotate: 10, scale: 1.1 }}
                    className={`w-14 h-14 rounded-lg bg-gradient-to-br ${feature.color} flex items-center justify-center mb-4 group-hover:shadow-lg transition-shadow duration-300`}
                  >
                    <Icon className="w-7 h-7 text-white" />
                  </motion.div>

                  <h3 className="text-xl font-bold text-white mb-3 group-hover:text-blue-400 transition-colors">
                    {feature.title}
                  </h3>

                  <p className="text-gray-400 group-hover:text-gray-300 transition-colors">
                    {feature.description}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
