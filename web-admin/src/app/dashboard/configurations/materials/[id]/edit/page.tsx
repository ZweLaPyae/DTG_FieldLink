"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { ArrowLeft, Save, Package, Ruler } from "lucide-react"
import { useRouter, useParams } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { useAdminId } from "@/hooks/useAdminId"

export default function EditMaterialPage() {
	const router = useRouter()
	const params = useParams()
	const materialId = params.id as string
	const { adminId } = useAdminId()

	const [formData, setFormData] = useState({
		name: "",
		unit: "PIECE" as "PIECE" | "METER",
		unitCost: "",
		referenceLength: "",
	})
	const [isSubmitting, setIsSubmitting] = useState(false)
	const [isLoading, setIsLoading] = useState(true)

	useEffect(() => {
		const fetchMaterial = async () => {
			try {
				const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/materials/${materialId}`)
				if (res.ok) {
					const material = await res.json()
					setFormData({
						name: material.name || "",
						unit: material.unit || "PIECE",
						unitCost: material.unitCost?.toString() || "",
						referenceLength: material.referenceLength?.toString() || "",
					})
				}
			} catch (error) {
				console.error("Error fetching material:", error)
			} finally {
				setIsLoading(false)
			}
		}
		fetchMaterial()
	}, [materialId])

	const handleInputChange = (field: string, value: string) => {
		setFormData((prev) => ({ ...prev, [field]: value }))
	}

	const handleUnitChange = (value: "PIECE" | "METER") => {
		setFormData((prev) => ({
			...prev,
			unit: value,
			referenceLength: value === "PIECE" ? "" : prev.referenceLength,
		}))
	}

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()

		if (!formData.name.trim()) {
			alert("Material name is required")
			return
		}

		if (!formData.unitCost || parseFloat(formData.unitCost) <= 0) {
			alert("Valid unit cost is required")
			return
		}

		if (formData.unit === "METER" && (!formData.referenceLength || parseFloat(formData.referenceLength) <= 0)) {
			alert("Valid reference length is required for length-based materials")
			return
		}

		setIsSubmitting(true)

		try {
			const payload = {
				name: formData.name.trim(),
				unit: formData.unit,
				unitCost: parseFloat(formData.unitCost),
				referenceLength: formData.unit === "METER" ? parseFloat(formData.referenceLength) : null,
				adminUserId: adminId,
			}

			const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/materials/${materialId}`, {
				method: "PUT",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(payload),
			})

			if (res.ok) {
				router.push("/dashboard/configurations")
			} else {
				const error = await res.json()
				alert(`Error: ${error.error || "Failed to update material"}`)
			}
		} catch (error) {
			console.error("Error updating material:", error)
			alert("Failed to update material")
		} finally {
			setIsSubmitting(false)
		}
	}

	if (isLoading) {
		return (
			<DashboardLayout>
				<div className="flex items-center justify-center h-64">
					<div className="text-muted-foreground">Loading material data...</div>
				</div>
			</DashboardLayout>
		)
	}

	return (
		<DashboardLayout>
			<div className="space-y-6">
				{/* Header */}
				<div className="flex items-center space-x-4">
					<Button variant="ghost" size="icon" onClick={() => router.back()}>
						<ArrowLeft className="w-5 h-5" />
					</Button>
					<div>
						<h1 className="text-2xl font-bold text-foreground">Edit Material</h1>
						<p className="text-muted-foreground">Update material information</p>
					</div>
				</div>

				<form onSubmit={handleSubmit} className="space-y-6">
					{/* Material Information */}
					<Card className="border-purple-200 dark:border-purple-800">
						<CardHeader className="bg-purple-50 dark:bg-purple-950/50">
							<CardTitle className="flex items-center text-purple-700 dark:text-purple-300">
								<Package className="w-5 h-5 mr-2" />
								Material Information
							</CardTitle>
							<CardDescription>Basic details about the material</CardDescription>
						</CardHeader>
						<CardContent className="space-y-4 pt-6">
							<div className="space-y-2">
								<Label htmlFor="name">
									Material Name <span className="text-red-500">*</span>
								</Label>
								<Input
									id="name"
									placeholder="e.g., Fiber Optic Cable, Splice Closure"
									value={formData.name}
									onChange={(e) => handleInputChange("name", e.target.value)}
									required
								/>
							</div>
						</CardContent>
					</Card>

					{/* Unit Type */}
					<Card className="border-blue-200 dark:border-blue-800">
						<CardHeader className="bg-blue-50 dark:bg-blue-950/50">
							<CardTitle className="flex items-center text-blue-700 dark:text-blue-300">
								<Ruler className="w-5 h-5 mr-2" />
								Unit Type
							</CardTitle>
							<CardDescription>How is this material measured?</CardDescription>
						</CardHeader>
						<CardContent className="pt-6">
							<RadioGroup value={formData.unit} onValueChange={handleUnitChange}>
								<div className="flex items-center space-x-2 p-4 border rounded-lg hover:bg-muted/50 cursor-pointer">
									<RadioGroupItem value="PIECE" id="piece" />
									<Label htmlFor="piece" className="flex-1 cursor-pointer">
										<div className="font-semibold">Unit-Based</div>
										<div className="text-sm text-muted-foreground">
											Items sold per piece or bag (e.g., connectors, splice closures)
										</div>
									</Label>
									<Package className="w-5 h-5 text-green-500" />
								</div>
								<div className="flex items-center space-x-2 p-4 border rounded-lg hover:bg-muted/50 cursor-pointer">
									<RadioGroupItem value="METER" id="meter" />
									<Label htmlFor="meter" className="flex-1 cursor-pointer">
										<div className="font-semibold">Length-Based</div>
										<div className="text-sm text-muted-foreground">
											Materials sold by length (e.g., fiber optic cables)
										</div>
									</Label>
									<Ruler className="w-5 h-5 text-blue-500" />
								</div>
							</RadioGroup>
						</CardContent>
					</Card>

					{/* Pricing Information */}
					<Card className="border-green-200 dark:border-green-800">
						<CardHeader className="bg-green-50 dark:bg-green-950/50">
							<CardTitle className="flex items-center text-green-700 dark:text-green-300">
								<Save className="w-5 h-5 mr-2" />
								Pricing Information
							</CardTitle>
							<CardDescription>
								{formData.unit === "METER"
									? "Set the cost per length unit"
									: "Set the cost per piece"}
							</CardDescription>
						</CardHeader>
						<CardContent className="space-y-4 pt-6">
							{formData.unit === "METER" && (
								<div className="space-y-2">
									<Label htmlFor="referenceLength">
										Reference Length (meters) <span className="text-red-500">*</span>
									</Label>
									<Input
										id="referenceLength"
										type="number"
										placeholder="e.g., 1000"
										value={formData.referenceLength}
										onChange={(e) => handleInputChange("referenceLength", e.target.value)}
										min="0"
										step="0.01"
										required={formData.unit === "METER"}
									/>
									<p className="text-xs text-muted-foreground">
										The standard length used for pricing (e.g., 1000 meters for bulk cable)
									</p>
								</div>
							)}
							<div className="space-y-2">
								<Label htmlFor="unitCost">
									{formData.unit === "METER"
										? `Cost per ${formData.referenceLength || "X"} meters (MMK)`
										: "Cost per Piece (TMMK)"}{" "}
									<span className="text-red-500">*</span>
								</Label>
								<Input
									id="unitCost"
									type="number"
									placeholder={formData.unit === "METER" ? "e.g., 180000" : "e.g., 450"}
									value={formData.unitCost}
									onChange={(e) => handleInputChange("unitCost", e.target.value)}
									min="0"
									step="0.01"
									required
								/>
								{formData.unit === "METER" && formData.referenceLength && formData.unitCost && (
									<p className="text-xs text-muted-foreground">
										Cost per meter: {" "}
										{(parseFloat(formData.unitCost) / parseFloat(formData.referenceLength)).toFixed(2)} MMK/m
									</p>
								)}
							</div>
						</CardContent>
					</Card>

					{/* Action Buttons */}
					<div className="flex justify-end space-x-2">
						<Button
							type="button"
							variant="outline"
							onClick={() => router.push("/dashboard/configurations")}
							disabled={isSubmitting}
						>
							Cancel
						</Button>
						<Button type="submit" className="bg-primary hover:bg-primary/90" disabled={isSubmitting}>
							<Save className="w-4 h-4 mr-2" />
							{isSubmitting ? "Updating..." : "Update Material"}
						</Button>
					</div>
				</form>
			</div>
		</DashboardLayout>
	)
}
