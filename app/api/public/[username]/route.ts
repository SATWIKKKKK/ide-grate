import { NextRequest, NextResponse } from "next/server"
import { getPublicProfile } from "@/lib/public-profile"
import { validateIdeParam } from "@/lib/ide-config"

// GET /api/public/[username] - Public Cadence profile payload.
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const { username } = await params
    const { searchParams } = new URL(request.url)
    const requestedIde = searchParams.get("ide")
    const ide = validateIdeParam(requestedIde)
    if (requestedIde && !ide) {
      return NextResponse.json({ error: "Unsupported IDE" }, { status: 400 })
    }
    const result = await getPublicProfile(username, ide)
    return NextResponse.json(result.body, { status: result.status })
  } catch (error) {
    console.error("Error fetching public profile:", error)
    return NextResponse.json({ error: "Failed to fetch profile" }, { status: 500 })
  }
}
