"use client"

import { FormEvent, useState, useEffect } from "react"
import { signOut, useSession } from "next-auth/react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { User, Mail, Phone, Camera } from "lucide-react"
import { useAdminId } from "@/hooks/useAdminId"

interface AdminProfile {
  id: number
  email: string
  name: string | null
  phone: string | null
  picture: string | null
  role: string
}

export default function AccountPage() {
  const { data: session } = useSession()
  const { adminId } = useAdminId()
  const [profile, setProfile] = useState<AdminProfile | null>(null)
  const [isLoadingProfile, setIsLoadingProfile] = useState(true)
  
  // Profile form
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [picture, setPicture] = useState("")
  
  // Password form
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        if (!adminId) return
        const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/admin-profile/${adminId}`)
        if (response.ok) {
          const data = await response.json()
          setProfile(data)
          setName(data.name || "")
          setEmail(data.email || "")
          setPhone(data.phone || "")
          setPicture(data.picture || "")
        }
      } catch (error) {
        console.error("Error fetching profile:", error)
      } finally {
        setIsLoadingProfile(false)
      }
    }

    fetchProfile()
  }, [])

  const handleProfileUpdate = async (e: FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)
    setSuccess(null)

    try {
      if (!adminId) return
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/admin-profile/${adminId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, email, phone, picture }),
      })

      if (response.ok) {
        const updatedProfile = await response.json()
        setProfile(updatedProfile)
        setSuccess("Profile updated successfully")
      } else {
        const result = await response.json()
        setError(result.error || "Failed to update profile")
      }
    } catch (error) {
      setError("Unexpected error occurred. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handlePasswordChange = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (isSubmitting) {
      return
    }

    if (newPassword !== confirmPassword) {
      setError("New passwords do not match")
      setSuccess(null)
      return
    }

    setIsSubmitting(true)
    setError(null)
    setSuccess(null)

    try {
      if (!adminId) return
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/admin-profile/${adminId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          name, 
          email, 
          phone, 
          picture,
          currentPassword, 
          newPassword 
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        setError(result.error ?? "Unable to change password")
        setIsSubmitting(false)
        return
      }

      setSuccess("Password updated. Redirecting to sign in...")
      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
      setIsSubmitting(false)

      setTimeout(() => {
        void signOut({ callbackUrl: "/" })
      }, 1500)
    } catch (err) {
      setError("Unexpected error occurred. Please try again.")
      setIsSubmitting(false)
    }
  }

  if (isLoadingProfile) {
    return (
      <div className="container mx-auto max-w-3xl py-12">
        <p className="text-center text-muted-foreground">Loading profile...</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto max-w-3xl py-12 space-y-6">
      {/* Profile Information */}
      <Card>
        <CardHeader>
          <CardTitle>Profile Information</CardTitle>
          <CardDescription>View and update your personal information.</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Current Profile Display - Table Layout */}
          {profile && (
            <div className="mb-8 space-y-4">
              <h3 className="text-lg font-semibold mb-4">Current Information</h3>
              <div className="space-y-3">
                <div className="flex border-b pb-3">
                  <div className="w-1/3 font-medium text-muted-foreground">Name</div>
                  <div className="w-2/3">{profile.name || "Not set"}</div>
                </div>
                <div className="flex border-b pb-3">
                  <div className="w-1/3 font-medium text-muted-foreground">Email</div>
                  <div className="w-2/3">{profile.email}</div>
                </div>
                <div className="flex border-b pb-3">
                  <div className="w-1/3 font-medium text-muted-foreground">Phone</div>
                  <div className="w-2/3">{profile.phone || "Not set"}</div>
                </div>
                <div className="flex border-b pb-3">
                  <div className="w-1/3 font-medium text-muted-foreground">Role</div>
                  <div className="w-2/3">{profile.role}</div>
                </div>
              </div>
              <Separator className="my-6" />
            </div>
          )}

          <form onSubmit={handleProfileUpdate} className="space-y-6">
            {/* Profile Picture */}
            <div className="flex items-center gap-6">
              <Avatar className="h-24 w-24">
                <AvatarImage src={picture || undefined} alt={name || "Admin"} />
                <AvatarFallback>
                  <User className="h-12 w-12" />
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-2">
                <Label htmlFor="picture">Profile Picture URL</Label>
                <div className="flex gap-2">
                  <Input
                    id="picture"
                    type="url"
                    placeholder="https://example.com/profile.jpg"
                    value={picture}
                    onChange={(e) => setPicture(e.target.value)}
                  />
                  <Camera className="w-4 h-4 text-muted-foreground mt-3" />
                </div>
              </div>
            </div>

            <Separator />

            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="name"
                  type="text"
                  placeholder="John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            {/* Phone */}
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+1 (555) 123-4567"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Role (Read-only) */}
            {profile && (
              <div className="space-y-2">
                <Label>Role</Label>
                <Input value={profile.role} disabled className="bg-muted" />
              </div>
            )}

            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting ? "Updating..." : "Update Profile"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Change Password */}
      <Card>
        <CardHeader>
          <CardTitle>Account Security</CardTitle>
          <CardDescription>Update your password to keep your account secure.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-6" onSubmit={handlePasswordChange}>
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Current password</Label>
              <Input
                id="currentPassword"
                type="password"
                value={currentPassword}
                onChange={(event) => setCurrentPassword(event.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="newPassword">New password</Label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                minLength={8}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm new password</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                minLength={8}
                required
              />
            </div>
            {error ? <p className="text-sm text-destructive">{error}</p> : null}
            {success ? <p className="text-sm text-green-600">{success}</p> : null}
            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting ? "Updating..." : "Update password"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
