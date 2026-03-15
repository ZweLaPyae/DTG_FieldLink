"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, Search, Edit, Trash2, Package, Ruler, Wrench } from "lucide-react"
import { useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { useAdminId } from "@/hooks/useAdminId"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface Material {
  id: number
  name: string
  unit: "PIECE" | "METER"
  unitCost: number
  referenceLength: number | null
}

interface RootCause {
  id: string
  name: string
}

export default function ConfigurationsPage() {
  const router = useRouter()
  const { adminId } = useAdminId()
  const [materials, setMaterials] = useState<Material[]>([])
  const [filteredMaterials, setFilteredMaterials] = useState<Material[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [deleteId, setDeleteId] = useState<number | null>(null)

  const [activeTab, setActiveTab] = useState("materials")

  const [rootCauses, setRootCauses] = useState<RootCause[]>([])
  const [filteredRootCauses, setFilteredRootCauses] = useState<RootCause[]>([])
  const [rootSearch, setRootSearch] = useState("")
  const [rootLoading, setRootLoading] = useState(true)
  const [rootDeleteId, setRootDeleteId] = useState<string | null>(null)
  const [rootEditId, setRootEditId] = useState<string | null>(null)
  const [rootEditName, setRootEditName] = useState("")
  const [rootNewName, setRootNewName] = useState("")

  useEffect(() => {
    fetchMaterials()
    fetchRootCauses()
  }, [])

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredMaterials(materials)
    } else {
      const query = searchQuery.toLowerCase()
      setFilteredMaterials(
        materials.filter((material) =>
          material.name.toLowerCase().includes(query) ||
          material.unit.toLowerCase().includes(query)
        )
      )
    }
  }, [searchQuery, materials])

  useEffect(() => {
    if (rootSearch.trim() === "") {
      setFilteredRootCauses(rootCauses)
    } else {
      const query = rootSearch.toLowerCase()
      setFilteredRootCauses(rootCauses.filter((rc) => rc.name.toLowerCase().includes(query)))
    }
  }, [rootSearch, rootCauses])

  const fetchMaterials = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/materials`)
      if (res.ok) {
        const data = await res.json()
        setMaterials(data)
        setFilteredMaterials(data)
      }
    } catch (error) {
      console.error("Error fetching materials:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteId) return

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/materials/${deleteId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ adminUserId: adminId }),
      })

      if (res.ok) {
        fetchMaterials()
        setDeleteId(null)
      } else {
        const error = await res.json()
        alert(`Error: ${error.error || "Failed to delete material"}`)
      }
    } catch (error) {
      console.error("Error deleting material:", error)
      alert("Failed to delete material")
    }
  }

  const fetchRootCauses = async () => {
    try {
      setRootLoading(true)
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/rootcauses`)
      if (res.ok) {
        const data = await res.json()
        setRootCauses(data)
        setFilteredRootCauses(data)
      }
    } catch (error) {
      console.error("Error fetching root causes:", error)
    } finally {
      setRootLoading(false)
    }
  }

  const handleCreateRootCause = async () => {
    if (!rootNewName.trim()) {
      alert("Please enter a root cause name")
      return
    }

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/rootcauses`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: rootNewName.trim(), adminUserId: adminId }),
      })

      if (res.ok) {
        setRootNewName("")
        fetchRootCauses()
      } else {
        const error = await res.json()
        alert(error.error || "Failed to create root cause")
      }
    } catch (error) {
      console.error("Error creating root cause:", error)
      alert("Failed to create root cause")
    }
  }

  const handleUpdateRootCause = async () => {
    if (!rootEditId) return
    if (!rootEditName.trim()) {
      alert("Please enter a root cause name")
      return
    }

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/rootcauses/${rootEditId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: rootEditName.trim(), adminUserId: adminId }),
      })

      if (res.ok) {
        setRootEditId(null)
        setRootEditName("")
        fetchRootCauses()
      } else {
        const error = await res.json()
        alert(error.error || "Failed to update root cause")
      }
    } catch (error) {
      console.error("Error updating root cause:", error)
      alert("Failed to update root cause")
    }
  }

  const handleDeleteRootCause = async () => {
    if (!rootDeleteId) return

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/rootcauses/${rootDeleteId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminUserId: adminId }),
      })

      if (res.ok) {
        fetchRootCauses()
        setRootDeleteId(null)
      } else {
        const error = await res.json()
        alert(error.error || "Failed to delete root cause")
      }
    } catch (error) {
      console.error("Error deleting root cause:", error)
      alert("Failed to delete root cause")
    }
  }

  const formatCost = (material: Material) => {
    if (material.unit === "METER" && material.referenceLength) {
      return `${material.unitCost.toLocaleString()} MMK per ${material.referenceLength}m`
    }
    return `${material.unitCost.toLocaleString()} MMK per piece`
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Configurations</h1>
            <p className="text-muted-foreground">Manage materials and root causes used across tickets</p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="materials">Materials</TabsTrigger>
            <TabsTrigger value="rootcauses">Root Causes</TabsTrigger>
          </TabsList>

          <TabsContent value="materials" className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-foreground">Material Catalog</h2>
                <p className="text-muted-foreground">Manage materials and equipment for tickets</p>
              </div>
              <Button onClick={() => router.push("/dashboard/configurations/materials/new")} className="bg-primary hover:bg-primary/90">
                <Plus className="w-4 h-4 mr-2" />
                Add New Material
              </Button>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Search Materials</CardTitle>
                <CardDescription>Find materials by name or unit type</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by name or unit type..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>All Materials ({filteredMaterials.length})</CardTitle>
                <CardDescription>Complete catalog of materials and their pricing</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex items-center justify-center h-32">
                    <div className="text-muted-foreground">Loading materials...</div>
                  </div>
                ) : filteredMaterials.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-32 text-center">
                    <Package className="w-12 h-12 text-muted-foreground mb-2" />
                    <p className="text-muted-foreground">
                      {searchQuery ? "No materials found matching your search" : "No materials in catalog"}
                    </p>
                    {!searchQuery && (
                      <Button
                        onClick={() => router.push("/dashboard/materials/new")}
                        variant="outline"
                        className="mt-4"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add First Material
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-4 font-semibold">Name</th>
                          <th className="text-left p-4 font-semibold">Unit Type</th>
                          <th className="text-left p-4 font-semibold">Pricing</th>
                          <th className="text-right p-4 font-semibold">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredMaterials.map((material) => (
                          <tr key={material.id} className="border-b hover:bg-muted/50">
                            <td className="p-4">
                              <div className="flex items-center space-x-2">
                                {material.unit === "METER" ? (
                                  <Ruler className="w-4 h-4 text-blue-500" />
                                ) : (
                                  <Package className="w-4 h-4 text-green-500" />
                                )}
                                <span className="font-medium">{material.name}</span>
                              </div>
                            </td>
                            <td className="p-4">
                              <Badge
                                variant={material.unit === "METER" ? "default" : "secondary"}
                                className={
                                  material.unit === "METER"
                                    ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
                                    : "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                                }
                              >
                                {material.unit === "METER" ? "Length-Based" : "Unit-Based"}
                              </Badge>
                            </td>
                            <td className="p-4 text-muted-foreground">{formatCost(material)}</td>
                            <td className="p-4">
                              <div className="flex items-center justify-end space-x-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => router.push(`/dashboard/configurations/materials/${material.id}/edit`)}
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setDeleteId(material.id)}
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="rootcauses" className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-foreground">Root Cause Catalog</h2>
                <p className="text-muted-foreground">Create, edit, and retire root causes used on tickets</p>
              </div>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Add Root Cause</CardTitle>
                <CardDescription>New causes become selectable on tickets</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex flex-col sm:flex-row gap-3">
                  <Input
                    placeholder="Root cause name (e.g., Fiber cut)"
                    value={rootNewName}
                    onChange={(e) => setRootNewName(e.target.value)}
                  />
                  <Button onClick={handleCreateRootCause} className="bg-primary hover:bg-primary/90" disabled={!rootNewName.trim()}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Cause
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Search Root Causes</CardTitle>
                <CardDescription>Find causes by name</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search root causes..."
                    value={rootSearch}
                    onChange={(e) => setRootSearch(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>All Root Causes ({filteredRootCauses.length})</CardTitle>
                <CardDescription>Keep this list concise to help technicians pick the right option</CardDescription>
              </CardHeader>
              <CardContent>
                {rootLoading ? (
                  <div className="flex items-center justify-center h-32">
                    <div className="text-muted-foreground">Loading root causes...</div>
                  </div>
                ) : filteredRootCauses.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-32 text-center">
                    <Wrench className="w-12 h-12 text-muted-foreground mb-2" />
                    <p className="text-muted-foreground">
                      {rootSearch ? "No root causes match your search" : "No root causes yet"}
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-4 font-semibold">Name</th>
                          <th className="text-right p-4 font-semibold">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredRootCauses.map((cause) => (
                          <tr key={cause.id} className="border-b hover:bg-muted/50">
                            <td className="p-4">
                              {rootEditId === cause.id ? (
                                <Input
                                  value={rootEditName}
                                  onChange={(e) => setRootEditName(e.target.value)}
                                  placeholder="Root cause name"
                                />
                              ) : (
                                <span className="font-medium">{cause.name}</span>
                              )}
                            </td>
                            <td className="p-4">
                              <div className="flex items-center justify-end space-x-2">
                                {rootEditId === cause.id ? (
                                  <>
                                    <Button variant="outline" size="sm" onClick={() => { setRootEditId(null); setRootEditName("") }}>
                                      Cancel
                                    </Button>
                                    <Button size="sm" onClick={handleUpdateRootCause} disabled={!rootEditName.trim()}>
                                      Save
                                    </Button>
                                  </>
                                ) : (
                                  <>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => { setRootEditId(cause.id); setRootEditName(cause.name) }}
                                    >
                                      <Edit className="w-4 h-4" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => setRootDeleteId(cause.id)}
                                      className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </Button>
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <AlertDialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Material</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this material? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={rootDeleteId !== null} onOpenChange={() => setRootDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Root Cause</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this root cause? This action cannot be undone and cannot be deleted if tickets reference it.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteRootCause} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  )
}
