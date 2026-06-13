import { NextRequest, NextResponse } from "next/server"
import { getPublicProfile } from "@/lib/public-profile"

// GET /api/public/[username] - Public Cadence profile payload.
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const { username } = await params
    const result = await getPublicProfile(username)
    return NextResponse.json(result.body, { status: result.status })
  } catch (error) {
    console.error("Error fetching public profile:", error)
    return NextResponse.json({ error: "Failed to fetch profile" }, { status: 500 })
  }
}
