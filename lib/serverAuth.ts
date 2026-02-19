import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"

// Returns the session user or null when unauthenticated
export async function getServerUser() {
  const session = await getServerSession(authOptions)
  return session?.user ?? null
}

// Helper that returns user or null for API handlers
export async function requireServerUser() {
  const user = await getServerUser()
  if (!user) return null
  return user
}
