import type React from "react"
import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import { Analytics } from "@vercel/analytics/next"
import { ThemeProvider } from "@/components/theme-provider"
import { Suspense } from "react"
import { SessionProvider } from "@/components/providers/session-provider"
import { auth } from "@/auth"
import "./globals.css"

export const metadata: Metadata = {
  title: "DTG FieldLink - Maintenance Management System",
  description: "Professional ticket management system for fiber optic maintenance teams",
  generator: "v0.app",
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const session = await auth()

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable}`}>
        <SessionProvider session={session}>
          <Suspense fallback={null}>
            <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
              {children}
            </ThemeProvider>
          </Suspense>
        </SessionProvider>
        <Analytics />
      </body>
    </html>
  )
}
