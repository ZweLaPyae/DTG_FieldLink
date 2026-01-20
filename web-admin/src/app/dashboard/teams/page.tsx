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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Users as Plus, Search } from "lucide-react"
import { FaUsers } from "react-icons/fa"

interface Team {
  id: string
  name: string
  leaderId: number
  memberIds: number[]
  specialization: string
  activeTickets: number
  completedTickets: number
  location: string
  status: string
  leader?: {
    id: number
    name: string
    email: string
  }
}

interface Technician {
  id: number
  name: string
  email: string
  phone: string
  picture: string
}

export default function TeamsPage() {
  const [teams, setTeams] = useState<Team[]>([])
  const [technicians, setTechnicians] = useState<Technician[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [teamToDelete, setTeamToDelete] = useState<string | null>(null)
  const [selectedMembers, setSelectedMembers] = useState<number[]>([])
  const [editSelectedMembers, setEditSelectedMembers] = useState<number[]>([])
  const [selectedLeader, setSelectedLeader] = useState<number | null>(null)
  const [editSelectedLeader, setEditSelectedLeader] = useState<number | null>(null)
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    fetchTeams()
    fetchTechnicians()
  }, [])

  const fetchTeams = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/teams`)
      const data = await response.json()
      setTeams(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Failed to fetch teams:', error)
      setTeams([])
    } finally {
      setIsLoading(false)
    }
  }

  const fetchTechnicians = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/technicians`)
      const data = await response.json()
      setTechnicians(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Failed to fetch technicians:', error)
      setTechnicians([])
    }
  }

  const handleCreateTeam = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const leaderId = parseInt(formData.get("leader") as string)

    // Include leader in memberIds if not already there
    const memberIdsWithLeader = selectedMembers.includes(leaderId) 
      ? selectedMembers 
      : [...selectedMembers, leaderId]

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/teams`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.get("name") as string,
          leaderId: leaderId,
          memberIds: memberIdsWithLeader,
          specialization: formData.get("specialization") as string,
          location: formData.get("location") as string,
          status: "active",
        }),
      })

      if (response.ok) {
        fetchTeams()
        setIsCreateDialogOpen(false)
        setSelectedMembers([])
        setSelectedLeader(null)
      }
    } catch (error) {
      console.error('Failed to create team:', error)
    }
  }

  const handleEditTeam = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!selectedTeam) return

    const formData = new FormData(e.currentTarget)
    const leaderId = parseInt(formData.get("leader") as string)

    // Include leader in memberIds if not already there
    const memberIdsWithLeader = editSelectedMembers.includes(leaderId) 
      ? editSelectedMembers 
      : [...editSelectedMembers, leaderId]

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/teams/${selectedTeam.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.get("name") as string,
          leaderId: leaderId,
          memberIds: memberIdsWithLeader,
          specialization: formData.get("specialization") as string,
          location: formData.get("location") as string,
        }),
      })

      if (response.ok) {
        fetchTeams()
        setIsEditDialogOpen(false)
        setSelectedTeam(null)
        setEditSelectedMembers([])
        setEditSelectedLeader(null)
      }
    } catch (error) {
      console.error('Failed to update team:', error)
    }
  }

  const handleDeleteTeam = (teamId: string) => {
    setTeamToDelete(teamId)
    setDeleteDialogOpen(true)
  }

  const confirmDeleteTeam = async () => {
    if (teamToDelete) {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/teams/${teamToDelete}`, {
          method: 'DELETE',
        })

        if (response.ok) {
          fetchTeams()
          setTeamToDelete(null)
          setDeleteDialogOpen(false)
        }
      } catch (error) {
        console.error('Failed to delete team:', error)
      }
    }
  }

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="container mx-auto py-10">
          <p>Loading teams...</p>
        </div>
      </DashboardLayout>
    )
  }

  const filteredTeams = teams.filter(team => 
    team.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    team.leader?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    team.specialization.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center">
              <FaUsers className="w-8 h-8 mr-3 text-blue-600 dark:text-blue-400" />
              Teams Management
            </h1>
            <p className="text-muted-foreground mt-1">Create, view, edit, and manage team records</p>
          </div>
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Create Team
          </Button>
        </div>

        {/* Search Card */}
        <Card className="border-border/60">
          <CardHeader>
            <CardTitle className="text-lg">Search Teams</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
              <Input
                placeholder="Search by team name, leader, or specialization..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Teams Table */}
        <Card className="border-border/60">
          <CardHeader>
            <CardTitle className="text-lg">
              All Teams ({filteredTeams.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {filteredTeams.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {searchQuery ? "No teams found matching your search" : "No teams yet. Create your first one!"}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Team Name</TableHead>
                      <TableHead>Team Leader</TableHead>
                      <TableHead>Members</TableHead>
                      <TableHead>Specialization</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Active Tickets</TableHead>
                      <TableHead>Completed Tickets</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTeams.map((team) => (
              <TableRow key={team.id}>
                <TableCell className="font-semibold">{team.name}</TableCell>
                <TableCell>{team.leader?.name || "Unknown"}</TableCell>
                <TableCell>{Array.isArray(team.memberIds) ? team.memberIds.length : 0} members</TableCell>
                <TableCell>{team.specialization}</TableCell>
                <TableCell>{team.location}</TableCell>
                <TableCell>{team.activeTickets}</TableCell>
                <TableCell>{team.completedTickets}</TableCell>
                <TableCell>
                  <span className={`px-2 py-1 rounded text-xs ${team.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                    {team.status}
                  </span>
                </TableCell>
                <TableCell>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedTeam(team)
                        setEditSelectedMembers(Array.isArray(team.memberIds) ? team.memberIds : [])
                        setEditSelectedLeader(team.leaderId)
                        setIsEditDialogOpen(true)
                      }}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDeleteTeam(team.id)}
                    >
                      Delete
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

        {/* Create Team Dialog */}
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Team</DialogTitle>
              <DialogDescription>Fill in the details to create a new team.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateTeam} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Team Name</Label>
                <Input id="name" name="name" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="leader">Team Leader</Label>
                <Select name="leader" required onValueChange={(value) => setSelectedLeader(parseInt(value))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select team leader" />
                  </SelectTrigger>
                  <SelectContent>
                    {technicians.map((tech) => (
                      <SelectItem key={tech.id} value={String(tech.id)}>
                        {tech.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="specialization">Specialization</Label>
                <Input id="specialization" name="specialization" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input id="location" name="location" required />
              </div>
              <div className="space-y-2">
                <Label>Team Members</Label>
                <div className="border rounded-md p-3 max-h-48 overflow-y-auto space-y-2">
                  {technicians.map((tech) => {
                    const isLeader = selectedLeader === tech.id
                    const isChecked = selectedMembers.includes(tech.id) || isLeader
                    return (
                      <div key={tech.id} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={`member-${tech.id}`}
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedMembers([...selectedMembers, tech.id])
                            } else {
                              // Don't allow unchecking the leader
                              if (!isLeader) {
                                setSelectedMembers(selectedMembers.filter(id => id !== tech.id))
                              }
                            }
                          }}
                          disabled={isLeader}
                          className="rounded"
                        />
                        <label htmlFor={`member-${tech.id}`} className={`text-sm cursor-pointer ${
                          isLeader ? 'font-semibold text-blue-600' : ''
                        }`}>
                          {tech.name} {isLeader && '(Team Leader)'}
                        </label>
                      </div>
                    )
                  })}
                </div>
              </div>
              <div className="flex justify-end space-x-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>Cancel</Button>
                <Button type="submit">Create Team</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Edit Team Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Team</DialogTitle>
              <DialogDescription>Update team information.</DialogDescription>
            </DialogHeader>
            {selectedTeam && (
              <form onSubmit={handleEditTeam} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-name">Team Name</Label>
                  <Input id="edit-name" name="name" defaultValue={selectedTeam.name} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-leader">Team Leader</Label>
                  <Select 
                    name="leader" 
                    defaultValue={String(selectedTeam.leaderId)} 
                    required
                    onValueChange={(value) => setEditSelectedLeader(parseInt(value))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {technicians.map((tech) => (
                        <SelectItem key={tech.id} value={String(tech.id)}>
                          {tech.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-specialization">Specialization</Label>
                  <Input id="edit-specialization" name="specialization" defaultValue={selectedTeam.specialization} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-location">Location</Label>
                  <Input id="edit-location" name="location" defaultValue={selectedTeam.location} required />
                </div>
                <div className="space-y-2">
                  <Label>Team Members</Label>
                  <div className="border rounded-md p-3 max-h-48 overflow-y-auto space-y-2">
                    {technicians.map((tech) => {
                      const currentLeaderId = editSelectedLeader !== null ? editSelectedLeader : selectedTeam.leaderId
                      const isLeader = currentLeaderId === tech.id
                      const isChecked = editSelectedMembers.includes(tech.id) || isLeader
                      return (
                        <div key={tech.id} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id={`edit-member-${tech.id}`}
                            checked={isChecked}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setEditSelectedMembers([...editSelectedMembers, tech.id])
                              } else {
                                // Don't allow unchecking the leader
                                if (!isLeader) {
                                  setEditSelectedMembers(editSelectedMembers.filter(id => id !== tech.id))
                                }
                              }
                            }}
                            disabled={isLeader}
                            className="rounded"
                          />
                          <label htmlFor={`edit-member-${tech.id}`} className={`text-sm cursor-pointer ${
                            isLeader ? 'font-semibold text-blue-600' : ''
                          }`}>
                            {tech.name} {isLeader && '(Team Leader)'}
                          </label>
                        </div>
                      )
                    })}
                  </div>
                </div>
                <div className="flex justify-end space-x-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
                  <Button type="submit">Update Team</Button>
                </div>
              </form>
            )}
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirm Delete</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete this team? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <div className="flex justify-end space-x-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
              <Button type="button" variant="destructive" onClick={confirmDeleteTeam}>Delete</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  )
}
