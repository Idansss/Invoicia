import { createClient } from "@/lib/supabase/client"
import type { Database } from "./database.types"

// Type helpers
type Tables = Database["public"]["Tables"]
type Invoice = Tables["invoices"]["Row"]
type Customer = Tables["customers"]["Row"]
type Product = Tables["products"]["Row"]
type Payment = Tables["payments"]["Row"]

// =====================================================
// CUSTOMERS
// =====================================================

export async function getCustomers() {
  const supabase = createClient()
  const { data, error } = await supabase
    .from("customers")
    .select("*")
    .order("created_at", { ascending: false })

  if (error) throw error
  return data
}

export async function getCustomer(id: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from("customers")
    .select("*")
    .eq("id", id)
    .single()

  if (error) throw error
  return data
}

export async function createCustomer(customer: {
  name: string
  email: string
  company?: string
  default_terms?: string
}) {
  const supabase = createClient()
  
  // Get user's organization_id
  const { data: profile } = await supabase
    .from("profiles")
    .select("organization_id")
    .single()

  if (!profile) throw new Error("User profile not found")

  const { data, error } = await supabase
    .from("customers")
    .insert({
      ...customer,
      organization_id: profile.organization_id,
    })
    .select()
    .single()

  if (error) throw error
  return data
}

// =====================================================
// PRODUCTS
// =====================================================

export async function getProducts() {
  const supabase = createClient()
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .order("created_at", { ascending: false })

  if (error) throw error
  return data
}

export async function createProduct(product: {
  name: string
  description?: string
  unit_price: number
  unit: string
  tax_category?: string
}) {
  const supabase = createClient()
  
  const { data: profile } = await supabase
    .from("profiles")
    .select("organization_id")
    .single()

  if (!profile) throw new Error("User profile not found")

  const { data, error } = await supabase
    .from("products")
    .insert({
      ...product,
      organization_id: profile.organization_id,
    })
    .select()
    .single()

  if (error) throw error
  return data
}

// =====================================================
// INVOICES
// =====================================================

export async function getInvoices() {
  const supabase = createClient()
  const { data, error } = await supabase
    .from("invoices")
    .select(`
      *,
      customer:customers(name, email),
      line_items:invoice_line_items(*)
    `)
    .order("created_at", { ascending: false })

  if (error) throw error
  return data
}

export async function getInvoice(id: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from("invoices")
    .select(`
      *,
      customer:customers(*),
      line_items:invoice_line_items(*),
      payments:payments(*)
    `)
    .eq("id", id)
    .single()

  if (error) throw error
  return data
}

export async function createInvoice(invoice: {
  customer_id: string
  number: string
  po_number?: string
  issue_date: string
  due_date: string
  currency?: string
  notes?: string
  terms?: string
  line_items: Array<{
    product_id?: string
    name: string
    description?: string
    quantity: number
    unit_price: number
    tax_rate: number
  }>
}) {
  const supabase = createClient()
  
  const { data: profile } = await supabase
    .from("profiles")
    .select("organization_id")
    .single()

  if (!profile) throw new Error("User profile not found")

  // Calculate totals
  const subtotal = invoice.line_items.reduce(
    (sum, item) => sum + item.quantity * item.unit_price,
    0
  )
  const tax_total = invoice.line_items.reduce(
    (sum, item) => sum + (item.quantity * item.unit_price * item.tax_rate) / 100,
    0
  )
  const total = subtotal + tax_total

  // Create invoice
  const { data: invoiceData, error: invoiceError } = await supabase
    .from("invoices")
    .insert({
      organization_id: profile.organization_id,
      customer_id: invoice.customer_id,
      number: invoice.number,
      po_number: invoice.po_number,
      status: "draft",
      issue_date: invoice.issue_date,
      due_date: invoice.due_date,
      currency: invoice.currency || "USD",
      subtotal,
      tax_total,
      total,
      notes: invoice.notes,
      terms: invoice.terms,
    })
    .select()
    .single()

  if (invoiceError) throw invoiceError

  // Create line items
  const lineItemsWithTotal = invoice.line_items.map((item) => ({
    invoice_id: invoiceData.id,
    product_id: item.product_id,
    name: item.name,
    description: item.description,
    quantity: item.quantity,
    unit_price: item.unit_price,
    tax_rate: item.tax_rate,
    total: item.quantity * item.unit_price * (1 + item.tax_rate / 100),
  }))

  const { error: lineItemsError } = await supabase
    .from("invoice_line_items")
    .insert(lineItemsWithTotal)

  if (lineItemsError) throw lineItemsError

  return invoiceData
}

export async function updateInvoiceStatus(id: string, status: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from("invoices")
    .update({ status })
    .eq("id", id)
    .select()
    .single()

  if (error) throw error
  return data
}

// =====================================================
// PAYMENTS
// =====================================================

export async function getPayments() {
  const supabase = createClient()
  const { data, error } = await supabase
    .from("payments")
    .select(`
      *,
      invoice:invoices(number, customer_id),
      customer:invoices(customer:customers(name))
    `)
    .order("date", { ascending: false })

  if (error) throw error
  return data
}

// =====================================================
// ORGANIZATION
// =====================================================

export async function getOrganization() {
  const supabase = createClient()
  const { data: profile } = await supabase
    .from("profiles")
    .select("organization_id")
    .single()

  if (!profile) throw new Error("User profile not found")

  const { data, error } = await supabase
    .from("organizations")
    .select("*, settings:organization_settings(*)")
    .eq("id", profile.organization_id)
    .single()

  if (error) throw error
  return data
}

export async function updateOrganization(updates: {
  name?: string
  legal_name?: string
  address?: string
  timezone?: string
  currency?: string
}) {
  const supabase = createClient()
  const { data: profile } = await supabase
    .from("profiles")
    .select("organization_id")
    .single()

  if (!profile) throw new Error("User profile not found")

  const { data, error } = await supabase
    .from("organizations")
    .update(updates)
    .eq("id", profile.organization_id)
    .select()
    .single()

  if (error) throw error
  return data
}

// =====================================================
// AUDIT EVENTS
// =====================================================

export async function createAuditEvent(event: {
  event: string
  entity: string
  entity_id: string
  details: string
  actor: string
}) {
  const supabase = createClient()
  const { data: profile } = await supabase
    .from("profiles")
    .select("organization_id")
    .single()

  if (!profile) throw new Error("User profile not found")

  const { data, error } = await supabase
    .from("audit_events")
    .insert({
      ...event,
      organization_id: profile.organization_id,
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function getAuditEvents(limit = 50) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from("audit_events")
    .select("*")
    .order("timestamp", { ascending: false })
    .limit(limit)

  if (error) throw error
  return data
}

// =====================================================
// STORAGE
// =====================================================

export async function uploadLogo(file: File, organizationId: string) {
  const supabase = createClient()
  const fileExt = file.name.split(".").pop()
  const fileName = `${organizationId}/logo.${fileExt}`

  const { data, error } = await supabase.storage
    .from("logos")
    .upload(fileName, file, {
      upsert: true,
    })

  if (error) throw error

  const { data: urlData } = supabase.storage
    .from("logos")
    .getPublicUrl(fileName)

  return urlData.publicUrl
}

export async function uploadAttachment(
  file: File,
  organizationId: string,
  invoiceId: string
) {
  const supabase = createClient()
  const fileName = `${organizationId}/${invoiceId}/${file.name}`

  const { data, error } = await supabase.storage
    .from("attachments")
    .upload(fileName, file)

  if (error) throw error

  // Create attachment record
  await supabase.from("attachments").insert({
    organization_id: organizationId,
    invoice_id: invoiceId,
    file_name: file.name,
    file_size: file.size,
    file_type: file.type,
    storage_path: fileName,
  })

  return data
}
