# Migration Guide: From Mock Data to Supabase

This guide shows you how to replace mock data with real Supabase queries in your components.

## Prerequisites

- Complete the Supabase setup from `SUPABASE_SETUP.md`
- Supabase project running with schema and storage configured
- `.env.local` file with Supabase credentials

## Migration Strategy

We'll migrate components one at a time, starting with the simplest (Customers, Products) and moving to more complex ones (Invoices).

## Step 1: Update Customers Page

### Before (Mock Data)
```tsx
import { mockCustomers } from "@/lib/mock-data"

export default function CustomersPage() {
  const customers = mockCustomers
  // ...
}
```

### After (Supabase)
```tsx
"use client"

import { useEffect, useState } from "react"
import { getCustomers, createCustomer } from "@/lib/supabase/queries"
import type { Database } from "@/lib/supabase/database.types"

type Customer = Database["public"]["Tables"]["customers"]["Row"]

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadCustomers()
  }, [])

  async function loadCustomers() {
    try {
      const data = await getCustomers()
      setCustomers(data)
    } catch (error) {
      console.error("Error loading customers:", error)
      toast.error("Failed to load customers")
    } finally {
      setLoading(false)
    }
  }

  const handleCreateCustomer = async (formData) => {
    try {
      await createCustomer(formData)
      toast.success("Customer added")
      await loadCustomers() // Refresh list
    } catch (error) {
      toast.error("Failed to create customer")
    }
  }

  if (loading) return <div>Loading...</div>

  // ... rest of component
}
```

## Step 2: Update Products Page

Similar pattern to customers:

```tsx
"use client"

import { useEffect, useState } from "react"
import { getProducts, createProduct } from "@/lib/supabase/queries"

export default function ProductsPage() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadProducts()
  }, [])

  async function loadProducts() {
    try {
      const data = await getProducts()
      setProducts(data)
    } finally {
      setLoading(false)
    }
  }

  // ... rest of component
}
```

## Step 3: Update Invoices List Page

```tsx
"use client"

import { useEffect, useState } from "react"
import { getInvoices, updateInvoiceStatus } from "@/lib/supabase/queries"

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadInvoices()
  }, [])

  async function loadInvoices() {
    try {
      const data = await getInvoices()
      setInvoices(data)
    } finally {
      setLoading(false)
    }
  }

  const handleSendInvoice = async (invoiceId: string) => {
    try {
      await updateInvoiceStatus(invoiceId, "sent")
      toast.success("Invoice sent")
      await loadInvoices()
    } catch (error) {
      toast.error("Failed to send invoice")
    }
  }

  // ... rest of component
}
```

## Step 4: Update New Invoice Page

```tsx
"use client"

import { useEffect, useState } from "react"
import { getCustomers, getProducts, createInvoice } from "@/lib/supabase/queries"

export default function NewInvoicePage() {
  const [customers, setCustomers] = useState([])
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    try {
      const [customersData, productsData] = await Promise.all([
        getCustomers(),
        getProducts(),
      ])
      setCustomers(customersData)
      setProducts(productsData)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (formData) => {
    try {
      const invoice = await createInvoice({
        customer_id: formData.customerId,
        number: formData.invoiceNumber,
        issue_date: formData.issueDate,
        due_date: formData.dueDate,
        line_items: formData.lineItems,
        // ... other fields
      })
      
      toast.success("Invoice created")
      router.push(`/app/invoices/${invoice.id}`)
    } catch (error) {
      toast.error("Failed to create invoice")
    }
  }

  // ... rest of component
}
```

## Step 5: Update Settings Page

```tsx
"use client"

import { useEffect, useState } from "react"
import { getOrganization, updateOrganization } from "@/lib/supabase/queries"

export default function SettingsPage() {
  const [organization, setOrganization] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadOrganization()
  }, [])

  async function loadOrganization() {
    try {
      const data = await getOrganization()
      setOrganization(data)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async (formData) => {
    try {
      await updateOrganization(formData)
      toast.success("Settings saved")
      await loadOrganization()
    } catch (error) {
      toast.error("Failed to save settings")
    }
  }

  // ... rest of component
}
```

## Step 6: Update File Uploads

### Logo Upload (Templates Page)

```tsx
import { uploadLogo } from "@/lib/supabase/queries"
import { createClient } from "@/lib/supabase/client"

const handleLogoUpload = async (file: File) => {
  try {
    const supabase = createClient()
    const { data: profile } = await supabase
      .from("profiles")
      .select("organization_id")
      .single()

    if (!profile) throw new Error("Profile not found")

    const logoUrl = await uploadLogo(file, profile.organization_id)
    
    // Update organization settings
    await supabase
      .from("organization_settings")
      .update({ logo_url: logoUrl })
      .eq("organization_id", profile.organization_id)

    toast.success("Logo uploaded")
  } catch (error) {
    toast.error("Failed to upload logo")
  }
}
```

### Invoice Attachments

```tsx
import { uploadAttachment } from "@/lib/supabase/queries"

const handleAttachmentUpload = async (file: File, invoiceId: string) => {
  try {
    const supabase = createClient()
    const { data: profile } = await supabase
      .from("profiles")
      .select("organization_id")
      .single()

    if (!profile) throw new Error("Profile not found")

    await uploadAttachment(file, profile.organization_id, invoiceId)
    toast.success("Attachment uploaded")
  } catch (error) {
    toast.error("Failed to upload attachment")
  }
}
```

## Step 7: Add Real-time Updates (Optional)

Supabase supports real-time subscriptions for live updates:

```tsx
"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState([])
  const supabase = createClient()

  useEffect(() => {
    // Initial load
    loadInvoices()

    // Subscribe to changes
    const channel = supabase
      .channel("invoices-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "invoices",
        },
        (payload) => {
          console.log("Invoice changed:", payload)
          loadInvoices() // Reload data
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  // ... rest of component
}
```

## Step 8: Add Loading States

Always show loading states while fetching data:

```tsx
if (loading) {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
    </div>
  )
}
```

Or use skeleton loaders:

```tsx
import { Skeleton } from "@/components/ui/skeleton"

if (loading) {
  return (
    <div className="space-y-4">
      <Skeleton className="h-12 w-full" />
      <Skeleton className="h-12 w-full" />
      <Skeleton className="h-12 w-full" />
    </div>
  )
}
```

## Step 9: Error Handling

Always handle errors gracefully:

```tsx
const [error, setError] = useState<string | null>(null)

async function loadData() {
  try {
    setError(null)
    const data = await getInvoices()
    setInvoices(data)
  } catch (err) {
    setError(err instanceof Error ? err.message : "Failed to load data")
    toast.error("Failed to load invoices")
  } finally {
    setLoading(false)
  }
}

if (error) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4">
      <p className="text-destructive">{error}</p>
      <Button onClick={() => loadData()}>Retry</Button>
    </div>
  )
}
```

## Step 10: Optimize with Server Components

For pages that don't need interactivity, use Server Components:

```tsx
// app/app/invoices/page.tsx (Server Component)
import { createClient } from "@/lib/supabase/server"

export default async function InvoicesPage() {
  const supabase = await createClient()
  
  const { data: invoices } = await supabase
    .from("invoices")
    .select("*, customer:customers(*)")
    .order("created_at", { ascending: false })

  return (
    <div>
      {invoices?.map((invoice) => (
        <InvoiceCard key={invoice.id} invoice={invoice} />
      ))}
    </div>
  )
}
```

## Common Patterns

### Pattern 1: Fetch on Mount
```tsx
useEffect(() => {
  loadData()
}, [])
```

### Pattern 2: Optimistic Updates
```tsx
const handleDelete = async (id: string) => {
  // Optimistically remove from UI
  setItems(items.filter(item => item.id !== id))
  
  try {
    await supabase.from("items").delete().eq("id", id)
    toast.success("Deleted")
  } catch (error) {
    // Revert on error
    loadData()
    toast.error("Failed to delete")
  }
}
```

### Pattern 3: Pagination
```tsx
const [page, setPage] = useState(0)
const pageSize = 20

async function loadPage(pageNum: number) {
  const { data } = await supabase
    .from("invoices")
    .select("*")
    .range(pageNum * pageSize, (pageNum + 1) * pageSize - 1)
  
  setInvoices(data)
}
```

### Pattern 4: Search/Filter
```tsx
const [searchQuery, setSearchQuery] = useState("")

async function search(query: string) {
  const { data } = await supabase
    .from("customers")
    .select("*")
    .ilike("name", `%${query}%`)
  
  setCustomers(data)
}

useEffect(() => {
  const debounce = setTimeout(() => {
    search(searchQuery)
  }, 300)
  
  return () => clearTimeout(debounce)
}, [searchQuery])
```

## Testing Checklist

After migrating each component:

- [ ] Data loads correctly on page load
- [ ] Create operations work and update the list
- [ ] Update operations work and reflect changes
- [ ] Delete operations work and remove from list
- [ ] Loading states show while fetching
- [ ] Error states show on failure
- [ ] Toast notifications appear for actions
- [ ] RLS policies prevent unauthorized access
- [ ] Real-time updates work (if implemented)

## Troubleshooting

### "relation does not exist" error
- Run the schema.sql migration in Supabase SQL Editor

### "permission denied" error
- Check RLS policies are enabled
- Verify user is authenticated
- Check organization_id is set correctly

### Data not showing up
- Check browser console for errors
- Verify RLS policies allow SELECT
- Check user's organization_id matches data

### Can't upload files
- Verify storage buckets exist
- Check storage policies are set up
- Ensure file size is under limit (10MB default)

## Next Steps

After migrating all components:

1. Remove mock data files
2. Add comprehensive error boundaries
3. Implement retry logic for failed requests
4. Add offline support with service workers
5. Set up monitoring and error tracking
6. Deploy to production with production Supabase project

## Resources

- [Supabase JavaScript Client Docs](https://supabase.com/docs/reference/javascript)
- [Next.js + Supabase Guide](https://supabase.com/docs/guides/getting-started/quickstarts/nextjs)
- [Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [Supabase Storage Guide](https://supabase.com/docs/guides/storage)
