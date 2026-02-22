import { useSession } from "next-auth/react"

/**
 * Hook to get the current admin user ID from the session
 * @returns An object with the admin user ID and loading state
 */
export function useAdminId(): { adminId: number | null; isLoading: boolean } {
  const { data: session, status } = useSession()
  
  const isLoading = status === "loading"
  const adminId = session?.user?.id 
    ? typeof session.user.id === 'number' 
      ? session.user.id 
      : parseInt(session.user.id)
    : null
  
  return { adminId, isLoading }
}
