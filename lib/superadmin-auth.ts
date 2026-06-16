import crypto from "crypto"

export const SUPERADMIN_COOKIE = "cadence_superadmin"

const DEV_USERNAME = "cadence-admin"
const DEV_PASSWORD = "CadenceAdmin!2026"

export function getSuperadminCredentials() {
  const username = process.env.SUPERADMIN_USERNAME
  const password = process.env.SUPERADMIN_PASSWORD
  if (username && password) return { username, password }
  if (process.env.NODE_ENV !== "production") return { username: DEV_USERNAME, password: DEV_PASSWORD }
  return null
}

function getSecret() {
  const secret = process.env.SUPERADMIN_SESSION_SECRET || process.env.NEXTAUTH_SECRET
  if (secret) return secret
  if (process.env.NODE_ENV !== "production") return "cadence-superadmin-dev-secret"
  return null
}

function sign(payload: string) {
  const secret = getSecret()
  if (!secret) return null
  return crypto.createHmac("sha256", secret).update(payload).digest("hex")
}

export function createSuperadminToken(username: string) {
  const expires = Date.now() + 8 * 60 * 60 * 1000
  const payload = `${username}.${expires}`
  const signature = sign(payload)
  if (!signature) return null
  return `${payload}.${signature}`
}

export function verifySuperadminToken(token?: string | null) {
  if (!token) return false
  const parts = token.split(".")
  if (parts.length !== 3) return false
  const [username, expiresRaw, signature] = parts
  const expires = Number(expiresRaw)
  if (!username || !Number.isFinite(expires) || expires < Date.now()) return false
  const expected = sign(`${username}.${expiresRaw}`)
  if (!expected || expected.length !== signature.length) return false
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))
}

export function getSuperadminTestCredentials() {
  return { username: DEV_USERNAME, password: DEV_PASSWORD }
}
