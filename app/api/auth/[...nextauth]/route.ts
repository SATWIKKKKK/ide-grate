import NextAuth, { type AuthOptions } from "next-auth"
import GitHubProvider from "next-auth/providers/github"
import GoogleProvider from "next-auth/providers/google"
import CredentialsProvider from "next-auth/providers/credentials"
import { PrismaAdapter } from "@auth/prisma-adapter"
import type { Adapter } from "next-auth/adapters"
import prisma from "@/lib/prisma"
import crypto from "crypto"

// Check which OAuth credentials are configured
const hasGitHub = process.env.GITHUB_ID && process.env.GITHUB_SECRET
const hasGoogle = process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
const hasOAuthProviders = hasGitHub || hasGoogle

// Build providers array dynamically based on available credentials
const providers: any[] = []

if (hasGitHub) {
  providers.push(
    GitHubProvider({
      clientId: process.env.GITHUB_ID!,
      clientSecret: process.env.GITHUB_SECRET!,
      allowDangerousEmailAccountLinking: true,
    })
  )
}

if (hasGoogle) {
  providers.push(
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      allowDangerousEmailAccountLinking: true,
    })
  )
}

// Credentials provider for email/password auth (always enabled)
providers.push(
  CredentialsProvider({
    id: "credentials",
    name: "Email",
    credentials: {
      email: { label: "Email", type: "email" },
      password: { label: "Password", type: "password" },
      name: { label: "Name", type: "text" },
      isSignUp: { label: "Sign Up", type: "text" },
    },
    async authorize(credentials) {
      if (!credentials?.email) return null

      const { compare, hash } = await import("bcryptjs")

      // Sign Up flow
      if (credentials.isSignUp === "true") {
        if (!credentials.password || credentials.password.length < 8) return null

        const existing = await prisma.user.findUnique({
          where: { email: credentials.email },
        })
        if (existing) throw new Error("An account with this email already exists")

        const hashedPassword = await hash(credentials.password, 12)
        const user = await prisma.user.create({
          data: {
            email: credentials.email,
            name: credentials.name || credentials.email.split("@")[0],
            password: hashedPassword,
            apiKey: `vsi_${crypto.randomBytes(32).toString("hex")}`,
          },
        })

        // Create UserStats record for the new user
        await prisma.userStats.create({
          data: { userId: user.id },
        }).catch(() => {}) // ignore if already exists

        return { id: user.id, email: user.email, name: user.name, image: null }
      }

      // Sign In flow
      const user = await prisma.user.findUnique({
        where: { email: credentials.email },
      })
      if (!user) return null

      // If user has no password (OAuth-only account), allow linking
      if (!user.password) {
        if (!credentials.password) return null
        // Set password for OAuth user who wants to add email/password login
        const hashedPassword = await hash(credentials.password, 12)
        await prisma.user.update({
          where: { id: user.id },
          data: { password: hashedPassword },
        })
        return { id: user.id, email: user.email, name: user.name, image: user.image }
      }

      // Verify password
      const isValid = await compare(credentials.password, user.password)
      if (!isValid) return null

      return { id: user.id, email: user.email, name: user.name, image: user.image }
    },
  })
)

// Use adapter for OAuth providers
const useAdapter = hasOAuthProviders

export const authOptions: AuthOptions = {
  // Only use adapter when we have real OAuth providers
  ...(useAdapter ? { adapter: PrismaAdapter(prisma) as Adapter } : {}),
  providers,
  callbacks: {
    async jwt({ token, user, account }) {
      // Initial sign in
      if (user) {
        token.id = user.id
        token.email = user.email
        token.name = user.name
      }
      if (account) {
        token.accessToken = account.access_token
        token.provider = account.provider
      }
      return token
    },
    async session({ session, token }: { session: any; token: any }) {
      if (session.user) {
        session.user.id = token.id || token.sub
        session.user.provider = token.provider || "credentials"
      }
      session.accessToken = token.accessToken
      return session
    },
    async signIn({ user }: { user: any }) {
      try {
        // Create or update user stats on first sign in
        if (user?.id) {
          await prisma.userStats.upsert({
            where: { userId: user.id },
            update: {},
            create: {
              userId: user.id,
              longestStreak: 0,
              currentStreak: 0,
              totalHours: 0,
              totalSessions: 0,
            },
          })
        }
        return true
      } catch (error) {
        console.error("Error in signIn callback:", error)
        return true // Still allow sign in even if stats creation fails
      }
    },
    async redirect({ url, baseUrl }) {
      // If there's an explicit callback URL (e.g., from middleware), respect it
      if (url.startsWith("/") && url !== "/") return `${baseUrl}${url}`
      if (url.startsWith(baseUrl) && url !== baseUrl && url !== `${baseUrl}/`) return url

      // Default: redirect to /onboarding for new users, /dashboard for returning ones
      // The client-side onboarding page handles the actual check
      // We always send to /dashboard and let the dashboard redirect if needed
      return `${baseUrl}/dashboard`
    },
  },
  pages: {
    signIn: "/login",
    error: "/auth/error",
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === "development",
}

const handler = NextAuth(authOptions)
export { handler as GET, handler as POST }
