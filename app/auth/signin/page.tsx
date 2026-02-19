'use client'

import { redirect } from 'next/navigation'

// Redirect to new login page
export default function SignInPage() {
  redirect('/login')
}
