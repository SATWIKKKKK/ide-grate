import { jwtVerify, SignJWT } from 'jose';

const secret = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-secret-key-here-change-in-production'
);

export async function verifyAuth(token) {
  try {
    const verified = await jwtVerify(token, secret);
    return verified.payload;
  } catch (err) {
    return null;
  }
}

export function generateTokenPayload(user) {
  return {
    email: user.email,
    id: user._id,
    provider: user.provider,
    name: user.name,
  };
}

export async function createAuthToken(payload) {
  // Create a signed JWT (HMAC-SHA256) with a 7 day expiry
  // payload should be a plain object containing claims (avoid large objects)
  const jwt = await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(secret);

  return jwt;
}

export function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export async function authenticateWithProvider(provider, token) {
  // Verify provider-specific tokens
  // This would call the actual provider's API to verify the token
  switch (provider) {
    case 'github':
      return await verifyGitHubToken(token);
    case 'microsoft':
      return await verifyMicrosoftToken(token);
    case 'vscode':
      return await verifyVSCodeToken(token);
    default:
      return null;
  }
}

async function verifyGitHubToken(token) {
  try {
    const response = await fetch('https://api.github.com/user', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    
    if (response.ok) {
      const user = await response.json();
      return {
        provider: 'github',
        email: user.email || `${user.login}@github.com`,
        name: user.name || user.login,
        id: user.id,
      };
    }
    return null;
  } catch (error) {
    console.error('GitHub token verification failed:', error);
    return null;
  }
}

async function verifyMicrosoftToken(token) {
  try {
    const response = await fetch('https://graph.microsoft.com/v1.0/me', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (response.ok) {
      const user = await response.json();
      return {
        provider: 'microsoft',
        email: user.userPrincipalName || user.mail,
        name: user.displayName,
        id: user.id,
      };
    }
    return null;
  } catch (error) {
    console.error('Microsoft token verification failed:', error);
    return null;
  }
}

async function verifyVSCodeToken(token) {
  // VS Code extension would send a specific token format
  // This is a simplified verification
  try {
    // In production, you'd verify this against Azure AD or GitHub
    return {
      provider: 'vscode',
      token: token,
    };
  } catch (error) {
    console.error('VS Code token verification failed:', error);
    return null;
  }
}
