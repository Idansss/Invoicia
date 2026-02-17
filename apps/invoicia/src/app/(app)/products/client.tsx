"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Plus, Search, Package } from "lucide-react"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { createProductAction } from "./actions"

export interface ProductRow {
  id: string
  name: string
  description?: string | null
  unit: string
  unitPrice: string
  taxPercent?: number | null
}

interface ProductsClientProps {
  products: ProductRow[]
}

export function ProductsClient({ products }: ProductsClientProps) {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [productForm, setProductForm] = useState({
    name: "",
    description: "",
    unitPriceCents: "0",
    unit: "each",
    taxPercent: "7",
  })

  const filtered = useMemo(() => {
    return products.filter((p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.description || "").toLowerCase().includes(searchQuery.toLowerCase())
    )
  }, [products, searchQuery])

  const handleCreateProduct = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!productForm.name.trim()) {
      toast.error("Name is required")
      return
    }
    setSubmitting(true)
    try {
      await createProductAction({
        name: productForm.name.trim(),
        description: productForm.description.trim(),
        unitPriceCents: productForm.unitPriceCents,
        unit: productForm.unit,
        taxPercent: productForm.taxPercent,
      })
      toast.success("Product added")
      setProductForm({ name: "", description: "", unitPriceCents: "0", unit: "each", taxPercent: "7" })
      setDialogOpen(false)
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create product")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Products</h1>
          <p className="text-sm text-muted-foreground mt-1">Catalog items keep invoices consistent</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-1.5 font-medium">
              <Plus className="h-4 w-4" /> Add product
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Product</DialogTitle>
              <DialogDescription>Create a new catalog item</DialogDescription>
            </DialogHeader>
            <form className="space-y-4 py-4" onSubmit={handleCreateProduct}>
              <div className="space-y-2">
                <Label>Name</Label>
                <Input
                  placeholder="Consulting"
                  value={productForm.name}
                  onChange={(event) => setProductForm((prev) => ({ ...prev, name: event.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Input
                  placeholder="Optional description"
                  value={productForm.description}
                  onChange={(event) => setProductForm((prev) => ({ ...prev, description: event.target.value }))}
                />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Unit price (cents)</Label>
                  <Input
                    type="number"
                    value={productForm.unitPriceCents}
                    onChange={(event) => setProductForm((prev) => ({ ...prev, unitPriceCents: event.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Unit</Label>
                  <Input
                    value={productForm.unit}
                    onChange={(event) => setProductForm((prev) => ({ ...prev, unit: event.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Tax percent</Label>
                  <Input
                    type="number"
                    value={productForm.taxPercent}
                    onChange={(event) => setProductForm((prev) => ({ ...prev, taxPercent: event.target.value }))}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" type="button" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? "Adding..." : "Add product"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="pt-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <div className="divide-y">
            {filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-2 py-10 text-muted-foreground">
                <Package className="h-8 w-8 opacity-40" />
                <p className="text-sm font-medium">No products found</p>
              </div>
            ) : (
              filtered.map((product) => (
                <div key={product.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-3">
                  <div>
                    <p className="text-sm font-medium text-foreground">{product.name}</p>
                    <p className="text-xs text-muted-foreground">{product.description || "No description"}</p>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <span className="text-muted-foreground">{product.unit}</span>
                    {product.taxPercent != null ? (
                      <Badge variant="secondary" className="text-xs">{product.taxPercent}% tax</Badge>
                    ) : null}
                    <span className="text-sm font-semibold text-foreground">{product.unitPrice}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
