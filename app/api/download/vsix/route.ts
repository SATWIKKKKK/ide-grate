import { NextRequest, NextResponse } from "next/server"
import { readFile } from "fs/promises"
import { join } from "path"

// GET /api/download/vsix - Serve the VSIX extension file
export async function GET(request: NextRequest) {
  // If a direct VSIX URL is configured via env, redirect there
  const vsixUrl = process.env.VSIX_DOWNLOAD_URL
  if (vsixUrl) {
    return NextResponse.redirect(vsixUrl)
  }

  // Try to serve from public folder directly with proper headers
  try {
    const filePath = join(process.cwd(), 'public', 'downloads', 'cadence.vsix')
    const fileBuffer = await readFile(filePath)
    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': 'application/octet-stream',
        'Content-Disposition': 'attachment; filename="cadence.vsix"',
        'Content-Length': fileBuffer.length.toString(),
      },
    })
  } catch {
    // Fallback: redirect to GitHub releases
    return NextResponse.redirect(
      'https://github.com/SATWIKKKKK/ide-grate/raw/main/public/downloads/cadence.vsix'
    )
  }
}
