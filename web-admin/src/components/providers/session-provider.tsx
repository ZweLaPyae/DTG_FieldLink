"use client"

import type { ReactNode } from "react"
import type { Session } from "next-auth"
import { SessionProvider as NextAuthProvider } from "next-auth/react"

type SessionProviderProps = {
  children: ReactNode
  session?: Session | null
}

export function SessionProvider({ children, session }: SessionProviderProps) {
  return <NextAuthProvider session={session}>{children}</NextAuthProvider>
}
