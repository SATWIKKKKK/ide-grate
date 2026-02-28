// Achievement definitions and evaluation logic

export interface Achievement {
  id: string;
  icon: string;
  title: string;
  description: string;
  condition: (stats: AchievementStats) => boolean;
}

export interface AchievementStats {
  totalSessions: number;
  totalHours: number;
  longestStreak: number;
  currentStreak: number;
  uniqueLanguages: number;
  hasEarlySession: boolean;  // before 7am
  hasLateSession: boolean;   // after midnight
  maxDayHours: number;
  activeDays: number;
}

export const ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first_session',
    icon: '🚀',
    title: 'First Session',
    description: 'Logged your first coding session',
    condition: (stats) => stats.totalSessions >= 1,
  },
  {
    id: 'week_streak',
    icon: '🔥',
    title: 'Week Warrior',
    description: '7 day coding streak',
    condition: (stats) => stats.longestStreak >= 7,
  },
  {
    id: 'month_streak',
    icon: '🌟',
    title: 'Monthly Master',
    description: '30 day coding streak',
    condition: (stats) => stats.longestStreak >= 30,
  },
  {
    id: 'hundred_hours',
    icon: '💯',
    title: 'Century Coder',
    description: '100 hours of coding',
    condition: (stats) => stats.totalHours >= 100,
  },
  {
    id: 'polyglot',
    icon: '🌐',
    title: 'Polyglot',
    description: 'Coded in 5+ languages',
    condition: (stats) => stats.uniqueLanguages >= 5,
  },
  {
    id: 'early_bird',
    icon: '🌅',
    title: 'Early Bird',
    description: 'Coded before 7am',
    condition: (stats) => stats.hasEarlySession,
  },
  {
    id: 'night_owl',
    icon: '🦉',
    title: 'Night Owl',
    description: 'Coded after midnight',
    condition: (stats) => stats.hasLateSession,
  },
  {
    id: 'marathon',
    icon: '🏃',
    title: 'Marathon Session',
    description: '6+ hours in one day',
    condition: (stats) => stats.maxDayHours >= 6,
  },
  {
    id: 'ten_days',
    icon: '📅',
    title: 'Consistency King',
    description: 'Active for 10+ days',
    condition: (stats) => stats.activeDays >= 10,
  },
  {
    id: 'thousand_hours',
    icon: '👑',
    title: 'Code Legend',
    description: '1000 hours of coding',
    condition: (stats) => stats.totalHours >= 1000,
  },
];

export function calculateProductivityScore(params: {
  hoursToday: number;
  streakDays: number;
  activeDaysThisWeek: number;
  avgSessionMinutes: number;
}): number {
  const factors = {
    hoursToday: Math.min(params.hoursToday / 4, 1) * 30,
    streakBonus: Math.min(params.streakDays / 30, 1) * 20,
    consistencyScore: (params.activeDaysThisWeek / 7) * 25,
    focusScore: Math.min(params.avgSessionMinutes / 60, 1) * 25,
  };
  return Math.round(Object.values(factors).reduce((s, v) => s + v, 0));
}
