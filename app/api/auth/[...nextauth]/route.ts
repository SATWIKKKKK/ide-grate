import NextAuth, { type AuthOptions } from "next-auth"
import GitHubProvider from "next-auth/providers/github"
import AzureADProvider from "next-auth/providers/azure-ad"
import { PrismaAdapter } from "@auth/prisma-adapter"
import type { Adapter } from "next-auth/adapters"
import prisma from "@/lib/prisma"

export const authOptions: AuthOptions = {
  adapter: PrismaAdapter(prisma) as Adapter,
  providers: [
    GitHubProvider({
      clientId: process.env.GITHUB_ID!,
      clientSecret: process.env.GITHUB_SECRET!,
    }),
    AzureADProvider({
      clientId: process.env.MICROSOFT_CLIENT_ID!,
      clientSecret: process.env.MICROSOFT_CLIENT_SECRET!,
      tenantId: "common", // Allow any Microsoft account
    }),
  ],
  callbacks: {
    async session({ session, user }: { session: any; user: any }) {
      if (session.user) {
        session.user.id = user.id
      }
      return session
    },
    async signIn({ user, account }: { user: any; account: any }) {
      // Create or update user stats on first sign in
      if (user.id) {
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
    },
  },
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },
  session: {
    strategy: "database" as const,
  },
  secret: process.env.NEXTAUTH_SECRET,
}

const handler = NextAuth(authOptions)
export { handler as GET, handler as POST }
