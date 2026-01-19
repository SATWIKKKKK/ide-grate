'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

const statCards = [
  {
    emoji: '🔥',
    label: 'Longest Coding Streak',
    value: 47,
    unit: 'days',
    color: 'from-orange-600 to-red-500',
  },
  {
    emoji: '🌙',
    label: 'Peak Coding Hour',
    value: 2,
    unit: 'AM',
    color: 'from-purple-600 to-blue-500',
  },
  {
    emoji: '🤡',
    label: 'Opened Without Coding',
    value: 23,
    unit: 'times',
    color: 'from-yellow-600 to-orange-500',
  },
  {
    emoji: '🧩',
    label: 'Most Used Extension',
    value: 'Prettier',
    unit: '312 uses',
    color: 'from-green-600 to-emerald-500',
  },
];

function AnimatedCounter({ target, duration = 2 }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTime;
    const animate = (currentTime) => {
      if (!startTime) startTime = currentTime;
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / (duration * 1000), 1);

      if (typeof target === 'number') {
        setCount(Math.floor(progress * target));
      }

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    const id = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(id);
  }, [target, duration]);

  return count;
}

export default function Stats() {
  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 bg-gradient-to-t from-blue-900/5 via-black to-black pointer-events-none" />

      <div className="max-w-7xl mx-auto relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl sm:text-5xl font-bold mb-4">
            Your Coding Personality
          </h2>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Fun stats that reveal your unique developer profile
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {statCards.map((card, idx) => {
            const isNumeric = typeof card.value === 'number';
            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: idx * 0.1 }}
                whileHover={{ y: -10, scale: 1.05 }}
                className={`relative group bg-gradient-to-br ${card.color} p-[2px] rounded-2xl overflow-hidden`}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                <div className="relative bg-black rounded-2xl p-6 h-full flex flex-col justify-between">
                  <div>
                    <p className="text-4xl mb-2">{card.emoji}</p>
                    <p className="text-sm text-gray-400 group-hover:text-gray-300 transition-colors">
                      {card.label}
                    </p>
                  </div>

                  <div className="mt-6">
                    <motion.div
                      className="text-3xl font-bold text-white mb-1"
                      key={`${card.value}-${idx}`}
                    >
                      {isNumeric ? (
                        <AnimatedCounter target={card.value} duration={2} />
                      ) : (
                        card.value
                      )}
                    </motion.div>
                    <p className="text-xs text-gray-500">{card.unit}</p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Bottom insight */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="mt-12 text-center"
        >
          <p className="text-gray-400">
            These insights help you understand your coding patterns and stay motivated. 
            <span className="text-blue-400 font-semibold"> No judgment, just data.</span>
          </p>
        </motion.div>
      </div>
    </section>
  );
}
