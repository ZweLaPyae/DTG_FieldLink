import NextAuth from "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      id?: number | string
      name?: string | null
      email?: string | null
      role?: string | null
    }
  }

  interface User {
    id: number | string
    name?: string | null
    email: string
    role?: string | null
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: number | string
    role?: string | null
    name?: string | null
    email?: string | null
  }
}
