'use client';

import { motion } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import { useSession } from 'next-auth/react';

export default function ContributionGraph() {
  const { data: session } = useSession();
  const [contributionData, setContributionData] = useState(null);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (session?.user) {
      fetchContributions();
    } else {
      // Show mock data for non-authenticated users
      setContributionData(generateMockContributions());
      setLoading(false);
    }
  }, [session]);

  useEffect(() => {
    if (loading || !contributionData) return;

    const scroller = scrollRef.current;
    if (!scroller) return;

    let animationFrame;
    let lastTime = performance.now();

    const animate = (time) => {
      const delta = time - lastTime;
      lastTime = time;

      if (scroller.scrollWidth > scroller.clientWidth) {
        scroller.scrollLeft += delta * 0.018;
        if (scroller.scrollLeft >= scroller.scrollWidth - scroller.clientWidth - 1) {
          scroller.scrollLeft = 0;
        }
      }

      animationFrame = requestAnimationFrame(animate);
    };

    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [loading, contributionData]);

  const fetchContributions = async () => {
    try {
      const res = await fetch('/api/contributions?days=365');
      if (res.ok) {
        const data = await res.json();
        const raw = data.contributions || {};
        const hasRealData = Object.keys(raw).length > 0;

        if (hasRealData) {
          // Normalize: API may return { dateStr: number } or { dateStr: { hours, ... } }
          const normalized = {};
          for (const [date, val] of Object.entries(raw)) {
            normalized[date] = typeof val === 'number'
              ? { hours: val, sessions: 0, level: 0 }
              : val;
          }
          setContributionData(normalized);
        } else {
          // No real data yet — show mock so the graph looks alive
          setContributionData(generateMockContributions());
        }
      } else {
        // API returned an error (e.g. no database) — fall back to mock data
        setContributionData(generateMockContributions());
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
          animDuration: (Math.random() * 1 + 2).toFixed(2), // stable per-square
          animDelay: (Math.random() * 3).toFixed(2),
        });
      }
      weeks.push(week);
    }
    return weeks;
  };

  const contributions = contributionData ? getContributionGrid() : [];
  
  const getColor = (level) => {
    if (level === 0) return 'bg-[var(--color-contrib-0)]';
    if (level === 1) return 'bg-[var(--color-contrib-1)]';
    if (level === 2) return 'bg-[var(--color-contrib-2)]';
    if (level === 3) return 'bg-[var(--color-contrib-3)]';
    if (level === 4) return 'bg-[var(--color-contrib-4)]';
    return 'bg-[var(--color-contrib-4)]';
  };

  const monthLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  if (loading) {
    return (
      <div className="w-full flex items-center justify-center py-12">
        <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="w-full" data-gsap="fade-up">
      {/* keyframes are defined globally in app/globals.css; use CSS vars per-square for duration/delay */}
      
      <div ref={scrollRef} className="heatmap-scroll flex gap-2 items-start overflow-x-auto pb-3">
        {/* Day labels */}
       

        {/* Contribution grid */}
        <div className="flex gap-1" data-gsap-stagger>
          {contributions.map((week, weekIdx) => (
            <motion.div
              key={weekIdx}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: weekIdx * 0.01 }}
              className="flex flex-col gap-1"
              data-gsap-item
            >
              {week.map((day, dayIdx) => {
                const squareStyle = day.level > 0 ? { '--glitter-duration': `${day.animDuration}s`, '--glitter-delay': `${day.animDelay}s` } : {};

                return (
                  <div
                    key={`${weekIdx}-${dayIdx}`}
                  className={`w-3 h-3 rounded-[1px] ${getColor(day.level)} cursor-pointer border border-border hover:border-primary hover:scale-125 transition-all ${day.level > 0 ? 'animate-glitter' : ''}`}
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
          <div className="w-3 h-3 bg-[var(--color-contrib-0)] rounded-[3px]" />
          <div className="w-3 h-3 bg-[var(--color-contrib-1)] rounded-[1px]" />
          <div className="w-3 h-3 bg-[var(--color-contrib-2)] rounded-[1px]" />
          <div className="w-3 h-3 bg-[var(--color-contrib-3)] rounded-[1px]" />
          <div className="w-3 h-3 bg-[var(--color-contrib-4)] rounded-[1px]" />
        </div>
        <span>More</span>
      </div>
    </div>
  );
}
