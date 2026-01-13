import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"

const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL

if (!backendUrl) {
  throw new Error("BACKEND_URL is not set. Please define it in .env.local")
}

export const {
  handlers: { GET, POST },
  auth,
  signIn,
  signOut,
} = NextAuth({
  session: {
    strategy: "jwt",
  },
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const response = await fetch(`${backendUrl}/auth/login`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: credentials.email,
            password: credentials.password,
          }),
        })

        if (!response.ok) {
          return null
        }

        const user = await response.json()

        if (!user) {
          return null
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        }
      },
    }),
  ],
  pages: {
    signIn: "/",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = user.role
        token.name = user.name
        token.email = user.email
      }
      return token
    },
    async session({ session, token }) {
      if (!session.user) {
        return session
      }

      return {
        ...session,
        user: {
          ...session.user,
          id: token.id as string | number | undefined,
          role: token.role as string | undefined,
          name: token.name as string | undefined,
          email: token.email as string | undefined,
        },
      }
    },
  },
})
