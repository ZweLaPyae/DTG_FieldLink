import { ReactNode } from "react"
import { redirect } from "next/navigation"
import { auth } from "@/auth"

export default async function AccountLayout({
  children,
}: {
  children: ReactNode
}) {
  const session = await auth()

  if (!session?.user) {
    redirect("/")
  }

  return <>{children}</>
}
