// Mock in-memory user storage
const mockUsers = {};

export async function POST(request) {
  try {
    const body = await request.json();
    const { email, provider, name } = body;

    if (!email || !provider) {
      return Response.json(
        { error: 'Email and provider are required' },
        { status: 400 }
      );
    }

    // Create or update user
    if (!mockUsers[email]) {
      mockUsers[email] = {
        _id: Math.random().toString(36).substr(2, 9),
        email,
        provider,
        name: name || email.split('@')[0],
        createdAt: new Date(),
        updatedAt: new Date(),
        stats: {
          longestStreak: 0,
          totalHours: 0,
          topLanguages: [],
          contributionData: {},
        },
      };
    } else {
      mockUsers[email].updatedAt = new Date();
    }

    return Response.json(mockUsers[email], { status: 201 });
  } catch (error) {
    console.error('Error creating/updating user:', error);
    return Response.json(
      { error: 'Failed to process user' },
      { status: 500 }
    );
  }
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');

    if (!email) {
      return Response.json(
        { error: 'Email parameter is required' },
        { status: 400 }
      );
    }

    const user = mockUsers[email];

    if (!user) {
      return Response.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return Response.json(user);
  } catch (error) {
    console.error('Error fetching user:', error);
    return Response.json(
      { error: 'Failed to fetch user' },
      { status: 500 }
    );
  }
}
