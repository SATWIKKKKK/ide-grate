'use client';

import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';

export default function ContributionGraph() {
  const { data: session } = useSession();
  const [contributionData, setContributionData] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (session?.user) {
      fetchContributions();
    } else {
      // Show mock data for non-authenticated users
      setContributionData(generateMockContributions());
      setStats({ totalHours: 0, activeDays: 0, avgHoursPerDay: 0 });
      setLoading(false);
    }
  }, [session]);

  const fetchContributions = async () => {
    try {
      const res = await fetch('/api/contributions?days=365');
      if (res.ok) {
        const data = await res.json();
        setContributionData(data.contributions);
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Failed to fetch contributions:', error);
      setContributionData(generateMockContributions());
    } finally {
      setLoading(false);
    }
  };

  // Generate mock contribution data for display
  const generateMockContributions = () => {
    const contributions = {};
    const today = new Date();
    for (let i = 0; i < 365; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      contributions[dateStr] = {
        hours: Math.random() > 0.6 ? Math.random() * 8 : 0,
        sessions: Math.random() > 0.6 ? Math.floor(Math.random() * 5) : 0,
        level: Math.random() > 0.6 ? Math.floor(Math.random() * 5) : 0,
      };
    }
    return contributions;
  };

  // Convert contribution data to weeks grid format
  const getContributionGrid = () => {
    const weeks = [];
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay() - 51 * 7); // Go back 52 weeks

    for (let w = 0; w < 52; w++) {
      const week = [];
      for (let d = 0; d < 7; d++) {
        const date = new Date(startOfWeek);
        date.setDate(startOfWeek.getDate() + w * 7 + d);
        const dateStr = date.toISOString().split('T')[0];
        const contribution = contributionData?.[dateStr];
        
        let level = 0;
        if (contribution) {
          const hours = contribution.hours || 0;
          if (hours > 0) level = 1;
          if (hours >= 1) level = 2;
          if (hours >= 3) level = 3;
          if (hours >= 5) level = 4;
        }
        
        week.push({
          date: dateStr,
          level,
          hours: contribution?.hours || 0,
        });
      }
      weeks.push(week);
    }
    return weeks;
  };

  const contributions = contributionData ? getContributionGrid() : [];
  
  const getColor = (level) => {
    if (level === 0) return 'bg-muted';
    if (level === 1) return 'bg-blue-900';
    if (level === 2) return 'bg-blue-700';
    if (level === 3) return 'bg-blue-500';
    if (level === 4) return 'bg-blue-400';
    return 'bg-blue-300';
  };

  const monthLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  if (loading) {
    return (
      <div className="w-full flex items-center justify-center py-12">
        <div className="w-8 h-8 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="w-full">
      <style>{`@keyframes glitter { 0% { transform: scale(1); filter: brightness(1); } 
      6% { transform: scale(1.15); filter: brightness(1.45); } 
      12% { transform: scale(1); filter: brightness(1); } 
      100% { transform: scale(1); filter: brightness(1); } }`}</style>
      <h3 className="text-lg font-semibold text-foreground mb-6">
        
        
      </h3>
      
      <div className="flex gap-2 items-start overflow-x-hidden pb-4">
        {/* Day labels */}
       

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
              {week.map((day, dayIdx) => {
                const animDuration = (Math.random() * 1 + 2).toFixed(2); // 2.00 - 3.00s
                const animDelay = (Math.random() * Number(animDuration)).toFixed(2);
                const squareStyle = day.level > 0 ? { animation: `glitter ${animDuration}s linear infinite`, animationDelay: `${animDelay}s` } : {};

                return (
                  <motion.div
                    key={`${weekIdx}-${dayIdx}`}
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: weekIdx * 0.01 + dayIdx * 0.003, duration: 0.3 }}
                    whileHover={{ scale: 1.2, rotate: 5 }}
                    className={`w-3 h-3 rounded-sm ${getColor(day.level)} cursor-pointer border border-border hover:border-blue-400 transition-all`}
                    style={squareStyle}
                    title={`${day.date}: ${day.hours.toFixed(1)}h coding`}
                  />
                );
              })}
            </motion.div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-3 mt-6 text-xs text-muted-foreground">
        <span>Less</span>
        <div className="flex gap-1">
          <div className="w-3 h-3 bg-muted rounded-sm" />
          <div className="w-3 h-3 bg-blue-300 rounded-sm" />
          <div className="w-3 h-3 bg-blue-500 rounded-sm" />
          <div className="w-3 h-3 bg-blue-700 rounded-sm" />
          <div className="w-3 h-3 bg-blue-900 rounded-sm" />
        </div>
        <span>More</span>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-3 gap-3 mt-8">
        <motion.div
          whileHover={{ y: -5 }}
          className="bg-card rounded-lg p-4 border border-border hover:border-blue-500/50 transition-all"
        >
          <p className="text-muted-foreground text-xs mb-1">Total Hours</p>
          <p className="text-2xl font-bold text-blue-500">
            {stats?.totalHours || 0}h
          </p>
          <p className="text-xs text-muted-foreground mt-2">This year</p>
        </motion.div>

        <motion.div
          whileHover={{ y: -5 }}
          className="bg-card rounded-lg p-4 border border-border hover:border-blue-500/50 transition-all"
        >
          <p className="text-muted-foreground text-xs mb-1">Active Days</p>
          <p className="text-2xl font-bold text-blue-500">
            {stats?.activeDays || 0}
          </p>
          <p className="text-xs text-muted-foreground mt-2">Days coded</p>
        </motion.div>

        <motion.div
          whileHover={{ y: -5 }}
          className="bg-card rounded-lg p-4 border border-border hover:border-blue-500/50 transition-all"
        >
          <p className="text-muted-foreground text-xs mb-1">Avg. Daily</p>
          <p className="text-2xl font-bold text-blue-500">
            {stats?.avgHoursPerDay || 0}h
          </p>
          <p className="text-xs text-muted-foreground mt-2">Per active day</p>
        </motion.div>
      </div>
    </div>
  );
}
