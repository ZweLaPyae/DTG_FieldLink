"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog"
import { DashboardLayout } from "@/components/dashboard-layout"
import { UserCog, Plus, Search, Edit, Trash2, CheckCircle, AlertCircle, Mail, Copy, Loader2 } from "lucide-react"
import { FaUser, FaUserTie } from "react-icons/fa"
import { useAdminId } from "@/hooks/useAdminId"

interface Technician {
  id: number
  name: string
  email: string
  phone: string[]
  picture: string
}

interface Team {
  id: number
  name: string
  leaderId: number
  memberIds: number[]
}

export default function TechniciansPage() {
  const { adminId } = useAdminId()
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [technicianToDelete, setTechnicianToDelete] = useState<number | null>(null)
  const [technicians, setTechnicians] = useState<Technician[]>([])
  const [teams, setTeams] = useState<Team[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [selectedTechnician, setSelectedTechnician] = useState<Technician | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [creationResult, setCreationResult] = useState<{
    success: boolean
    name: string
    email: string
    password: string
    emailSent: boolean
  } | null>(null)

  useEffect(() => {
    fetchTechnicians()
    fetchTeams()
  }, [])

  const fetchTechnicians = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/technicians`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache'
        }
      })
      
      if (!response.ok) {
        console.error('Fetch technicians failed with status:', response.status)
        setTechnicians([])
        return
      }
      
      const data = await response.json()
      console.log('Fetched technicians:', data)
      setTechnicians(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Failed to fetch technicians:', error)
      setTechnicians([])
    } finally {
      setIsLoading(false)
    }
  }

  const fetchTeams = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/teams`)
      const data = await response.json()
      setTeams(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Failed to fetch teams:', error)
      setTeams([])
    }
  }

  const isTeamLeader = (technicianId: number) => {
    return teams.some(team => team.leaderId === technicianId)
  }

  const getLeaderTeamNames = (technicianId: number) => {
    return teams.filter(team => team.leaderId === technicianId).map(team => team.name)
  }

  const getTechnicianTeams = (technicianId: number) => {
    return teams.filter(team => 
      Array.isArray(team.memberIds) && team.memberIds.includes(technicianId)
    ).map(team => team.name)
  }

  const handleCreateTechnician = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = e.currentTarget
    const formData = new FormData(form)
    const nameValue = formData.get("name") as string
    const emailValue = formData.get("email") as string
    const phoneValue = formData.get("phone") as string

    // Convert comma-separated phone numbers to array
    const phoneArray = phoneValue ? phoneValue.split(',').map(p => p.trim()).filter(p => p) : []

    // Check if email already exists
    const emailExists = technicians.some(tech => tech.email.toLowerCase() === emailValue.toLowerCase())
    if (emailExists) {
      alert('A technician with this email already exists. Please use a different email address.')
      return
    }

    setIsCreating(true)

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/technicians`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: nameValue,
          email: emailValue,
          phone: phoneArray,
          picture: '',
          adminUserId: adminId,
        }),
      })

      if (response.ok) {
        const newTechnician = await response.json()
        console.log('Created technician:', newTechnician)
        
        // Wait a bit for database to update
        await fetchTechnicians()
        form.reset()
        setIsCreateDialogOpen(false)
        
        // Show result dialog
        setCreationResult({
          success: true,
          name: nameValue,
          email: emailValue,
          password: newTechnician.defaultPassword || '',
          emailSent: newTechnician.emailSent || false,
        })
      } else {
        const errorData = await response.json()
        let errorMessage = 'Unknown error'
        
        if (errorData.error) {
          // Parse Prisma unique constraint errors
          if (errorData.error.includes('Unique constraint') && errorData.error.includes('email')) {
            errorMessage = 'This email address is already in use. Please use a different email.'
          } else {
            errorMessage = errorData.error
          }
        }
        
        alert(`Failed to invite technician: ${errorMessage}`)
      }
    } catch (error) {
      console.error('Failed to create technician:', error)
      alert('Failed to invite technician. Please check your connection and try again.')
    } finally {
      setIsCreating(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
      .then(() => {
        // Could add a toast notification here
        console.log('Copied to clipboard')
      })
      .catch(err => console.error('Failed to copy:', err))
  }

  const handleDeleteTechnician = (id: number) => {
    setTechnicianToDelete(id)
    setDeleteDialogOpen(true)
  }

  const handleEditTechnician = (tech: Technician) => {
    setSelectedTechnician(tech)
    setIsEditDialogOpen(true)
  }

  const handleUpdateTechnician = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!selectedTechnician) return

    const formData = new FormData(e.currentTarget)
    const nameValue = formData.get("name") as string
    const emailValue = formData.get("email") as string
    const phoneValue = formData.get("phone") as string

    // Convert comma-separated phone numbers to array
    const phoneArray = phoneValue ? phoneValue.split(',').map(p => p.trim()).filter(p => p) : []

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/technicians/${selectedTechnician.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: nameValue,
          email: emailValue,
          phone: phoneArray,
          picture: selectedTechnician.picture || '',
          adminUserId: adminId,
        }),
      })

      if (response.ok) {
        fetchTechnicians()
        setIsEditDialogOpen(false)
        setSelectedTechnician(null)
      }
    } catch (error) {
      console.error('Failed to update technician:', error)
    }
  }

  const confirmDeleteTechnician = async () => {
    if (technicianToDelete !== null) {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/technicians/${technicianToDelete}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ adminUserId: adminId }),
        })

        if (response.ok) {
          fetchTechnicians()
          setTechnicianToDelete(null)
          setDeleteDialogOpen(false)
        }
      } catch (error) {
        console.error('Failed to delete technician:', error)
      }
    }
  }

  // Filter technicians by search
  const filteredTechnicians = technicians.filter(tech => {
    const searchLower = search.toLowerCase()
    const phoneString = Array.isArray(tech.phone) ? tech.phone.join(', ') : ''
    return (
      tech.name.toLowerCase().includes(searchLower) ||
      tech.email.toLowerCase().includes(searchLower) ||
      phoneString.toLowerCase().includes(searchLower)
    )
  })

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="container mx-auto py-10">
          <p>Loading technicians...</p>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center">
              <FaUserTie className="w-8 h-8 mr-3 text-blue-600 dark:text-blue-400" />
              Technician Management
            </h1>
            <p className="text-muted-foreground mt-1">Create, view, edit, and manage technician records</p>
          </div>
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Invite New Technician
          </Button>
        </div>

        {/* Search Card */}
        <Card className="border-border/60">
          <CardHeader>
            <CardTitle className="text-lg">Search Technicians</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
              <Input
                placeholder="Search technicians..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Technicians Table */}
        <Card className="border-border/60">
          <CardHeader>
            <CardTitle className="text-lg">
              All Technicians ({filteredTechnicians.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {filteredTechnicians.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {search ? "No technicians found matching your search" : "No technicians yet. Invite your first one!"}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Picture</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Team</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTechnicians.map(tech => (
              <TableRow key={tech.id}>
                <TableCell>
                  <img src={tech.picture || "/images/default-avatar.png"} alt={tech.name} className="w-10 h-10 rounded-full object-cover" />
                </TableCell>
                <TableCell className="font-semibold">{tech.name}</TableCell>
                <TableCell>{tech.email}</TableCell>
                <TableCell>
                  {Array.isArray(tech.phone) && tech.phone.length > 0 
                    ? tech.phone.join(', ') 
                    : '-'}
                </TableCell>
                <TableCell>
                  {(() => {
                    const techTeams = getTechnicianTeams(tech.id)
                    if (techTeams.length === 0) {
                      return <span className="text-muted-foreground">-</span>
                    }
                    return (
                      <div className="flex flex-wrap gap-1">
                        {techTeams.map((teamName, idx) => (
                          <span 
                            key={idx}
                            className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                          >
                            {teamName}
                          </span>
                        ))}
                      </div>
                    )
                  })()}
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => handleEditTechnician(tech)}
                      className="hover:bg-blue-50 dark:hover:bg-blue-950/30 text-blue-600 hover:text-blue-700"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => handleDeleteTechnician(tech.id)}
                      className="hover:bg-red-50 dark:hover:bg-red-950/30 text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Delete Confirmation Dialog */}
        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirm Delete</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete this technician?
              </DialogDescription>
            </DialogHeader>
            <div className="flex justify-end space-x-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
              <Button type="button" variant="destructive" onClick={confirmDeleteTechnician}>Delete</Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Create Technician Dialog */}
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Invite New Technician</DialogTitle>
              <DialogDescription>Fill in the details to add a new technician.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateTechnician} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input id="name" name="name" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" name="email" type="email" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Numbers (comma-separated)</Label>
                <Input 
                  id="phone" 
                  name="phone" 
                  placeholder="e.g., 09-123456789, 09-987654321"
                />
                <p className="text-xs text-muted-foreground">Add multiple phone numbers separated by commas</p>
              </div>
              <div className="flex justify-end space-x-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)} disabled={isCreating}>Cancel</Button>
                <Button type="submit" disabled={isCreating}>
                  {isCreating ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Inviting...
                    </>
                  ) : (
                    'Invite'
                  )}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Success Result Dialog */}
        <Dialog open={creationResult !== null} onOpenChange={(open) => !open && setCreationResult(null)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-6 h-6 text-green-500" />
                <DialogTitle>Technician Invited Successfully!</DialogTitle>
              </div>
            </DialogHeader>
            <div className="space-y-4">
              {creationResult?.emailSent ? (
                <div className="rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 p-4">
                  <div className="flex items-start space-x-3">
                    <Mail className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5" />
                    <div>
                      <p className="font-medium text-green-900 dark:text-green-100">Welcome email sent</p>
                      <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                        Login credentials have been sent to <span className="font-medium">{creationResult.email}</span>
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 p-4">
                  <div className="flex items-start space-x-3">
                    <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
                    <div>
                      <p className="font-medium text-yellow-900 dark:text-yellow-100">Email not configured</p>
                      <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                        Please share the credentials below manually with the technician.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-3">
                <div>
                  <Label className="text-sm text-muted-foreground">Technician Name</Label>
                  <p className="font-medium">{creationResult?.name}</p>
                </div>

                <div>
                  <Label className="text-sm text-muted-foreground">Email / Username</Label>
                  <div className="flex items-center space-x-2 mt-1">
                    <code className="flex-1 bg-muted px-3 py-2 rounded text-sm font-mono">
                      {creationResult?.email}
                    </code>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyToClipboard(creationResult?.email || '')}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div>
                  <Label className="text-sm text-muted-foreground">Generated Password</Label>
                  <div className="flex items-center space-x-2 mt-1">
                    <code className="flex-1 bg-muted px-3 py-2 rounded text-sm font-mono font-bold">
                      {creationResult?.password}
                    </code>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyToClipboard(creationResult?.password || '')}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>

              <div className="rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-3">
                <p className="text-sm text-blue-900 dark:text-blue-100">
                  <strong>Security Note:</strong> The technician should change their password after the first login.
                </p>
              </div>

              <div className="flex justify-end pt-2">
                <Button onClick={() => setCreationResult(null)}>
                  Close
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Edit Technician Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Technician</DialogTitle>
              <DialogDescription>Update the technician details.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleUpdateTechnician} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Name</Label>
                <Input 
                  id="edit-name" 
                  name="name" 
                  defaultValue={selectedTechnician?.name || ''} 
                  required 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-email">Email</Label>
                <Input 
                  id="edit-email" 
                  name="email" 
                  type="email" 
                  defaultValue={selectedTechnician?.email || ''} 
                  required 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-phone">Phone Numbers (comma-separated)</Label>
                <Input 
                  id="edit-phone" 
                  name="phone" 
                  defaultValue={Array.isArray(selectedTechnician?.phone) 
                    ? selectedTechnician.phone.join(', ') 
                    : ''} 
                  placeholder="e.g., 09-123456789, 09-987654321"
                />
                <p className="text-xs text-muted-foreground">Add multiple phone numbers separated by commas</p>
              </div>
              <div className="flex justify-end space-x-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
                <Button type="submit">Update</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

      </div>
    </DashboardLayout>
  )
}
