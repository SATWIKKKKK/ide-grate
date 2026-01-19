function getContributionData(activities) {
  const contributions = {};
  for (let w = 0; w < 52; w++) {
    contributions[w] = [0, 0, 0, 0, 0, 0, 0];
  }

  const now = new Date();
  const startOfYear = new Date(now.getFullYear(), 0, 1);

  activities.forEach((activity) => {
    const date = new Date(activity.startTime);
    const dayOfYear = Math.floor((date - startOfYear) / (1000 * 60 * 60 * 24));
    const weekNumber = Math.floor(dayOfYear / 7);
    const dayOfWeek = date.getDay();

    if (weekNumber < 52) {
      const durationInHours = activity.duration / 60;
      contributions[weekNumber][dayOfWeek] = Math.min(
        Math.round(contributions[weekNumber][dayOfWeek] + durationInHours), 5
      );
    }
  });

  return contributions;
}

function getMonthlyBreakdown(activities) {
  const monthlyData = {};
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  activities.forEach((activity) => {
    const date = new Date(activity.startTime);
    const month = monthNames[date.getMonth()];
    const year = date.getFullYear();
    const key = `${month} ${year}`;
    monthlyData[key] = (monthlyData[key] || 0) + activity.duration;
  });

  return monthlyData;
}

// Mock contributions data
let mockContributionsData = {};

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');
    const timeRange = searchParams.get('range') || 'year';

    if (!email) {
      return Response.json({ error: 'Email parameter is required' }, { status: 400 });
    }

    // Generate mock data if not exists
    if (!mockContributionsData[email]) {
      mockContributionsData[email] = generateMockContributions(email);
    }

    const activities = mockContributionsData[email];
    const contributionData = getContributionData(activities);
    const monthlyBreakdown = getMonthlyBreakdown(activities);

    const totalMinutes = activities.reduce((sum, a) => sum + a.duration, 0);
    const days = new Set(activities.map((a) => new Date(a.startTime).toDateString())).size;
    const averagePerDay = days > 0 ? Math.round(totalMinutes / days / 60 * 100) / 100 : 0;

    return Response.json({
      timeRange,
      contributionData,
      monthlyBreakdown,
      stats: {
        totalMinutes,
        totalHours: Math.round(totalMinutes / 60),
        daysActive: days,
        averageHoursPerDay: averagePerDay,
        totalSessions: activities.length,
      },
    });
  } catch (error) {
    console.error('Error fetching contributions:', error);
    return Response.json({ error: 'Failed to fetch contribution data' }, { status: 500 });
  }
}

function generateMockContributions(email) {
  const activities = [];
  for (let i = 0; i < 365; i++) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const sessionsPerDay = Math.random() > 0.3 ? Math.floor(Math.random() * 4) + 1 : 0;
    
    for (let j = 0; j < sessionsPerDay; j++) {
      activities.push({
        email,
        startTime: new Date(date.getTime() + Math.random() * 86400000),
        duration: Math.floor(Math.random() * 240) + 30,
      });
    }
  }
  return activities;
}
