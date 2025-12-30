import { NextResponse } from "next/server"
import { auth } from "@/auth"

const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL

if (!backendUrl) {
  throw new Error("BACKEND_URL is not defined. Add it to .env.local")
}

export async function POST(request: Request) {
  const session = await auth()

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { currentPassword, newPassword } = await request.json()

  if (!currentPassword || !newPassword) {
    return NextResponse.json({ error: "Current and new password are required" }, { status: 400 })
  }

  if (typeof newPassword !== "string" || newPassword.length < 8) {
    return NextResponse.json({ error: "New password must be at least 8 characters long" }, { status: 400 })
  }

  const response = await fetch(`${backendUrl}/auth/change-password`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      userId: session.user.id,
      currentPassword,
      newPassword,
    }),
  })

  const data = await response.json().catch(() => ({ error: "Unexpected response from server" }))

  return NextResponse.json(data, { status: response.status })
}
