import NextAuth, { type AuthOptions } from "next-auth"
import GitHubProvider from "next-auth/providers/github"
import GoogleProvider from "next-auth/providers/google"
import AzureADProvider from "next-auth/providers/azure-ad"
import CredentialsProvider from "next-auth/providers/credentials"
import { PrismaAdapter } from "@auth/prisma-adapter"
import type { Adapter } from "next-auth/adapters"
import prisma from "@/lib/prisma"
import crypto from "crypto"

// Check which OAuth credentials are configured
const hasGitHub = process.env.GITHUB_ID && process.env.GITHUB_SECRET
const hasGoogle = process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
const hasMicrosoft = process.env.MICROSOFT_CLIENT_ID && process.env.MICROSOFT_CLIENT_SECRET
const hasOAuthProviders = hasGitHub || hasGoogle || hasMicrosoft

// Build providers array dynamically based on available credentials
const providers: any[] = []

if (hasGitHub) {
  providers.push(
    GitHubProvider({
      clientId: process.env.GITHUB_ID!,
      clientSecret: process.env.GITHUB_SECRET!,
    })
  )
}

if (hasGoogle) {
  providers.push(
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    })
  )
}

if (hasMicrosoft) {
  providers.push(
    AzureADProvider({
      clientId: process.env.MICROSOFT_CLIENT_ID!,
      clientSecret: process.env.MICROSOFT_CLIENT_SECRET!,
      tenantId: "common",
    })
  )
}

// Add Credentials provider for development/demo mode when no OAuth is configured
if (!hasOAuthProviders || process.env.ENABLE_DEV_LOGIN === "true") {
  providers.push(
    CredentialsProvider({
      id: "dev-login",
      name: "Development Login",
      credentials: {
        email: { label: "Email", type: "email", placeholder: "dev@example.com" },
        name: { label: "Name", type: "text", placeholder: "Developer" },
      },
      async authorize(credentials) {
        if (!credentials?.email) return null
        
        // Find or create user
        let user = await prisma.user.findUnique({
          where: { email: credentials.email },
        })
        
        if (!user) {
          user = await prisma.user.create({
            data: {
              email: credentials.email,
              name: credentials.name || "Developer",
              apiKey: `vsi_${crypto.randomBytes(32).toString("hex")}`,
            },
          })
        }
        
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: null,
        }
      },
    })
  )
}

// Use adapter only for OAuth providers (not credentials)
const useAdapter = hasOAuthProviders && !process.env.ENABLE_DEV_LOGIN

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
      // Always redirect to dashboard after sign in
      if (url.startsWith("/")) return `${baseUrl}${url}`
      if (url.startsWith(baseUrl)) return url
      return `${baseUrl}/dashboard`
    },
  },
  pages: {
    signIn: "/auth/signin",
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
