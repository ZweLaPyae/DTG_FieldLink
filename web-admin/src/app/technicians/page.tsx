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
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog"
import mockDb from "../../../mock_database.json"
import { DashboardLayout } from "@/components/dashboard-layout"

export default function TechniciansPage() {
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
    const [technicianToDelete, setTechnicianToDelete] = useState<number | null>(null)
  const [technicians, setTechnicians] = useState<Array<{ id: number; name: string; email: string; phone: string | null; picture: string }>>(
    mockDb.technicians.map((tech: any) => ({
      id: tech.id,
      name: tech.name,
      email: tech.email || "N/A",
      phone: tech.phone || "N/A",
      picture: tech.picture
    }))
  )
  const [createPicturePreview, setCreatePicturePreview] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)

  const handleCreateTechnician = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const nameValue = formData.get("name") as string
    const emailValue = formData.get("email") as string
    const phoneValue = formData.get("phone") as string
    const newTechnician = {
      id: technicians.length + 1,
      name: nameValue,
      email: emailValue,
      phone: phoneValue === "" ? "N/A" : phoneValue,
      picture: ""
    }
    setTechnicians([...technicians, newTechnician])
    setIsCreateDialogOpen(false)
  }


  const handleDeleteTechnician = (id: number) => {
    setTechnicianToDelete(id)
    setDeleteDialogOpen(true)
  }

  const confirmDeleteTechnician = () => {
    if (technicianToDelete !== null) {
      setTechnicians(technicians.filter(tech => tech.id !== technicianToDelete))
      setTechnicianToDelete(null)
      setDeleteDialogOpen(false)
    }
  }

  // Find teams for a technician
  const getTeamsForTechnician = (techId: number) => {
    return mockDb.teams
      .filter(team => String(team.leaderId) === String(techId) || team.memberIds.map(String).includes(String(techId)))
      .map(team => team.name)
  }

  // Filter technicians by search
  const filteredTechnicians = technicians.filter(tech => {
    const searchLower = search.toLowerCase()
    return (
      tech.name.toLowerCase().includes(searchLower) ||
      (tech.phone && tech.phone.toLowerCase().includes(searchLower)) ||
      getTeamsForTechnician(tech.id).join(", ").toLowerCase().includes(searchLower)
    )
  })

  return (
    <DashboardLayout>
      <div className="container mx-auto py-10">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Technician Management</h1>
          <Button onClick={() => setIsCreateDialogOpen(true)}>Invite New Technician</Button>
        </div>

        <div className="mb-6 flex items-center">
          <Input
            type="text"
            placeholder="Search technicians..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full max-w-md"
          />
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Picture</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Teams</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredTechnicians.map(tech => (
              <TableRow key={tech.id}>
                <TableCell>
                  <img src={"/images/" + tech.picture} alt={tech.name} className="w-10 h-10 rounded-full object-cover" />
                </TableCell>
                <TableCell className="font-semibold">{tech.name}</TableCell>
                <TableCell>{tech.email}</TableCell>
                <TableCell>{tech.phone}</TableCell>
                <TableCell>{getTeamsForTechnician(tech.id).join(", ") || "-"}</TableCell>
                <TableCell>
                  <div className="flex space-x-2">
                    <Button size="sm" variant="destructive" onClick={() => handleDeleteTechnician(tech.id)}>Delete</Button>
                  </div>
                </TableCell>
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
              </TableRow>
            ))}
          </TableBody>
        </Table>

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
