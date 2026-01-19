// Mock in-memory activities storage
const mockActivities = [];

export async function POST(request) {
  try {
    const body = await request.json();
    const { email, userId, startTime, endTime, duration, language, fileType, extensions, idleTime } = body;

    if (!email || !startTime || !duration) {
      return Response.json(
        { error: 'Email, startTime, and duration are required' },
        { status: 400 }
      );
    }

    const activity = {
      _id: Math.random().toString(36).substr(2, 9),
      email,
      userId,
      startTime: new Date(startTime),
      endTime: new Date(endTime || new Date()),
      duration,
      language: language || 'Unknown',
      fileType: fileType || 'Unknown',
      extensions: extensions || [],
      idleTime: idleTime || 0,
      createdAt: new Date(),
    };

    mockActivities.push(activity);
    return Response.json(activity, { status: 201 });
  } catch (error) {
    console.error('Error logging activity:', error);
    return Response.json(
      { error: 'Failed to log activity' },
      { status: 500 }
    );
  }
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');
    const days = parseInt(searchParams.get('days') || '30');

    if (!email) {
      return Response.json(
        { error: 'Email parameter is required' },
        { status: 400 }
      );
    }

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const activities = mockActivities
      .filter(a => a.email === email && new Date(a.startTime) >= startDate)
      .sort((a, b) => new Date(b.startTime) - new Date(a.startTime));

    return Response.json(activities);
  } catch (error) {
    console.error('Error fetching activities:', error);
    return Response.json(
      { error: 'Failed to fetch activities' },
      { status: 500 }
    );
  }
}
