"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Plus, Search, Edit, Trash2, Package, Ruler } from "lucide-react"
import { useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
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

export default function MaterialsPage() {
  const router = useRouter()
  const [materials, setMaterials] = useState<Material[]>([])
  const [filteredMaterials, setFilteredMaterials] = useState<Material[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [deleteId, setDeleteId] = useState<number | null>(null)

  useEffect(() => {
    fetchMaterials()
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

  const formatCost = (material: Material) => {
    if (material.unit === "METER" && material.referenceLength) {
      return `${material.unitCost.toLocaleString()} MMK per ${material.referenceLength}m`
    }
    return `${material.unitCost.toLocaleString()} MMK per piece`
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Material Catalog</h1>
            <p className="text-muted-foreground">Manage materials and equipment for tickets</p>
          </div>
          <Button onClick={() => router.push("/dashboard/materials/new")} className="bg-primary hover:bg-primary/90">
            <Plus className="w-4 h-4 mr-2" />
            Add New Material
          </Button>
        </div>

        {/* Search */}
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

        {/* Materials List */}
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
                              onClick={() => router.push(`/dashboard/materials/${material.id}/edit`)}
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
      </div>

      {/* Delete Confirmation Dialog */}
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
    </DashboardLayout>
  )
}
