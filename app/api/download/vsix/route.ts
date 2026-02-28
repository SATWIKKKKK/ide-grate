import { NextRequest, NextResponse } from "next/server"

// GET /api/download/vsix - Redirect to the VSIX file for download
export async function GET(request: NextRequest) {
  // If a direct VSIX URL is configured via env, redirect there
  const vsixUrl = process.env.VSIX_DOWNLOAD_URL
  if (vsixUrl) {
    return NextResponse.redirect(vsixUrl)
  }

  // Default: serve from our public folder (bundled with the app)
  const origin = request.nextUrl.origin
  return NextResponse.redirect(`${origin}/vs-integrate-tracker.vsix`)
}
