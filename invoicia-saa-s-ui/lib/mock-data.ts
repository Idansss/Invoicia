export type InvoiceStatus = "draft" | "sent" | "viewed" | "overdue" | "paid" | "void"
export type DisputeStatus = "open" | "resolved" | "rejected"
export type PaymentStatus = "successful" | "failed" | "pending"
export type ReminderTone = "friendly" | "firm" | "final"

export interface Invoice {
  id: string
  number: string
  customerId: string
  customerName: string
  customerEmail: string
  status: InvoiceStatus
  amount: number
  currency: string
  issueDate: string
  dueDate: string
  paidDate?: string
  items: LineItem[]
  notes?: string
  terms?: string
  poNumber?: string
}

export interface LineItem {
  id: string
  name: string
  description: string
  quantity: number
  unitPrice: number
  tax: number
  total: number
}

export interface Customer {
  id: string
  name: string
  email: string
  company: string
  defaultTerms: string
  totalInvoiced: number
  outstanding: number
  avatar?: string
}

export interface Product {
  id: string
  name: string
  description: string
  unitPrice: number
  taxCategory: string
  unit: string
}

export interface Payment {
  id: string
  invoiceId: string
  invoiceNumber: string
  customerName: string
  amount: number
  currency: string
  status: PaymentStatus
  method: string
  date: string
}

export interface AuditEvent {
  id: string
  event: string
  actor: string
  entity: string
  entityId: string
  timestamp: string
  details: string
}

export interface Dispute {
  id: string
  invoiceId: string
  invoiceNumber: string
  status: DisputeStatus
  message: string
  createdAt: string
  resolvedAt?: string
}

export interface ReminderRule {
  id: string
  timing: string
  dayOffset: number
  tone: ReminderTone
  enabled: boolean
  subject: string
  body: string
}

export const mockInvoices: Invoice[] = [
  {
    id: "inv-1",
    number: "INV-2026-000123",
    customerId: "cust-1",
    customerName: "Acme Corporation",
    customerEmail: "billing@acme.co",
    status: "paid",
    amount: 12500.0,
    currency: "USD",
    issueDate: "2026-01-15",
    dueDate: "2026-02-14",
    paidDate: "2026-02-10",
    items: [
      { id: "li-1", name: "Web Development", description: "Frontend development - Phase 1", quantity: 50, unitPrice: 150, tax: 10, total: 8250 },
      { id: "li-2", name: "UI/UX Design", description: "Design system creation", quantity: 25, unitPrice: 170, tax: 10, total: 4675 },
    ],
    notes: "Thank you for your business!",
    terms: "Net 30",
    poNumber: "PO-2026-001",
  },
  {
    id: "inv-2",
    number: "INV-2026-000124",
    customerId: "cust-2",
    customerName: "TechStart Inc.",
    customerEmail: "finance@techstart.io",
    status: "sent",
    amount: 8750.0,
    currency: "USD",
    issueDate: "2026-01-20",
    dueDate: "2026-02-19",
    items: [
      { id: "li-3", name: "API Development", description: "REST API implementation", quantity: 35, unitPrice: 175, tax: 10, total: 6737.5 },
      { id: "li-4", name: "Testing", description: "QA and testing services", quantity: 15, unitPrice: 130, tax: 10, total: 2145 },
    ],
    notes: "Please remit payment by due date.",
    terms: "Net 30",
  },
  {
    id: "inv-3",
    number: "INV-2026-000125",
    customerId: "cust-3",
    customerName: "Global Retail Ltd.",
    customerEmail: "accounts@globalretail.com",
    status: "overdue",
    amount: 24300.0,
    currency: "USD",
    issueDate: "2025-12-01",
    dueDate: "2025-12-31",
    items: [
      { id: "li-5", name: "E-commerce Platform", description: "Custom e-commerce build", quantity: 120, unitPrice: 160, tax: 10, total: 21120 },
      { id: "li-6", name: "Training", description: "Staff training sessions", quantity: 6, unitPrice: 500, tax: 10, total: 3300 },
    ],
    terms: "Net 30",
  },
  {
    id: "inv-4",
    number: "INV-2026-000126",
    customerId: "cust-4",
    customerName: "Design Studio Pro",
    customerEmail: "hello@designstudiopro.com",
    status: "draft",
    amount: 3200.0,
    currency: "USD",
    issueDate: "2026-02-01",
    dueDate: "2026-03-03",
    items: [
      { id: "li-7", name: "Brand Consultation", description: "Brand strategy workshop", quantity: 8, unitPrice: 250, tax: 10, total: 2200 },
      { id: "li-8", name: "Logo Design", description: "Logo concepts and revisions", quantity: 1, unitPrice: 1000, tax: 0, total: 1000 },
    ],
    notes: "Draft - review before sending",
  },
  {
    id: "inv-5",
    number: "INV-2026-000127",
    customerId: "cust-5",
    customerName: "CloudSync Systems",
    customerEmail: "ap@cloudsync.dev",
    status: "viewed",
    amount: 15800.0,
    currency: "USD",
    issueDate: "2026-01-28",
    dueDate: "2026-02-27",
    items: [
      { id: "li-9", name: "Cloud Migration", description: "AWS migration services", quantity: 60, unitPrice: 200, tax: 10, total: 13200 },
      { id: "li-10", name: "Monitoring Setup", description: "Infrastructure monitoring", quantity: 10, unitPrice: 260, tax: 10, total: 2860 },
    ],
    terms: "Net 30",
    poNumber: "PO-CS-2026-042",
  },
  {
    id: "inv-6",
    number: "INV-2026-000128",
    customerId: "cust-1",
    customerName: "Acme Corporation",
    customerEmail: "billing@acme.co",
    status: "paid",
    amount: 6400.0,
    currency: "USD",
    issueDate: "2025-12-15",
    dueDate: "2026-01-14",
    paidDate: "2026-01-12",
    items: [
      { id: "li-11", name: "Maintenance", description: "Monthly maintenance contract", quantity: 1, unitPrice: 6400, tax: 0, total: 6400 },
    ],
    terms: "Net 30",
  },
  {
    id: "inv-7",
    number: "INV-2026-000129",
    customerId: "cust-6",
    customerName: "FinTech Solutions",
    customerEmail: "invoices@fintechsol.com",
    status: "void",
    amount: 9200.0,
    currency: "USD",
    issueDate: "2025-11-01",
    dueDate: "2025-12-01",
    items: [
      { id: "li-12", name: "Compliance Audit", description: "Financial compliance review", quantity: 40, unitPrice: 230, tax: 0, total: 9200 },
    ],
    terms: "Net 30",
  },
  {
    id: "inv-8",
    number: "INV-2026-000130",
    customerId: "cust-2",
    customerName: "TechStart Inc.",
    customerEmail: "finance@techstart.io",
    status: "sent",
    amount: 4500.0,
    currency: "USD",
    issueDate: "2026-02-05",
    dueDate: "2026-03-07",
    items: [
      { id: "li-13", name: "Consulting", description: "Technical consulting hours", quantity: 20, unitPrice: 225, tax: 0, total: 4500 },
    ],
    terms: "Net 30",
  },
]

export const mockCustomers: Customer[] = [
  { id: "cust-1", name: "Acme Corporation", email: "billing@acme.co", company: "Acme Corp", defaultTerms: "Net 30", totalInvoiced: 18900, outstanding: 0 },
  { id: "cust-2", name: "TechStart Inc.", email: "finance@techstart.io", company: "TechStart", defaultTerms: "Net 30", totalInvoiced: 13250, outstanding: 13250 },
  { id: "cust-3", name: "Global Retail Ltd.", email: "accounts@globalretail.com", company: "Global Retail", defaultTerms: "Net 30", totalInvoiced: 24300, outstanding: 24300 },
  { id: "cust-4", name: "Design Studio Pro", email: "hello@designstudiopro.com", company: "Design Studio Pro", defaultTerms: "Net 30", totalInvoiced: 3200, outstanding: 3200 },
  { id: "cust-5", name: "CloudSync Systems", email: "ap@cloudsync.dev", company: "CloudSync", defaultTerms: "Net 30", totalInvoiced: 15800, outstanding: 15800 },
  { id: "cust-6", name: "FinTech Solutions", email: "invoices@fintechsol.com", company: "FinTech Solutions", defaultTerms: "Net 15", totalInvoiced: 9200, outstanding: 0 },
]

export const mockProducts: Product[] = [
  { id: "prod-1", name: "Web Development", description: "Full-stack web development services", unitPrice: 150, taxCategory: "Services", unit: "hour" },
  { id: "prod-2", name: "UI/UX Design", description: "User interface and experience design", unitPrice: 170, taxCategory: "Services", unit: "hour" },
  { id: "prod-3", name: "API Development", description: "RESTful API development and integration", unitPrice: 175, taxCategory: "Services", unit: "hour" },
  { id: "prod-4", name: "Cloud Migration", description: "Cloud infrastructure migration services", unitPrice: 200, taxCategory: "Services", unit: "hour" },
  { id: "prod-5", name: "Technical Consulting", description: "Expert technical consulting", unitPrice: 225, taxCategory: "Services", unit: "hour" },
  { id: "prod-6", name: "QA Testing", description: "Quality assurance and testing", unitPrice: 130, taxCategory: "Services", unit: "hour" },
  { id: "prod-7", name: "Training Session", description: "On-site or remote training", unitPrice: 500, taxCategory: "Services", unit: "session" },
  { id: "prod-8", name: "Monthly Maintenance", description: "Ongoing maintenance and support", unitPrice: 6400, taxCategory: "Services", unit: "month" },
]

export const mockPayments: Payment[] = [
  { id: "pay-1", invoiceId: "inv-1", invoiceNumber: "INV-2026-000123", customerName: "Acme Corporation", amount: 12500, currency: "USD", status: "successful", method: "Bank Transfer", date: "2026-02-10" },
  { id: "pay-2", invoiceId: "inv-6", invoiceNumber: "INV-2026-000128", customerName: "Acme Corporation", amount: 6400, currency: "USD", status: "successful", method: "Credit Card", date: "2026-01-12" },
  { id: "pay-3", invoiceId: "inv-3", invoiceNumber: "INV-2026-000125", customerName: "Global Retail Ltd.", amount: 24300, currency: "USD", status: "failed", method: "Bank Transfer", date: "2026-01-05" },
  { id: "pay-4", invoiceId: "inv-5", invoiceNumber: "INV-2026-000127", customerName: "CloudSync Systems", amount: 15800, currency: "USD", status: "pending", method: "ACH", date: "2026-02-08" },
  { id: "pay-5", invoiceId: "inv-2", invoiceNumber: "INV-2026-000124", customerName: "TechStart Inc.", amount: 8750, currency: "USD", status: "pending", method: "Credit Card", date: "2026-02-09" },
]

export const mockAuditEvents: AuditEvent[] = [
  { id: "audit-1", event: "invoice.created", actor: "John Smith", entity: "Invoice", entityId: "INV-2026-000130", timestamp: "2026-02-05T10:30:00Z", details: "Created invoice for TechStart Inc." },
  { id: "audit-2", event: "invoice.sent", actor: "John Smith", entity: "Invoice", entityId: "INV-2026-000124", timestamp: "2026-01-20T14:15:00Z", details: "Sent invoice to TechStart Inc. via email" },
  { id: "audit-3", event: "payment.received", actor: "System", entity: "Payment", entityId: "PAY-001", timestamp: "2026-02-10T09:00:00Z", details: "Payment of $12,500 received from Acme Corporation" },
  { id: "audit-4", event: "customer.created", actor: "Jane Doe", entity: "Customer", entityId: "cust-5", timestamp: "2026-01-25T11:00:00Z", details: "Added new customer CloudSync Systems" },
  { id: "audit-5", event: "invoice.overdue", actor: "System", entity: "Invoice", entityId: "INV-2026-000125", timestamp: "2026-01-01T00:00:00Z", details: "Invoice for Global Retail Ltd. is now overdue" },
  { id: "audit-6", event: "invoice.voided", actor: "John Smith", entity: "Invoice", entityId: "INV-2026-000129", timestamp: "2025-12-15T16:00:00Z", details: "Voided invoice for FinTech Solutions" },
  { id: "audit-7", event: "reminder.sent", actor: "System", entity: "Reminder", entityId: "REM-003", timestamp: "2026-01-08T08:00:00Z", details: "Overdue reminder sent to Global Retail Ltd." },
  { id: "audit-8", event: "settings.updated", actor: "Jane Doe", entity: "Settings", entityId: "ORG-001", timestamp: "2026-01-10T13:30:00Z", details: "Updated organization timezone to UTC-5" },
]

export const mockDisputes: Dispute[] = [
  { id: "disp-1", invoiceId: "inv-3", invoiceNumber: "INV-2026-000125", status: "open", message: "The hours billed for e-commerce development seem higher than agreed. Can we review the time logs?", createdAt: "2026-01-05T10:00:00Z" },
  { id: "disp-2", invoiceId: "inv-1", invoiceNumber: "INV-2026-000123", status: "resolved", message: "Tax calculation was incorrect on line item 2.", createdAt: "2026-01-20T09:00:00Z", resolvedAt: "2026-01-25T14:00:00Z" },
]

export const mockReminderRules: ReminderRule[] = [
  { id: "rem-1", timing: "3 days before due", dayOffset: -3, tone: "friendly", enabled: true, subject: "Friendly reminder: Invoice {{number}} due soon", body: "Hi {{name}}, just a friendly reminder that invoice {{number}} for {{amount}} is due on {{dueDate}}. Please let us know if you have any questions." },
  { id: "rem-2", timing: "On due date", dayOffset: 0, tone: "firm", enabled: true, subject: "Invoice {{number}} is due today", body: "Dear {{name}}, this is a reminder that invoice {{number}} for {{amount}} is due today. Please arrange payment at your earliest convenience." },
  { id: "rem-3", timing: "7 days after due", dayOffset: 7, tone: "firm", enabled: true, subject: "Overdue: Invoice {{number}}", body: "Dear {{name}}, invoice {{number}} for {{amount}} is now 7 days overdue. Please arrange payment immediately to avoid further action." },
  { id: "rem-4", timing: "14 days after due", dayOffset: 14, tone: "final", enabled: false, subject: "Final notice: Invoice {{number}}", body: "Dear {{name}}, this is our final notice regarding overdue invoice {{number}} for {{amount}}. Please contact us immediately to resolve this matter." },
]

export function formatCurrency(amount: number, currency = "USD"): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(amount)
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
}

export function formatDateTime(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" })
}