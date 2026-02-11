'use client';

import { motion } from 'framer-motion';
import { TrendingUp, Moon, Zap, Eye } from 'lucide-react';

const insights = [
  {
    icon: TrendingUp,
    title: 'Productivity Insights',
    items: [
      'Most productive hours of the day',
      'Best day of the week',
      'Average session duration',
      'Focus time vs context switching',
    ],
  },
  {
    icon: Moon,
    title: 'Developer Behavior Stats',
    items: [
      'Night owl vs early bird detection',
      'Opened VS Code without coding counter 🤡',
      'Rage-quit detection (short sessions)',
      'Flow-state session identification',
    ],
  },
  {
    icon: Zap,
    title: 'Extension Usage Insights',
    items: [
      'Most used VS Code extensions',
      'Time impact per extension',
      'Debugging vs writing ratio',
      'Identify productivity boosters',
    ],
  },
];

export default function Insights() {
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
            Intelligence & Insights
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Discover patterns in your coding habits with intelligent analytics
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {insights.map((insight, idx) => {
            const Icon = insight.icon;
            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: idx * 0.1 }}
                whileHover={{ y: -8 }}
                className="relative group"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-transparent rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-300 opacity-0 group-hover:opacity-100" />
                
                <div className="relative bg-card border border-border hover:border-blue-500/50 rounded-2xl p-8 transition-all duration-300">
                  <div className="flex items-center gap-3 mb-6">
                    <motion.div
                      whileHover={{ rotate: 20, scale: 1.1 }}
                      className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-600 to-blue-400 flex items-center justify-center"
                    >
                      <Icon className="w-6 h-6 text-white" />
                    </motion.div>
                    <h3 className="text-lg font-bold">{insight.title}</h3>
                  </div>

                  <ul className="space-y-3">
                    {insight.items.map((item, itemIdx) => (
                      <motion.li
                        key={itemIdx}
                        initial={{ opacity: 0, x: -10 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: idx * 0.1 + itemIdx * 0.05 }}
                        className="flex items-start gap-3 text-muted-foreground hover:text-blue-500 transition-colors"
                      >
                        <span className="text-blue-500 mt-1 flex-shrink-0">✓</span>
                        <span>{item}</span>
                      </motion.li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
