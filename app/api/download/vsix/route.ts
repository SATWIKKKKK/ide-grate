import { NextRequest, NextResponse } from "next/server"

// GET /api/download/vsix - Redirect to the latest VSIX file
export async function GET(request: NextRequest) {
  // If a direct VSIX URL is configured, redirect there
  const vsixUrl = process.env.VSIX_DOWNLOAD_URL
  
  if (vsixUrl) {
    return NextResponse.redirect(vsixUrl)
  }

  // Default: redirect to GitHub releases page for manual download
  const githubReleasesUrl = "https://github.com/SATWIKKKKK/ide-grate/releases/latest"
  
  try {
    // Try to get the actual .vsix asset URL from GitHub API
    const res = await fetch(
      "https://api.github.com/repos/SATWIKKKKK/ide-grate/releases/latest",
      {
        headers: {
          Accept: "application/vnd.github.v3+json",
          ...(process.env.GITHUB_TOKEN ? { Authorization: `token ${process.env.GITHUB_TOKEN}` } : {}),
        },
        next: { revalidate: 300 }, // Cache for 5 minutes
      }
    )
    
    if (res.ok) {
      const release = await res.json()
      const vsixAsset = release.assets?.find(
        (a: any) => a.name.endsWith(".vsix")
      )
      if (vsixAsset?.browser_download_url) {
        return NextResponse.redirect(vsixAsset.browser_download_url)
      }
    }
  } catch {
    // Fall through to default
  }

  // Fallback: send to releases page
  return NextResponse.redirect(githubReleasesUrl)
}
