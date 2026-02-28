import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl
    const token = req.nextauth.token

    // If user is authenticated and trying to access login/signup, redirect to dashboard
    if (token && (pathname === '/login' || pathname === '/signup')) {
      return NextResponse.redirect(new URL('/dashboard', req.url))
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl
        
        // Public routes that don't require authentication
        const publicRoutes = ['/', '/login', '/signup', '/auth/signin', '/auth/error', '/api/heartbeat']
        
        // Allow public routes
        if (publicRoutes.includes(pathname)) {
          return true
        }
        
        // Allow public profile pages
        if (pathname.startsWith('/u/')) {
          return true
        }
        
        // Allow public API routes (profile, widget, download, auth debug)
        if (pathname.startsWith('/api/profile/') || pathname.startsWith('/api/widget/')) {
          return true
        }

        // Allow download endpoint (VSIX download)
        if (pathname.startsWith('/api/download/')) {
          return true
        }

        // Allow debug endpoints (DB connectivity test)
        if (pathname.startsWith('/api/debug/')) {
          return true
        }
        
        // Allow API routes for heartbeat (extension needs this)
        if (pathname.startsWith('/api/heartbeat')) {
          return true
        }
        
        // Allow NextAuth API routes (includes /api/auth/debug)
        if (pathname.startsWith('/api/auth')) {
          return true
        }
        
        // All other routes require authentication
        return !!token
      },
    },
    pages: {
      signIn: '/login',
    },
  }
)

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder assets (images, icons, vsix files)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.svg$|.*\\.ico$|.*\\.vsix$).*)',
  ],
}
