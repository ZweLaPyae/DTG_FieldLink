"use client"

import { useState } from "react"
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
import mockDb from "../../../mock_database.json"

export default function TeamsPage() {
  const [teams, setTeams] = useState(mockDb.teams)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [selectedTeam, setSelectedTeam] = useState<any>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)

  const handleCreateTeam = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const newTeam = {
      id: `team-${teams.length + 1}`,
      name: formData.get("name") as string,
      leaderId: formData.get("leader") as string,
      memberIds: [],
      specialization: formData.get("specialization") as string,
      activeTickets: 0,
      completedTickets: 0,
      location: formData.get("location") as string,
      status: "active"
    }
    setTeams([...teams, newTeam])
    setIsCreateDialogOpen(false)
  }

  const handleEditTeam = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const updatedTeam = {
      ...selectedTeam,
      name: formData.get("name") as string,
      leaderId: formData.get("leader") as string,
      specialization: formData.get("specialization") as string,
      location: formData.get("location") as string
    }
    setTeams(teams.map(team => team.id === selectedTeam.id ? updatedTeam : team))
    setIsEditDialogOpen(false)
  }

  const handleEditMembers = (teamId: string, memberIds: string[]) => {
    setTeams(teams.map(team => team.id === teamId ? { ...team, memberIds } : team))
  }

  const getTeamLeaderName = (leaderId: string) => {
    const leader = mockDb.technicians.find(tech => tech.id === leaderId)
    return leader ? leader.name : "Unknown"
  }

  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Teams Management</h1>
        <Button onClick={() => setIsCreateDialogOpen(true)}>Create Team</Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Team Name</TableHead>
            <TableHead>Team Leader</TableHead>
            <TableHead>Members</TableHead>
            <TableHead>Specialization</TableHead>
            <TableHead>Location</TableHead>
            <TableHead>Active Tickets</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {teams.map((team) => (
            <TableRow key={team.id}>
              <TableCell>{team.name}</TableCell>
              <TableCell>{getTeamLeaderName(team.leaderId)}</TableCell>
              <TableCell>{team.memberIds.length} members</TableCell>
              <TableCell>{team.specialization}</TableCell>
              <TableCell>{team.location}</TableCell>
              <TableCell>{team.activeTickets}</TableCell>
              <TableCell>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedTeam(team)
                      setIsEditDialogOpen(true)
                    }}
                  >
                    Edit
                  </Button>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm">Manage Members</Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Manage Team Members</DialogTitle>
                        <DialogDescription>
                          Add or remove team members
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 mt-4">
                        {mockDb.technicians
                          .filter(tech => tech.id !== team.leaderId)
                          .map(tech => (
                            <div key={tech.id} className="flex items-center space-x-2">
                              <input
                                type="checkbox"
                                id={tech.id}
                                checked={team.memberIds.includes(tech.id)}
                                onChange={(e) => {
                                  const newMembers = e.target.checked
                                    ? [...team.memberIds, tech.id]
                                    : team.memberIds.filter(id => id !== tech.id)
                                  handleEditMembers(team.id, newMembers)
                                }}
                              />
                              <label htmlFor={tech.id}>{tech.name}</label>
                            </div>
                          ))}
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Create Team Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Team</DialogTitle>
            <DialogDescription>
              Fill in the details to create a new team
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateTeam} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Team Name</Label>
              <Input id="name" name="name" required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="leader">Team Leader</Label>
              <Select name="leader" required>
                <SelectTrigger>
                  <SelectValue placeholder="Select team leader" />
                </SelectTrigger>
                <SelectContent>
                  {mockDb.technicians.map(tech => (
                    <SelectItem key={tech.id} value={tech.id}>
                      {tech.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="specialization">Specialization</Label>
              <Select name="specialization" required>
                <SelectTrigger>
                  <SelectValue placeholder="Select specialization" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fiber-installation">Fiber Installation</SelectItem>
                  <SelectItem value="customer-support">Customer Support</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                  <SelectItem value="network-operations">Network Operations</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input id="location" name="location" required />
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCreateDialogOpen(false)}
              >
                Cancel
              </Button>
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
            <DialogDescription>
              Update team details
            </DialogDescription>
          </DialogHeader>

          {selectedTeam && (
            <form onSubmit={handleEditTeam} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Team Name</Label>
                <Input
                  id="name"
                  name="name"
                  defaultValue={selectedTeam.name}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="leader">Team Leader</Label>
                <Select name="leader" defaultValue={selectedTeam.leaderId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select team leader" />
                  </SelectTrigger>
                  <SelectContent>
                    {mockDb.technicians.map(tech => (
                      <SelectItem key={tech.id} value={tech.id}>
                        {tech.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="specialization">Specialization</Label>
                <Select name="specialization" defaultValue={selectedTeam.specialization}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select specialization" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fiber-installation">Fiber Installation</SelectItem>
                    <SelectItem value="customer-support">Customer Support</SelectItem>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                    <SelectItem value="network-operations">Network Operations</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  name="location"
                  defaultValue={selectedTeam.location}
                  required
                />
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit">Save Changes</Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}