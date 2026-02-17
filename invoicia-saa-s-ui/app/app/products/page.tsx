"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { mockProducts, formatCurrency } from "@/lib/mock-data"
import { Plus, Search, LayoutGrid, List, Package, Edit2 } from "lucide-react"
import { toast } from "sonner"
import { getActionErrorMessage, runUiAction } from "@/lib/ui-action-client"

export default function ProductsPage() {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [searchQuery, setSearchQuery] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formState, setFormState] = useState({
    name: "",
    description: "",
    unitPrice: "0",
    unit: "",
    taxCategory: "Services",
  })

  const filtered = mockProducts.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const resetForm = () => {
    setFormState({
      name: "",
      description: "",
      unitPrice: "0",
      unit: "",
      taxCategory: "Services",
    })
  }

  const handleAddProduct = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!formState.name.trim()) {
      toast.error("Name is required")
      return
    }
    if (!formState.unit.trim()) {
      toast.error("Unit is required")
      return
    }

    const unitPrice = Number(formState.unitPrice)
    if (!Number.isFinite(unitPrice) || unitPrice < 0) {
      toast.error("Unit price must be a valid number")
      return
    }

    setSubmitting(true)
    try {
      await runUiAction({
        type: "products.create",
        payload: {
          ...formState,
          unitPrice,
        },
      })
      toast.success("Product added")
      resetForm()
      setDialogOpen(false)
    } catch (error) {
      toast.error(getActionErrorMessage(error))
    } finally {
      setSubmitting(false)
    }
  }

  const handleEditProduct = async (productId: string) => {
    setEditingId(productId)
    try {
      await runUiAction({
        type: "products.edit.placeholder",
        payload: { productId },
      })
      toast.success("Edit panel coming soon")
    } catch (error) {
      toast.error(getActionErrorMessage(error))
    } finally {
      setEditingId(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Products & Services</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage your product and service catalog</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-1.5 font-medium"><Plus className="h-4 w-4" /> Add product</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Product</DialogTitle>
              <DialogDescription>Add a new product or service to your catalog</DialogDescription>
            </DialogHeader>
            <form className="space-y-4 py-4" onSubmit={handleAddProduct}>
              <div className="space-y-2">
                <Label>Name</Label>
                <Input
                  placeholder="Product name"
                  value={formState.name}
                  onChange={(event) => setFormState((prev) => ({ ...prev, name: event.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Input
                  placeholder="Brief description"
                  value={formState.description}
                  onChange={(event) => setFormState((prev) => ({ ...prev, description: event.target.value }))}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Unit Price</Label>
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={formState.unitPrice}
                    onChange={(event) => setFormState((prev) => ({ ...prev, unitPrice: event.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Unit</Label>
                  <Input
                    placeholder="hour, item, etc."
                    value={formState.unit}
                    onChange={(event) => setFormState((prev) => ({ ...prev, unit: event.target.value }))}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Tax Category</Label>
                <Input
                  placeholder="Services"
                  value={formState.taxCategory}
                  onChange={(event) => setFormState((prev) => ({ ...prev, taxCategory: event.target.value }))}
                />
              </div>
              <DialogFooter>
                <Button variant="outline" type="button" onClick={() => setDialogOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={submitting}>{submitting ? "Adding..." : "Add product"}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="pt-4">
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Search products..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9 h-9" />
            </div>
            <div className="flex border border-border rounded-lg overflow-hidden">
              <Button variant={viewMode === "grid" ? "secondary" : "ghost"} size="icon" className="h-9 w-9 rounded-none" onClick={() => setViewMode("grid")}>
                <LayoutGrid className="h-4 w-4" />
              </Button>
              <Button variant={viewMode === "list" ? "secondary" : "ghost"} size="icon" className="h-9 w-9 rounded-none" onClick={() => setViewMode("list")}>
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {filtered.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center py-12">
            <Package className="h-10 w-10 mx-auto mb-3 text-muted-foreground opacity-40" />
            <p className="text-sm font-medium text-muted-foreground">No products found</p>
            <p className="text-xs text-muted-foreground mt-1">Try adjusting your search</p>
          </CardContent>
        </Card>
      ) : viewMode === "grid" ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((product) => (
            <Card key={product.id} className="group hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10">
                      <Package className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">{product.name}</p>
                      <p className="text-xs text-muted-foreground">{product.description}</p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                    type="button"
                    onClick={() => handleEditProduct(product.id)}
                    disabled={editingId === product.id}
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
                <div className="flex items-center justify-between mt-4 pt-3 border-t border-border">
                  <span className="text-lg font-bold text-foreground">{formatCurrency(product.unitPrice)}<span className="text-xs font-normal text-muted-foreground">/{product.unit}</span></span>
                  <Badge variant="outline" className="text-xs">{product.taxCategory}</Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {filtered.map((product) => (
                <div key={product.id} className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-primary/10">
                      <Package className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{product.name}</p>
                      <p className="text-xs text-muted-foreground">{product.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <Badge variant="outline" className="text-xs">{product.taxCategory}</Badge>
                    <span className="text-sm font-semibold text-foreground">{formatCurrency(product.unitPrice)}/{product.unit}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
