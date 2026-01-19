// Mock analytics calculations
function calculateStreak(activities) {
  if (!activities.length) return 0;
  activities.sort((a, b) => new Date(b.startTime) - new Date(a.startTime));

  let streak = 0;
  let currentDate = new Date();
  currentDate.setHours(0, 0, 0, 0);

  for (const activity of activities) {
    const activityDate = new Date(activity.startTime);
    activityDate.setHours(0, 0, 0, 0);
    const dayDiff = Math.floor((currentDate - activityDate) / (1000 * 60 * 60 * 24));
    
    if (dayDiff === streak) {
      streak++;
      currentDate.setDate(currentDate.getDate() - 1);
    } else if (dayDiff > streak) {
      break;
    }
  }
  return streak;
}

function getMostProductiveHour(activities) {
  const hourCounts = {};
  activities.forEach((activity) => {
    const hour = new Date(activity.startTime).getHours();
    hourCounts[hour] = (hourCounts[hour] || 0) + activity.duration;
  });

  let maxHour = 0, maxDuration = 0;
  for (const [hour, duration] of Object.entries(hourCounts)) {
    if (duration > maxDuration) { maxDuration = duration; maxHour = hour; }
  }
  return maxHour;
}

function getMostProductiveDay(activities) {
  const dayCounts = {}, dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  activities.forEach((activity) => {
    const dayIdx = new Date(activity.startTime).getDay();
    const dayName = dayNames[dayIdx];
    dayCounts[dayName] = (dayCounts[dayName] || 0) + activity.duration;
  });

  let maxDay = 'Monday', maxDuration = 0;
  for (const [day, duration] of Object.entries(dayCounts)) {
    if (duration > maxDuration) { maxDuration = duration; maxDay = day; }
  }
  return maxDay;
}

function getAverageSessionDuration(activities) {
  if (!activities.length) return 0;
  const totalDuration = activities.reduce((sum, a) => sum + a.duration, 0);
  return Math.round(totalDuration / activities.length);
}

// Mock activities data from module scope (shared across requests)
let mockAnalyticsData = {};

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');
    const days = parseInt(searchParams.get('days') || '30');

    if (!email) {
      return Response.json({ error: 'Email parameter is required' }, { status: 400 });
    }

    // Generate mock data if not exists
    if (!mockAnalyticsData[email]) {
      mockAnalyticsData[email] = generateMockActivities(email, days);
    }

    const activities = mockAnalyticsData[email];
    const totalHours = Math.round(activities.reduce((sum, a) => sum + a.duration, 0) / 60);
    const streak = calculateStreak(activities);
    const mostProductiveHour = getMostProductiveHour(activities);
    const mostProductiveDay = getMostProductiveDay(activities);
    const avgSession = getAverageSessionDuration(activities);

    const languageBreakdown = {};
    activities.forEach((activity) => {
      const lang = activity.language || 'Unknown';
      languageBreakdown[lang] = (languageBreakdown[lang] || 0) + activity.duration;
    });

    const topLanguages = Object.entries(languageBreakdown)
      .map(([language, duration]) => ({
        language,
        duration: Math.round(duration),
        percentage: Math.round((duration / activities.reduce((sum, a) => sum + a.duration, 0)) * 100),
      }))
      .sort((a, b) => b.duration - a.duration)
      .slice(0, 5);

    const timeline = {};
    activities.forEach((activity) => {
      const date = new Date(activity.startTime).toISOString().split('T')[0];
      timeline[date] = (timeline[date] || 0) + activity.duration;
    });

    return Response.json({
      totalHours,
      streak,
      mostProductiveHour: `${mostProductiveHour}:00`,
      mostProductiveDay,
      averageSessionDuration: `${Math.floor(avgSession / 60)}h ${avgSession % 60}m`,
      sessionCount: activities.length,
      topLanguages,
      timeline,
      activityCount: activities.length,
    });
  } catch (error) {
    console.error('Error calculating analytics:', error);
    return Response.json({ error: 'Failed to calculate analytics' }, { status: 500 });
  }
}

function generateMockActivities(email, days) {
  const activities = [];
  const languages = ['JavaScript', 'Python', 'TypeScript', 'React', 'Node.js'];
  
  for (let i = 0; i < days; i++) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const sessionsPerDay = Math.random() > 0.3 ? Math.floor(Math.random() * 4) + 1 : 0;
    
    for (let j = 0; j < sessionsPerDay; j++) {
      activities.push({
        _id: Math.random().toString(36).substr(2, 9),
        email,
        startTime: new Date(date.getTime() + Math.random() * 86400000),
        duration: Math.floor(Math.random() * 240) + 30,
        language: languages[Math.floor(Math.random() * languages.length)],
        fileType: 'js',
      });
    }
  }
  return activities;
}
