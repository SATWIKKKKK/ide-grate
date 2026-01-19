'use client';

import { motion } from 'framer-motion';

export default function ContributionGraph() {
  // Generate mock contribution data
  const generateContributions = () => {
    const weeks = 52;
    const days = 7;
    const data = [];
    
    for (let i = 0; i < weeks; i++) {
      const week = [];
      for (let j = 0; j < days; j++) {
        week.push(Math.random() > 0.6 ? Math.floor(Math.random() * 5) : 0);
      }
      data.push(week);
    }
    return data;
  };

  const contributions = generateContributions();
  
  const getColor = (value) => {
    if (value === 0) return 'bg-gray-800';
    if (value === 1) return 'bg-blue-900';
    if (value === 2) return 'bg-blue-700';
    if (value === 3) return 'bg-blue-500';
    if (value === 4) return 'bg-blue-400';
    return 'bg-blue-300';
  };

  const dayLabels = ['Mon', 'Wed', 'Fri'];
  const monthLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  return (
    <div className="w-full">
      <h3 className="text-lg font-semibold text-white mb-6">12-Month Contribution Graph</h3>
      
      <div className="flex gap-2 items-start overflow-x-auto pb-4">
        {/* Day labels */}
        <div className="flex flex-col gap-1 justify-center">
          {dayLabels.map((day, i) => (
            <div key={day} className="text-xs text-gray-500 h-3">{day}</div>
          ))}
        </div>

        {/* Contribution grid */}
        <div className="flex gap-1">
          {contributions.map((week, weekIdx) => (
            <motion.div
              key={weekIdx}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: weekIdx * 0.01 }}
              className="flex flex-col gap-1"
            >
              {week.map((day, dayIdx) => (
                <motion.div
                  key={`${weekIdx}-${dayIdx}`}
                  whileHover={{ scale: 1.2, rotate: 5 }}
                  className={`w-3 h-3 rounded-sm ${getColor(day)} cursor-pointer border border-gray-700 hover:border-blue-400 transition-all`}
                  title={`${day} contributions`}
                />
              ))}
            </motion.div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-3 mt-6 text-xs text-gray-400">
        <span>Less</span>
        <div className="flex gap-1">
          <div className="w-3 h-3 bg-gray-800 rounded-sm" />
          <div className="w-3 h-3 bg-blue-900 rounded-sm" />
          <div className="w-3 h-3 bg-blue-700 rounded-sm" />
          <div className="w-3 h-3 bg-blue-500 rounded-sm" />
          <div className="w-3 h-3 bg-blue-300 rounded-sm" />
        </div>
        <span>More</span>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-3 gap-3 mt-8">
        <motion.div
          whileHover={{ y: -5 }}
          className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg p-4 border border-gray-700 hover:border-blue-500/50 transition-all"
        >
          <p className="text-gray-400 text-xs mb-1">Coding Streak</p>
          <p className="text-2xl font-bold text-blue-400">17 days</p>
          <p className="text-xs text-gray-500 mt-2">🔥 On fire!</p>
        </motion.div>

        <motion.div
          whileHover={{ y: -5 }}
          className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg p-4 border border-gray-700 hover:border-blue-500/50 transition-all"
        >
          <p className="text-gray-400 text-xs mb-1">Avg. Daily</p>
          <p className="text-2xl font-bold text-blue-400">4h 32m</p>
          <p className="text-xs text-gray-500 mt-2">Consistent</p>
        </motion.div>

        <motion.div
          whileHover={{ y: -5 }}
          className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg p-4 border border-gray-700 hover:border-blue-500/50 transition-all"
        >
          <p className="text-gray-400 text-xs mb-1">Top Lang</p>
          <p className="text-2xl font-bold text-blue-400">TypeScript</p>
          <p className="text-xs text-gray-500 mt-2">67% of code</p>
        </motion.div>
      </div>
    </div>
  );
}
