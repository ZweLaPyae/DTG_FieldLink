"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useState, useEffect } from "react"
import { Archive, Calendar, User, Activity, RefreshCw, Mail, Phone, Shield, Edit2, Save, X, Camera } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useAdminId } from "@/hooks/useAdminId"

interface AdminLog {
  id: number
  action: string
  description: string | null
  metadata: any
  createdAt: string
  adminUser: {
    id: number
    name: string | null
    email: string
  }
}

interface AdminProfile {
  id: number
  email: string
  name: string | null
  role: string
  phone: string | null
  picture: string | null
  createdAt: string
  updatedAt: string
}

export default function AdminManagementPage() {
  const { adminId, isLoading: isAdminLoading } = useAdminId()
  // Logs state
  const [logs, setLogs] = useState<AdminLog[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showArchive, setShowArchive] = useState(false)
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  // Profile state
  const [profile, setProfile] = useState<AdminProfile | null>(null)
  const [isEditingProfile, setIsEditingProfile] = useState(false)
  const [profileForm, setProfileForm] = useState({
    name: "",
    email: "",
    phone: "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  })
  const [isSaving, setIsSaving] = useState(false)
  const [pictureFile, setPictureFile] = useState<File | null>(null)
  const [picturePreview, setPicturePreview] = useState<string | null>(null)

  const fetchLogs = async (filterDates = false) => {
    try {
      setIsLoading(true)
      let url = `${process.env.NEXT_PUBLIC_BACKEND_URL}/admin-logs?page=${page}&limit=50`
      
      if (filterDates && startDate) {
        url += `&startDate=${startDate}`
      }
      if (filterDates && endDate) {
        url += `&endDate=${endDate}`
      }

      const response = await fetch(url)
      if (response.ok) {
        const data = await response.json()
        setLogs(data.logs)
        setTotalPages(data.pagination.totalPages)
      }
    } catch (error) {
      console.error("Error fetching admin logs:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchAdminProfile = async () => {
    try {
      if (!adminId) return
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/admin-profile/${adminId}`)
      if (response.ok) {
        const data = await response.json()
        setProfile(data)
        setProfileForm({
          name: data.name || "",
          email: data.email || "",
          phone: data.phone || "",
          currentPassword: "",
          newPassword: "",
          confirmPassword: ""
        })
      }
    } catch (error) {
      console.error("Error fetching admin profile:", error)
    }
  }

  const handlePictureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setPictureFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setPicturePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSaveProfile = async () => {
    if (!profile) return

    // Validate password change if new password entered
    if (profileForm.newPassword) {
      if (!profileForm.currentPassword) {
        alert("Please enter your current password to change it")
        return
      }
      if (profileForm.newPassword !== profileForm.confirmPassword) {
        alert("New passwords do not match")
        return
      }
      if (profileForm.newPassword.length < 6) {
        alert("New password must be at least 6 characters")
        return
      }
    }

    try {
      setIsSaving(true)
      
      let pictureUrl = profile.picture

      // Upload picture if changed
      if (pictureFile) {
        // Get file extension
        const fileName = pictureFile.name
        const fileExtension = fileName.split('.').pop()?.toLowerCase()
        
        if (!fileExtension || !['jpg', 'jpeg', 'png', 'heic'].includes(fileExtension)) {
          alert("Invalid file type. Only JPG, PNG, and HEIC images are allowed.")
          setIsSaving(false)
          return
        }

        // Step 1: Get pre-signed URL from backend
        const signedUrlResponse = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/upload/admin-profile-url`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            adminId: profile.id,
            fileExtension: fileExtension,
          }),
        })

        if (!signedUrlResponse.ok) {
          const error = await signedUrlResponse.json()
          alert(`Failed to get upload URL: ${error.error || 'Unknown error'}`)
          setIsSaving(false)
          return
        }

        const { uploadUrl, cdnUrl } = await signedUrlResponse.json()

        // Step 2: Upload file directly to DigitalOcean Spaces
        const uploadResponse = await fetch(uploadUrl, {
          method: 'PUT',
          headers: {
            'Content-Type': pictureFile.type,
            'x-amz-acl': 'public-read',
          },
          body: pictureFile,
        })

        if (!uploadResponse.ok) {
          alert("Failed to upload picture to storage")
          setIsSaving(false)
          return
        }

        // Use the CDN URL
        pictureUrl = cdnUrl
      }

      const updateData: any = {
        name: profileForm.name,
        email: profileForm.email,
        phone: profileForm.phone,
        picture: pictureUrl,
      }

      if (profileForm.newPassword) {
        updateData.currentPassword = profileForm.currentPassword
        updateData.newPassword = profileForm.newPassword
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/admin-profile/${profile.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      })

      if (response.ok) {
        const updatedProfile = await response.json()
        setProfile(updatedProfile)
        setIsEditingProfile(false)
        setPictureFile(null)
        setPicturePreview(null)
        setProfileForm({
          ...profileForm,
          currentPassword: "",
          newPassword: "",
          confirmPassword: ""
        })
        alert("Profile updated successfully!")
      } else {
        const error = await response.json()
        alert(`Failed to update profile: ${error.error}`)
      }
    } catch (error) {
      console.error("Error updating profile:", error)
      alert("Failed to update profile")
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancelEdit = () => {
    if (profile) {
      setProfileForm({
        name: profile.name || "",
        email: profile.email || "",
        phone: profile.phone || "",
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
      })
    }
    setPictureFile(null)
    setPicturePreview(null)
    setIsEditingProfile(false)
  }

  useEffect(() => {
    // Wait until adminId is available before fetching profile/logs
    if (!adminId || isAdminLoading) return
    fetchLogs()
    fetchAdminProfile()
  }, [page, adminId, isAdminLoading])

  const handleArchiveSearch = () => {
    setPage(1)
    fetchLogs(true)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      timeZone: 'Asia/Yangon',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    })
  }

  if (isAdminLoading) {
    return (
      <DashboardLayout>
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">Loading admin session...</CardContent>
        </Card>
      </DashboardLayout>
    )
  }

  if (!adminId) {
    return (
      <DashboardLayout>
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            Admin session not found. Please sign in again.
          </CardContent>
        </Card>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Admin Management</h1>
          <p className="text-muted-foreground">Manage your profile and view activity logs.</p>
        </div>

        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="logs">Activity Logs</TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile" className="space-y-4">
            {profile ? (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Admin Profile</CardTitle>
                      <CardDescription>Manage your account information</CardDescription>
                    </div>
                    {!isEditingProfile && (
                      <Button variant="outline" onClick={() => setIsEditingProfile(true)}>
                        <Edit2 className="w-4 h-4 mr-2" />
                        Edit Profile
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Profile Picture */}
                  <div className="flex flex-col items-center gap-4">
                    <Avatar className="w-24 h-24">
                      <AvatarImage src={picturePreview || profile.picture || undefined} alt={profile.name || "Admin"} />
                      <AvatarFallback className="text-2xl">
                        {profile.name?.[0]?.toUpperCase() || profile.email[0].toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    {isEditingProfile && (
                      <div className="flex flex-col items-center gap-2">
                        <Label htmlFor="picture-upload" className="cursor-pointer">
                          <Button variant="outline" size="sm" type="button" asChild>
                            <span>
                              <Camera className="w-4 h-4 mr-2" />
                              Change Picture
                            </span>
                          </Button>
                        </Label>
                        <Input
                          id="picture-upload"
                          type="file"
                          accept="image/*"
                          onChange={handlePictureChange}
                          className="hidden"
                        />
                        {pictureFile && (
                          <p className="text-xs text-muted-foreground">{pictureFile.name}</p>
                        )}
                      </div>
                    )}
                  </div>

                  <Separator />

                  {/* Profile Information */}
                  {!isEditingProfile ? (
                    /* Table Display */
                    <div className="space-y-3">
                      <div className="flex border-b pb-3">
                        <div className="w-1/3 font-medium text-muted-foreground flex items-center">
                          <User className="w-4 h-4 mr-2" />
                          Name
                        </div>
                        <div className="w-2/3 text-foreground">{profile.name || "Not set"}</div>
                      </div>
                      <div className="flex border-b pb-3">
                        <div className="w-1/3 font-medium text-muted-foreground flex items-center">
                          <Mail className="w-4 h-4 mr-2" />
                          Email
                        </div>
                        <div className="w-2/3 text-foreground">{profile.email}</div>
                      </div>
                      <div className="flex border-b pb-3">
                        <div className="w-1/3 font-medium text-muted-foreground flex items-center">
                          <Phone className="w-4 h-4 mr-2" />
                          Phone
                        </div>
                        <div className="w-2/3 text-foreground">{profile.phone || "Not set"}</div>
                      </div>
                      <div className="flex border-b pb-3">
                        <div className="w-1/3 font-medium text-muted-foreground flex items-center">
                          <Shield className="w-4 h-4 mr-2" />
                          Role
                        </div>
                        <div className="w-2/3 text-foreground capitalize">{profile.role}</div>
                      </div>
                    </div>
                  ) : (
                    /* Edit Form */
                    <div className="grid gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="name">
                          <User className="w-4 h-4 inline mr-2" />
                          Name
                        </Label>
                        <Input
                          id="name"
                          value={profileForm.name}
                          onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                          placeholder="Enter your name"
                        />
                      </div>

                      <div className="grid gap-2">
                        <Label htmlFor="email">
                          <Mail className="w-4 h-4 inline mr-2" />
                          Email
                        </Label>
                        <Input
                          id="email"
                          type="email"
                          value={profileForm.email}
                          onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                          placeholder="Enter your email"
                        />
                      </div>

                      <div className="grid gap-2">
                        <Label htmlFor="phone">
                          <Phone className="w-4 h-4 inline mr-2" />
                          Phone Number
                        </Label>
                        <Input
                          id="phone"
                          type="tel"
                          value={profileForm.phone}
                          onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                          placeholder="Enter your phone number"
                        />
                      </div>

                      <div className="grid gap-2">
                        <Label>
                          <Shield className="w-4 h-4 inline mr-2" />
                          Role
                        </Label>
                        <p className="text-foreground font-medium capitalize">{profile.role}</p>
                      </div>

                      <Separator />
                      <div className="space-y-2">
                        <Label className="text-base font-semibold">Change Password (Optional)</Label>
                        <p className="text-sm text-muted-foreground">Leave blank to keep current password</p>
                      </div>

                      <div className="grid gap-2">
                        <Label htmlFor="currentPassword">Current Password</Label>
                        <Input
                          id="currentPassword"
                          type="password"
                          value={profileForm.currentPassword}
                          onChange={(e) => setProfileForm({ ...profileForm, currentPassword: e.target.value })}
                          placeholder="Enter current password"
                        />
                      </div>

                      <div className="grid gap-2">
                        <Label htmlFor="newPassword">New Password</Label>
                        <Input
                          id="newPassword"
                          type="password"
                          value={profileForm.newPassword}
                          onChange={(e) => setProfileForm({ ...profileForm, newPassword: e.target.value })}
                          placeholder="Enter new password (min 6 characters)"
                        />
                      </div>

                      <div className="grid gap-2">
                        <Label htmlFor="confirmPassword">Confirm New Password</Label>
                        <Input
                          id="confirmPassword"
                          type="password"
                          value={profileForm.confirmPassword}
                          onChange={(e) => setProfileForm({ ...profileForm, confirmPassword: e.target.value })}
                          placeholder="Confirm new password"
                        />
                      </div>

                      <div className="flex gap-2 justify-end pt-4">
                        <Button variant="outline" onClick={handleCancelEdit} disabled={isSaving}>
                          <X className="w-4 h-4 mr-2" />
                          Cancel
                        </Button>
                        <Button onClick={handleSaveProfile} disabled={isSaving}>
                          <Save className="w-4 h-4 mr-2" />
                          {isSaving ? "Saving..." : "Save Changes"}
                        </Button>
                      </div>
                    </div>
                  )}

                  <Separator />

                  {/* Account Info */}
                  <div className="grid gap-2 text-sm text-muted-foreground">
                    <div className="flex justify-between">
                      <span>Admin ID:</span>
                      <span className="font-mono">{profile.id}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Account Created:</span>
                      <span>{new Date(profile.createdAt).toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Last Updated:</span>
                      <span>{new Date(profile.updatedAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  Loading profile...
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Activity Logs Tab */}
          <TabsContent value="logs" className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">Activity Logs</h2>
                <p className="text-muted-foreground">Track all admin actions and system events</p>
              </div>
              <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowArchive(!showArchive)
                if (showArchive) {
                  setStartDate("")
                  setEndDate("")
                  fetchLogs(false)
                }
              }}
            >
              <Archive className="w-4 h-4 mr-2" />
              {showArchive ? 'Hide Archive' : 'View Archive'}
            </Button>
            <Button
              variant="outline"
              onClick={() => fetchLogs(showArchive)}
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Archive Filter */}
        {showArchive && (
          <Card>
            <CardHeader>
              <CardTitle>Archive Filters</CardTitle>
              <CardDescription>Filter logs by date range</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startDate">Start Date</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endDate">End Date</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
                <div className="flex items-end">
                  <Button onClick={handleArchiveSearch} className="w-full">
                    <Calendar className="w-4 h-4 mr-2" />
                    Search
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Admin Activity Logs */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>
              Logs are automatically cleaned up after 3 months
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">
                Loading logs...
              </div>
            ) : logs.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No logs found
              </div>
            ) : (
              <div className="space-y-3">
                {logs.map((log) => (
                  <div
                    key={log.id}
                    className="flex items-start gap-4 p-4 rounded-lg border border-border/50 hover:border-primary/50 transition-colors"
                  >
                    <div className="flex-shrink-0 mt-1">
                      <Activity className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className="text-xs">
                          {formatDate(log.createdAt)}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          Admin ID: {log.adminUser.id}
                        </span>
                      </div>
                      <p className="font-medium text-foreground">
                        {log.adminUser.name || log.adminUser.email}
                      </p>
                      <p className="text-sm text-foreground mt-1">
                        <span className="font-semibold">{log.action}</span>
                        {log.description && (
                          <span className="text-muted-foreground ml-2">
                            {log.description}
                          </span>
                        )}
                      </p>
                      {log.metadata && Object.keys(log.metadata).length > 0 && (
                        <div className="mt-2 text-xs text-muted-foreground">
                          <code className="bg-muted px-2 py-1 rounded">
                            {JSON.stringify(log.metadata)}
                          </code>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center gap-2 mt-6">
                <Button
                  variant="outline"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  Previous
                </Button>
                <span className="flex items-center px-4 text-sm text-muted-foreground">
                  Page {page} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  Next
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}
