import { NextRequest, NextResponse } from "next/server"

// GET /api/auth/debug - Debug endpoint showing which providers are configured
// Only available in development or when DEBUG_AUTH=true
export async function GET(request: NextRequest) {
  // Safety check: only allow in dev or with explicit env flag
  if (process.env.NODE_ENV === "production" && process.env.DEBUG_AUTH !== "true") {
    return NextResponse.json(
      { error: "Debug endpoint disabled in production. Set DEBUG_AUTH=true to enable." },
      { status: 403 }
    )
  }

  const providers = {
    github: {
      configured: !!(process.env.GITHUB_ID && process.env.GITHUB_SECRET),
      clientId: process.env.GITHUB_ID ? `${process.env.GITHUB_ID.substring(0, 4)}...` : null,
      hasSecret: !!process.env.GITHUB_SECRET,
    },
    google: {
      configured: !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
      clientId: process.env.GOOGLE_CLIENT_ID ? `${process.env.GOOGLE_CLIENT_ID.substring(0, 8)}...` : null,
      hasSecret: !!process.env.GOOGLE_CLIENT_SECRET,
    },
    microsoft: {
      configured: !!(process.env.AZURE_AD_CLIENT_ID && process.env.AZURE_AD_CLIENT_SECRET),
      clientId: process.env.AZURE_AD_CLIENT_ID ? `${process.env.AZURE_AD_CLIENT_ID.substring(0, 8)}...` : null,
      hasSecret: !!process.env.AZURE_AD_CLIENT_SECRET,
      tenantId: process.env.AZURE_AD_TENANT_ID || "common (default)",
    },
    devLogin: {
      enabled: !!(
        (!process.env.GITHUB_ID && !process.env.GOOGLE_CLIENT_ID && !process.env.AZURE_AD_CLIENT_ID) ||
        process.env.ENABLE_DEV_LOGIN === "true"
      ),
    },
  }

  const config = {
    nextauthUrl: process.env.NEXTAUTH_URL || "(not set)",
    hasSecret: !!process.env.NEXTAUTH_SECRET,
    nodeEnv: process.env.NODE_ENV,
    databaseConfigured: !!process.env.DATABASE_URL,
  }

  return NextResponse.json({
    providers,
    config,
    timestamp: new Date().toISOString(),
  })
}
