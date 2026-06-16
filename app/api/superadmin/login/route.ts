import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { SUPERADMIN_COOKIE, createSuperadminToken, getSuperadminCredentials } from "@/lib/superadmin-auth"

export async function POST(request: Request) {
  const credentials = getSuperadminCredentials()
  if (!credentials) {
    return NextResponse.json({ error: "Superadmin credentials are not configured" }, { status: 503 })
  }

  const body = await request.json().catch(() => ({}))
  const username = typeof body.username === "string" ? body.username : ""
  const password = typeof body.password === "string" ? body.password : ""
  if (username !== credentials.username || password !== credentials.password) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
  }

  const token = createSuperadminToken(username)
  if (!token) {
    return NextResponse.json({ error: "Superadmin session secret is not configured" }, { status: 503 })
  }

  const cookieStore = await cookies()
  cookieStore.set(SUPERADMIN_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 8 * 60 * 60,
  })

  return NextResponse.json({ success: true })
}
