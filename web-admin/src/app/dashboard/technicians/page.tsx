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
import { UserCog, Plus, Search } from "lucide-react"
import { FaUser, FaUserTie } from "react-icons/fa"

interface Technician {
  id: number
  name: string
  email: string
  phone: string
  picture: string
}

interface Team {
  id: string
  name: string
  leaderId: number
  memberIds: number[]
}

export default function TechniciansPage() {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [technicianToDelete, setTechnicianToDelete] = useState<number | null>(null)
  const [technicians, setTechnicians] = useState<Technician[]>([])
  const [teams, setTeams] = useState<Team[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)

  useEffect(() => {
    fetchTechnicians()
    fetchTeams()
  }, [])

  const fetchTechnicians = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/technicians`)
      const data = await response.json()
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

  const handleCreateTechnician = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const nameValue = formData.get("name") as string
    const emailValue = formData.get("email") as string
    const phoneValue = formData.get("phone") as string

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/technicians`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: nameValue,
          email: emailValue,
          phone: phoneValue || '',
          picture: '',
        }),
      })

      if (response.ok) {
        fetchTechnicians()
        setIsCreateDialogOpen(false)
      }
    } catch (error) {
      console.error('Failed to create technician:', error)
    }
  }

  const handleDeleteTechnician = (id: number) => {
    setTechnicianToDelete(id)
    setDeleteDialogOpen(true)
  }

  const confirmDeleteTechnician = async () => {
    if (technicianToDelete !== null) {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/technicians/${technicianToDelete}`, {
          method: 'DELETE',
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
    return (
      tech.name.toLowerCase().includes(searchLower) ||
      tech.email.toLowerCase().includes(searchLower) ||
      tech.phone.toLowerCase().includes(searchLower)
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
                      <TableHead>Team Leader</TableHead>
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
                <TableCell>{tech.phone || "-"}</TableCell>
                <TableCell>
                  {isTeamLeader(tech.id) ? (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {getLeaderTeamNames(tech.id).join(", ")}
                    </span>
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </TableCell>
                <TableCell>
                  <Button size="sm" variant="destructive" onClick={() => handleDeleteTechnician(tech.id)}>Delete</Button>
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
                <Label htmlFor="phone">Phone (optional)</Label>
                <Input id="phone" name="phone" />
              </div>
              <div className="flex justify-end space-x-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>Cancel</Button>
                <Button type="submit">Invite</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

      </div>
    </DashboardLayout>
  )
}
