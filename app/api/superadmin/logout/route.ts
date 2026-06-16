import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { SUPERADMIN_COOKIE } from "@/lib/superadmin-auth"

export async function POST() {
  const cookieStore = await cookies()
  cookieStore.delete(SUPERADMIN_COOKIE)
  return NextResponse.json({ success: true })
}
