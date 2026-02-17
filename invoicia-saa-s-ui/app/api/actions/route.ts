import { promises as fs } from "node:fs"
import path from "node:path"
import { NextResponse } from "next/server"

type ActionPayload = Record<string, unknown>

interface UiActionRequest {
  type: string
  payload?: ActionPayload
}

interface StoredUiAction {
  id: string
  type: string
  payload: ActionPayload
  createdAt: string
}

interface StoredUiActions {
  actions: StoredUiAction[]
}

const STORE_DIR = path.join(process.cwd(), ".data")
const STORE_FILE = path.join(STORE_DIR, "ui-actions.json")

function isRecord(value: unknown): value is ActionPayload {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0
}

async function readStore(): Promise<StoredUiActions> {
  try {
    const raw = await fs.readFile(STORE_FILE, "utf8")
    const parsed = JSON.parse(raw) as StoredUiActions
    if (!Array.isArray(parsed.actions)) {
      return { actions: [] }
    }
    return parsed
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return { actions: [] }
    }
    throw error
  }
}

async function writeStore(store: StoredUiActions): Promise<void> {
  await fs.mkdir(STORE_DIR, { recursive: true })
  await fs.writeFile(STORE_FILE, JSON.stringify(store, null, 2), "utf8")
}

function validatePayload(action: UiActionRequest): string | null {
  const { type, payload } = action
  const data = payload ?? {}

  if (type === "auth.login.email") {
    if (!isNonEmptyString(data.email)) return "Email is required"
    if (!isNonEmptyString(data.password)) return "Password is required"
  }

  if (type === "auth.signup.email") {
    if (!isNonEmptyString(data.firstName)) return "First name is required"
    if (!isNonEmptyString(data.lastName)) return "Last name is required"
    if (!isNonEmptyString(data.email)) return "Email is required"
    if (!isNonEmptyString(data.password)) return "Password is required"
    if ((data.password as string).length < 8) return "Password must be at least 8 characters"
  }

  if (type === "settings.organization.save") {
    const required = ["organizationName", "legalName", "address", "timezone", "currency"] as const
    const missing = required.find((key) => !isNonEmptyString(data[key]))
    if (missing) {
      return `${missing} is required`
    }
  }

  if (type === "settings.password.update") {
    if (!isNonEmptyString(data.currentPassword)) return "Current password is required"
    if (!isNonEmptyString(data.newPassword)) return "New password is required"
    if (!isNonEmptyString(data.confirmPassword)) return "Confirm password is required"
    if ((data.newPassword as string).length < 8) return "New password must be at least 8 characters"
    if (data.newPassword !== data.confirmPassword) return "Passwords do not match"
  }

  if (type === "invoices.new.send" || type === "invoices.new.save") {
    if (!isNonEmptyString(data.customerId)) return "Customer is required"
    if (!isNonEmptyString(data.invoiceNumber)) return "Invoice number is required"
    if (!Array.isArray(data.lineItems) || data.lineItems.length === 0) return "At least one line item is required"
  }

  if (type === "products.create") {
    if (!isNonEmptyString(data.name)) return "Product name is required"
    if (!isNonEmptyString(data.unit)) return "Unit is required"
    const amount = Number(data.unitPrice)
    if (!Number.isFinite(amount) || amount < 0) return "Unit price must be a valid number"
  }

  if (type === "customers.create") {
    if (!isNonEmptyString(data.name)) return "Customer name is required"
    if (!isNonEmptyString(data.email)) return "Customer email is required"
  }

  return null
}

export const runtime = "nodejs"

export async function POST(request: Request) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ ok: false, message: "Invalid JSON body" }, { status: 400 })
  }

  if (!isRecord(body) || !isNonEmptyString(body.type)) {
    return NextResponse.json({ ok: false, message: "Action type is required" }, { status: 400 })
  }

  const type = body.type.trim()
  const payload = isRecord(body.payload) ? body.payload : {}
  const action: UiActionRequest = { type, payload }

  const validationError = validatePayload(action)
  if (validationError) {
    return NextResponse.json({ ok: false, message: validationError }, { status: 400 })
  }

  const store = await readStore()
  const entry: StoredUiAction = {
    id: crypto.randomUUID(),
    type,
    payload,
    createdAt: new Date().toISOString(),
  }
  store.actions = [entry, ...store.actions].slice(0, 1000)
  await writeStore(store)

  return NextResponse.json({ ok: true, id: entry.id })
}
