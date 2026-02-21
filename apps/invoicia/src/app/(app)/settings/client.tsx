"use client"

import Link from "next/link"
import { useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import {
  Building2,
  CheckCircle2,
  CreditCard,
  Lock,
  MoreHorizontal,
  Palette,
  Plus,
  Shield,
  Upload,
  Users,
  XCircle,
} from "lucide-react"
import { toast } from "sonner"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  billingSettingsAction,
  confirmTwoFactorEnrollmentSettingsAction,
  disableTwoFactorSettingsAction,
  inviteTeamMemberSettingsAction,
  manageTeamMemberSettingsAction,
  saveOrganizationSettingsAction,
  startTwoFactorEnrollmentSettingsAction,
  updatePasswordSettingsAction,
} from "./actions"

const timezones = [
  "UTC",
  "Africa/Lagos",
  "America/New_York",
  "America/Los_Angeles",
  "Europe/London",
  "Europe/Paris",
]

const currencies = ["USD", "EUR", "GBP", "NGN"] as const
const countries = ["US", "GB", "NG", "CA", "DE", "FR"]

interface TeamMember {
  id: string
  name: string
  email: string
  role: string
  initials: string
  joinedAt: string
}

interface OrganizationSettings {
  id: string
  name: string
  legalName: string | null
  email: string | null
  phone: string | null
  addressLine1: string | null
  addressLine2: string | null
  city: string | null
  state: string | null
  postalCode: string | null
  countryCode: string | null
  timezone: string
  currency: string
  invoicePrefix: string
  taxLabel: string | null
  taxPercent: number | null
  taxId: string | null
  logoPath: string | null
  brandPrimaryColor: string | null
}

interface SettingsClientProps {
  org: OrganizationSettings
  teamMembers: TeamMember[]
  twoFactorEnabled: boolean
  defaultTab: string
  currentRole: "OWNER" | "ADMIN" | "ACCOUNTANT" | "STAFF" | "READONLY"
  initialLogoUrl: string
}

interface OrganizationFormState {
  organizationName: string
  legalName: string
  email: string
  phone: string
  addressLine1: string
  addressLine2: string
  city: string
  state: string
  postalCode: string
  countryCode: string
  timezone: string
  currency: string
  invoicePrefix: string
  taxLabel: string
  taxPercent: string
  taxId: string
}

function toOrganizationForm(org: OrganizationSettings): OrganizationFormState {
  return {
    organizationName: org.name || "",
    legalName: org.legalName || "",
    email: org.email || "",
    phone: org.phone || "",
    addressLine1: org.addressLine1 || "",
    addressLine2: org.addressLine2 || "",
    city: org.city || "",
    state: org.state || "",
    postalCode: org.postalCode || "",
    countryCode: org.countryCode || "US",
    timezone: org.timezone || "UTC",
    currency: org.currency || "USD",
    invoicePrefix: org.invoicePrefix || "INV",
    taxLabel: org.taxLabel || "",
    taxPercent: org.taxPercent == null ? "" : String(org.taxPercent),
    taxId: org.taxId || "",
  }
}

function normalizeOrganizationForm(form: OrganizationFormState): OrganizationFormState {
  return {
    ...form,
    organizationName: form.organizationName.trim(),
    legalName: form.legalName.trim(),
    email: form.email.trim().toLowerCase(),
    phone: form.phone.trim(),
    addressLine1: form.addressLine1.trim(),
    addressLine2: form.addressLine2.trim(),
    city: form.city.trim(),
    state: form.state.trim(),
    postalCode: form.postalCode.trim(),
    countryCode: form.countryCode.trim().toUpperCase(),
    timezone: form.timezone.trim(),
    currency: form.currency.trim().toUpperCase(),
    invoicePrefix: form.invoicePrefix.trim().toUpperCase(),
    taxLabel: form.taxLabel.trim(),
    taxPercent: form.taxPercent.trim(),
    taxId: form.taxId.trim(),
  }
}

function completionScore(org: OrganizationFormState) {
  const checklist = [
    org.organizationName,
    org.legalName,
    org.email,
    org.phone,
    org.addressLine1,
    org.city,
    org.countryCode,
    org.invoicePrefix,
  ]
  const completed = checklist.filter((field) => Boolean(field.trim())).length
  return Math.round((completed / checklist.length) * 100)
}

export default function SettingsClient({
  org,
  teamMembers,
  twoFactorEnabled: initialTwoFactorEnabled,
  defaultTab,
  currentRole,
  initialLogoUrl,
}: SettingsClientProps) {
  const router = useRouter()
  const logoInputRef = useRef<HTMLInputElement>(null)
  const canEditOrganization = currentRole === "OWNER" || currentRole === "ADMIN" || currentRole === "ACCOUNTANT"
  const canManageTeam = currentRole === "OWNER" || currentRole === "ADMIN"
  const canManageBilling = currentRole === "OWNER" || currentRole === "ADMIN" || currentRole === "ACCOUNTANT"

  const initialOrganizationForm = useMemo(() => toOrganizationForm(org), [org])
  const [organizationBaseline, setOrganizationBaseline] = useState(initialOrganizationForm)
  const [organizationForm, setOrganizationForm] = useState(initialOrganizationForm)
  const [organizationSaving, setOrganizationSaving] = useState(false)
  const [organizationError, setOrganizationError] = useState("")

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })
  const [passwordSaving, setPasswordSaving] = useState(false)
  const [passwordError, setPasswordError] = useState("")

  const [twoFactorEnabled, setTwoFactorEnabled] = useState(initialTwoFactorEnabled)
  const [twoFactorSetupOpen, setTwoFactorSetupOpen] = useState(false)
  const [twoFactorSetupLoading, setTwoFactorSetupLoading] = useState(false)
  const [twoFactorVerifyLoading, setTwoFactorVerifyLoading] = useState(false)
  const [twoFactorDisableLoading, setTwoFactorDisableLoading] = useState(false)
  const [twoFactorQrCode, setTwoFactorQrCode] = useState("")
  const [twoFactorManualKey, setTwoFactorManualKey] = useState("")
  const [twoFactorCode, setTwoFactorCode] = useState("")
  const [twoFactorDisableCode, setTwoFactorDisableCode] = useState("")
  const [memberActionLoadingEmail, setMemberActionLoadingEmail] = useState("")
  const [inviteOpen, setInviteOpen] = useState(false)
  const [inviteLoading, setInviteLoading] = useState(false)
  const [inviteForm, setInviteForm] = useState({ email: "", role: "STAFF" })
  const [upgradeLoading, setUpgradeLoading] = useState(false)
  const [paymentUpdateLoading, setPaymentUpdateLoading] = useState(false)
  const [logoUploading, setLogoUploading] = useState(false)
  const [logoDeleting, setLogoDeleting] = useState(false)
  const [logoUrl, setLogoUrl] = useState(initialLogoUrl)
  const [logoName, setLogoName] = useState(org.logoPath ? org.logoPath.split(/[\\/]/).pop() || "" : "")

  const normalizedOrganizationForm = useMemo(
    () => normalizeOrganizationForm(organizationForm),
    [organizationForm],
  )
  const normalizedOrganizationBaseline = useMemo(
    () => normalizeOrganizationForm(organizationBaseline),
    [organizationBaseline],
  )
  const organizationHasChanges =
    JSON.stringify(normalizedOrganizationForm) !== JSON.stringify(normalizedOrganizationBaseline)
  const profileScore = completionScore(normalizedOrganizationForm)

  const updateOrganization = (key: keyof OrganizationFormState, value: string) => {
    setOrganizationForm((prev) => ({ ...prev, [key]: value }))
  }

  const handleOrganizationSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setOrganizationError("")

    if (!canEditOrganization) {
      toast.error("You do not have permission to update organization settings.")
      return
    }

    if (!normalizedOrganizationForm.organizationName) {
      const message = "Organization name is required."
      setOrganizationError(message)
      toast.error(message)
      return
    }
    if (!normalizedOrganizationForm.invoicePrefix || !/^[A-Z0-9-]{2,12}$/.test(normalizedOrganizationForm.invoicePrefix)) {
      const message = "Invoice prefix must be 2-12 characters using letters, numbers, or hyphens."
      setOrganizationError(message)
      toast.error(message)
      return
    }
    if (normalizedOrganizationForm.taxPercent && Number.isNaN(Number(normalizedOrganizationForm.taxPercent))) {
      const message = "Tax percent must be a number between 0 and 100."
      setOrganizationError(message)
      toast.error(message)
      return
    }

    const taxPercentValue = normalizedOrganizationForm.taxPercent ? Number(normalizedOrganizationForm.taxPercent) : null
    if (taxPercentValue != null && (taxPercentValue < 0 || taxPercentValue > 100)) {
      const message = "Tax percent must be between 0 and 100."
      setOrganizationError(message)
      toast.error(message)
      return
    }

    setOrganizationSaving(true)
    try {
      await saveOrganizationSettingsAction({
        ...normalizedOrganizationForm,
        taxPercent: taxPercentValue,
      })
      setOrganizationBaseline(normalizedOrganizationForm)
      setOrganizationForm(normalizedOrganizationForm)
      toast.success("Organization settings saved")
      router.refresh()
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to save settings"
      setOrganizationError(message)
      toast.error(message)
    } finally {
      setOrganizationSaving(false)
    }
  }

  const handleResetOrganization = () => {
    setOrganizationError("")
    setOrganizationForm(organizationBaseline)
    toast.success("Unsaved organization changes reset")
  }

  const handlePasswordSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setPasswordError("")

    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      const message = "All password fields are required"
      setPasswordError(message)
      toast.error(message)
      return
    }
    if (passwordForm.newPassword.length < 8) {
      const message = "New password must be at least 8 characters"
      setPasswordError(message)
      toast.error(message)
      return
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      const message = "New password and confirmation do not match"
      setPasswordError(message)
      toast.error(message)
      return
    }

    setPasswordSaving(true)
    try {
      await updatePasswordSettingsAction(passwordForm)
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" })
      toast.success("Password updated")
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to update password"
      setPasswordError(message)
      toast.error(message)
    } finally {
      setPasswordSaving(false)
    }
  }

  const handleStartTwoFactorSetup = async () => {
    setTwoFactorSetupLoading(true)
    try {
      const result = await startTwoFactorEnrollmentSettingsAction()
      setTwoFactorQrCode(result.qrCodeDataUrl)
      setTwoFactorManualKey(result.manualEntryKey)
      setTwoFactorCode("")
      setTwoFactorSetupOpen(true)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to start 2FA setup")
    } finally {
      setTwoFactorSetupLoading(false)
    }
  }

  const handleVerifyTwoFactorSetup = async () => {
    if (!twoFactorCode.trim()) {
      toast.error("Enter your 6-digit authenticator code.")
      return
    }

    setTwoFactorVerifyLoading(true)
    try {
      await confirmTwoFactorEnrollmentSettingsAction({ code: twoFactorCode })
      setTwoFactorEnabled(true)
      setTwoFactorSetupOpen(false)
      setTwoFactorQrCode("")
      setTwoFactorManualKey("")
      setTwoFactorCode("")
      toast.success("Two-factor authentication is now enabled.")
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to verify 2FA code")
    } finally {
      setTwoFactorVerifyLoading(false)
    }
  }

  const handleDisableTwoFactor = async () => {
    if (!twoFactorDisableCode.trim()) {
      toast.error("Enter a current 6-digit authenticator code to disable 2FA.")
      return
    }

    setTwoFactorDisableLoading(true)
    try {
      await disableTwoFactorSettingsAction({ code: twoFactorDisableCode })
      setTwoFactorEnabled(false)
      setTwoFactorDisableCode("")
      toast.success("Two-factor authentication disabled.")
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to disable 2FA")
    } finally {
      setTwoFactorDisableLoading(false)
    }
  }

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!canEditOrganization) {
      toast.error("You do not have permission to upload a logo.")
      event.target.value = ""
      return
    }
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file")
      event.target.value = ""
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Logo must be smaller than 10MB")
      event.target.value = ""
      return
    }

    setLogoUploading(true)
    try {
      const formData = new FormData()
      formData.append("file", file)
      const response = await fetch("/api/app/settings/logo", { method: "POST", body: formData })
      const body = (await response.json().catch(() => null)) as
        | { ok: boolean; error?: string; logoUrl?: string; fileName?: string }
        | null
      if (!response.ok || !body?.ok) {
        throw new Error(body?.error || "Failed to upload logo")
      }
      setLogoName(body.fileName || file.name)
      setLogoUrl(body.logoUrl || `/api/app/settings/logo?ts=${Date.now()}`)
      toast.success("Company logo uploaded")
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to upload logo")
    } finally {
      setLogoUploading(false)
      event.target.value = ""
    }
  }

  const handleRemoveLogo = async () => {
    if (!canEditOrganization) {
      toast.error("You do not have permission to remove the logo.")
      return
    }
    setLogoDeleting(true)
    try {
      const response = await fetch("/api/app/settings/logo", { method: "DELETE" })
      const body = (await response.json().catch(() => null)) as { ok?: boolean; error?: string } | null
      if (!response.ok || !body?.ok) {
        throw new Error(body?.error || "Failed to remove logo")
      }
      setLogoUrl("")
      setLogoName("")
      toast.success("Company logo removed")
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to remove logo")
    } finally {
      setLogoDeleting(false)
    }
  }

  const handleInviteSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!canManageTeam) {
      toast.error("Only owners and admins can invite members.")
      return
    }
    if (!inviteForm.email.trim()) {
      toast.error("Email is required")
      return
    }

    setInviteLoading(true)
    try {
      const result = await inviteTeamMemberSettingsAction({
        email: inviteForm.email.trim().toLowerCase(),
        role: inviteForm.role,
      })
      toast.success(`Invite request logged (${result.invitationId.slice(0, 8)})`)
      setInviteForm({ email: "", role: "STAFF" })
      setInviteOpen(false)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create invite request")
    } finally {
      setInviteLoading(false)
    }
  }

  const handleMemberAction = async (email: string, action: "change-role" | "remove" | "resend-invite") => {
    if (!canManageTeam) {
      toast.error("Only owners and admins can manage members.")
      return
    }
    setMemberActionLoadingEmail(email)
    try {
      await manageTeamMemberSettingsAction({ email, action })
      if (action === "remove") toast.success("Removal request logged")
      if (action === "change-role") toast.success("Role change request logged")
      if (action === "resend-invite") toast.success("Invite resend request logged")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to run member action")
    } finally {
      setMemberActionLoadingEmail("")
    }
  }

  const handleUpgrade = async () => {
    if (!canManageBilling) {
      toast.error("You do not have permission to manage billing.")
      return
    }
    setUpgradeLoading(true)
    try {
      await billingSettingsAction({ action: "upgrade", plan: "Professional" })
      toast.success("Upgrade request submitted")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to start upgrade")
    } finally {
      setUpgradeLoading(false)
    }
  }

  const handleUpdatePayment = async () => {
    if (!canManageBilling) {
      toast.error("You do not have permission to manage billing.")
      return
    }
    setPaymentUpdateLoading(true)
    try {
      await billingSettingsAction({ action: "payment-update", method: "card" })
      toast.success("Payment method update requested")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update payment method")
    } finally {
      setPaymentUpdateLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Settings</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage organization identity, permissions, security, and billing controls.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href="/templates" className="gap-1.5">
              <Palette className="h-4 w-4" /> Branding templates
            </Link>
          </Button>
          <Button asChild size="sm" variant="secondary">
            <Link href="/settings/orgs">Switch organization</Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Profile completeness</CardDescription>
            <CardTitle className="text-base">{profileScore}% configured</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Progress value={profileScore} className="h-2" />
            <p className="text-xs text-muted-foreground">Complete your profile for better invoice trust and deliverability.</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Team access</CardDescription>
            <CardTitle className="text-base">{teamMembers.length} members</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">Role model: OWNER, ADMIN, ACCOUNTANT, STAFF, READONLY.</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Security status</CardDescription>
            <CardTitle className="text-base">{twoFactorEnabled ? "2FA enabled" : "2FA not enabled"}</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge variant={twoFactorEnabled ? "secondary" : "outline"}>
              {twoFactorEnabled ? "Protected" : "Needs attention"}
            </Badge>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue={defaultTab}>
        <TabsList className="grid h-auto w-full grid-cols-2 gap-2 bg-transparent p-0 md:grid-cols-4">
          <TabsTrigger value="organization" className="gap-1.5 rounded-md border border-border px-3 py-2">
            <Building2 className="h-4 w-4" /> Organization
          </TabsTrigger>
          <TabsTrigger value="team" className="gap-1.5 rounded-md border border-border px-3 py-2">
            <Users className="h-4 w-4" /> Team
          </TabsTrigger>
          <TabsTrigger value="security" className="gap-1.5 rounded-md border border-border px-3 py-2">
            <Shield className="h-4 w-4" /> Security
          </TabsTrigger>
          <TabsTrigger value="billing" className="gap-1.5 rounded-md border border-border px-3 py-2">
            <CreditCard className="h-4 w-4" /> Billing
          </TabsTrigger>
        </TabsList>

        <TabsContent value="organization" className="mt-4 space-y-6">
          <div className="grid gap-6 xl:grid-cols-3">
            <Card className="xl:col-span-2">
              <CardHeader>
                <CardTitle className="text-base font-semibold">Organization profile</CardTitle>
                <CardDescription>Information used across invoices, receipts, and buyer-facing pages.</CardDescription>
              </CardHeader>
              <CardContent>
                <form className="space-y-4" onSubmit={handleOrganizationSubmit}>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label className="text-xs">Organization Name</Label>
                      <Input
                        value={organizationForm.organizationName}
                        onChange={(event) => updateOrganization("organizationName", event.target.value)}
                        className="h-9"
                        disabled={!canEditOrganization}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">Legal Name</Label>
                      <Input
                        value={organizationForm.legalName}
                        onChange={(event) => updateOrganization("legalName", event.target.value)}
                        className="h-9"
                        disabled={!canEditOrganization}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">Billing Email</Label>
                      <Input
                        type="email"
                        value={organizationForm.email}
                        onChange={(event) => updateOrganization("email", event.target.value)}
                        className="h-9"
                        disabled={!canEditOrganization}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">Phone</Label>
                      <Input
                        value={organizationForm.phone}
                        onChange={(event) => updateOrganization("phone", event.target.value)}
                        className="h-9"
                        disabled={!canEditOrganization}
                      />
                    </div>
                    <div className="space-y-2 sm:col-span-2">
                      <Label className="text-xs">Address Line 1</Label>
                      <Input
                        value={organizationForm.addressLine1}
                        onChange={(event) => updateOrganization("addressLine1", event.target.value)}
                        className="h-9"
                        disabled={!canEditOrganization}
                      />
                    </div>
                    <div className="space-y-2 sm:col-span-2">
                      <Label className="text-xs">Address Line 2</Label>
                      <Input
                        value={organizationForm.addressLine2}
                        onChange={(event) => updateOrganization("addressLine2", event.target.value)}
                        className="h-9"
                        disabled={!canEditOrganization}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">City</Label>
                      <Input
                        value={organizationForm.city}
                        onChange={(event) => updateOrganization("city", event.target.value)}
                        className="h-9"
                        disabled={!canEditOrganization}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">State / Region</Label>
                      <Input
                        value={organizationForm.state}
                        onChange={(event) => updateOrganization("state", event.target.value)}
                        className="h-9"
                        disabled={!canEditOrganization}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">Postal Code</Label>
                      <Input
                        value={organizationForm.postalCode}
                        onChange={(event) => updateOrganization("postalCode", event.target.value)}
                        className="h-9"
                        disabled={!canEditOrganization}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">Country</Label>
                      <Select
                        value={organizationForm.countryCode}
                        onValueChange={(value) => updateOrganization("countryCode", value)}
                        disabled={!canEditOrganization}
                      >
                        <SelectTrigger className="h-9">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {countries.map((country) => (
                            <SelectItem key={country} value={country}>
                              {country}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">Timezone</Label>
                      <Select
                        value={organizationForm.timezone}
                        onValueChange={(value) => updateOrganization("timezone", value)}
                        disabled={!canEditOrganization}
                      >
                        <SelectTrigger className="h-9">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {timezones.map((timezone) => (
                            <SelectItem key={timezone} value={timezone}>
                              {timezone}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">Default Currency</Label>
                      <Select
                        value={organizationForm.currency}
                        onValueChange={(value) => updateOrganization("currency", value)}
                        disabled={!canEditOrganization}
                      >
                        <SelectTrigger className="h-9">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {currencies.map((currency) => (
                            <SelectItem key={currency} value={currency}>
                              {currency}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">Invoice Prefix</Label>
                      <Input
                        value={organizationForm.invoicePrefix}
                        onChange={(event) => updateOrganization("invoicePrefix", event.target.value)}
                        className="h-9 font-mono"
                        disabled={!canEditOrganization}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">Tax Label</Label>
                      <Input
                        value={organizationForm.taxLabel}
                        onChange={(event) => updateOrganization("taxLabel", event.target.value)}
                        className="h-9"
                        disabled={!canEditOrganization}
                        placeholder="VAT, Sales Tax"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">Tax Percent</Label>
                      <Input
                        type="number"
                        min={0}
                        max={100}
                        value={organizationForm.taxPercent}
                        onChange={(event) => updateOrganization("taxPercent", event.target.value)}
                        className="h-9"
                        disabled={!canEditOrganization}
                        placeholder="7"
                      />
                    </div>
                    <div className="space-y-2 sm:col-span-2">
                      <Label className="text-xs">Tax ID</Label>
                      <Input
                        value={organizationForm.taxId}
                        onChange={(event) => updateOrganization("taxId", event.target.value)}
                        className="h-9"
                        disabled={!canEditOrganization}
                      />
                    </div>
                  </div>
                  {organizationError ? (
                    <p className="text-sm text-destructive">{organizationError}</p>
                  ) : null}
                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" type="submit" disabled={!canEditOrganization || organizationSaving || !organizationHasChanges}>
                      {organizationSaving ? "Saving..." : "Save changes"}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      type="button"
                      disabled={!organizationHasChanges || organizationSaving}
                      onClick={handleResetOrganization}
                    >
                      Reset
                    </Button>
                    {!canEditOrganization ? (
                      <Badge variant="outline">View only</Badge>
                    ) : null}
                  </div>
                </form>
              </CardContent>
            </Card>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base font-semibold">Company logo</CardTitle>
                  <CardDescription>Used on invoice PDF, hosted invoice pages, and receipts.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <input
                    ref={logoInputRef}
                    type="file"
                    accept="image/*"
                    aria-label="Upload company logo"
                    className="hidden"
                    onChange={handleLogoUpload}
                  />
                  <button
                    type="button"
                    className="w-full rounded-lg border-2 border-dashed border-border p-4 text-center transition-colors hover:border-primary/50"
                    onClick={() => logoInputRef.current?.click()}
                    disabled={logoUploading || !canEditOrganization}
                  >
                    {logoUrl ? (
                      <div className="space-y-2">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={logoUrl} alt="Company logo" className="mx-auto h-14 max-w-full object-contain" />
                        <p className="text-xs text-muted-foreground">{logoName || "Current logo"}</p>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <Upload className="mx-auto h-6 w-6 text-muted-foreground" />
                        <p className="text-xs text-muted-foreground">
                          {logoUploading ? "Uploading..." : "Click to upload company logo"}
                        </p>
                      </div>
                    )}
                  </button>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      type="button"
                      onClick={() => logoInputRef.current?.click()}
                      disabled={!canEditOrganization || logoUploading}
                    >
                      {logoUrl ? "Replace logo" : "Upload logo"}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      type="button"
                      onClick={handleRemoveLogo}
                      disabled={!logoUrl || !canEditOrganization || logoDeleting}
                    >
                      {logoDeleting ? "Removing..." : "Remove logo"}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">PNG, JPG, SVG, WebP or GIF. Max size 10MB.</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base font-semibold">Company details preview</CardTitle>
                </CardHeader>
                <CardContent className="space-y-1 text-sm">
                  <p className="font-semibold text-foreground">{normalizedOrganizationForm.legalName || normalizedOrganizationForm.organizationName}</p>
                  {normalizedOrganizationForm.addressLine1 ? <p className="text-muted-foreground">{normalizedOrganizationForm.addressLine1}</p> : null}
                  {normalizedOrganizationForm.addressLine2 ? <p className="text-muted-foreground">{normalizedOrganizationForm.addressLine2}</p> : null}
                  {normalizedOrganizationForm.city || normalizedOrganizationForm.state ? (
                    <p className="text-muted-foreground">{[normalizedOrganizationForm.city, normalizedOrganizationForm.state].filter(Boolean).join(", ")}</p>
                  ) : null}
                  {normalizedOrganizationForm.email ? <p className="text-muted-foreground">{normalizedOrganizationForm.email}</p> : null}
                  {normalizedOrganizationForm.phone ? <p className="text-muted-foreground">{normalizedOrganizationForm.phone}</p> : null}
                  <Separator className="my-3" />
                  <div className="text-xs text-muted-foreground">
                    <p>Invoice prefix: <span className="font-mono text-foreground">{normalizedOrganizationForm.invoicePrefix || "INV"}</span></p>
                    <p>Currency: {normalizedOrganizationForm.currency}</p>
                    <p>Timezone: {normalizedOrganizationForm.timezone}</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="team" className="mt-4 space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-semibold">Team members</CardTitle>
                <CardDescription>Manage user access and account roles for this workspace.</CardDescription>
              </div>
              <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="gap-1.5" disabled={!canManageTeam}>
                    <Plus className="h-3.5 w-3.5" /> Invite member
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Invite team member</DialogTitle>
                    <DialogDescription>Create an invite request with role access for this organization.</DialogDescription>
                  </DialogHeader>
                  <form className="space-y-4" onSubmit={handleInviteSubmit}>
                    <div className="space-y-2">
                      <Label htmlFor="invite-email">Email</Label>
                      <Input
                        id="invite-email"
                        type="email"
                        value={inviteForm.email}
                        onChange={(event) => setInviteForm((prev) => ({ ...prev, email: event.target.value }))}
                        placeholder="teammate@company.com"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Role</Label>
                      <Select value={inviteForm.role} onValueChange={(value) => setInviteForm((prev) => ({ ...prev, role: value }))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ADMIN">Admin</SelectItem>
                          <SelectItem value="ACCOUNTANT">Accountant</SelectItem>
                          <SelectItem value="STAFF">Staff</SelectItem>
                          <SelectItem value="READONLY">Readonly</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <DialogFooter>
                      <Button type="submit" disabled={inviteLoading}>
                        {inviteLoading ? "Submitting..." : "Create invite request"}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Member</TableHead>
                    <TableHead className="text-xs">Role</TableHead>
                    <TableHead className="text-xs">Joined</TableHead>
                    <TableHead className="w-10" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {teamMembers.map((member) => (
                    <TableRow key={`${member.id}-${member.email}`}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                              {member.initials}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-sm font-medium text-foreground">{member.name}</p>
                            <p className="text-xs text-muted-foreground">{member.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">{member.role}</Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {new Date(member.joinedAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              type="button"
                              disabled={!canManageTeam || memberActionLoadingEmail === member.email}
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleMemberAction(member.email, "change-role")}>
                              Request role change
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleMemberAction(member.email, "resend-invite")}>
                              Resend invite
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleMemberAction(member.email, "remove")} className="text-destructive">
                              Request removal
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                  {teamMembers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="py-10 text-center text-sm text-muted-foreground">
                        No team members yet.
                      </TableCell>
                    </TableRow>
                  ) : null}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="mt-4 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold">Two-factor authentication</CardTitle>
              <CardDescription>Use an authenticator app to secure sign-in with rotating TOTP codes.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4 rounded-lg border border-dashed border-border p-5">
                <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-muted">
                  <Lock className="h-5 w-5 text-muted-foreground" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">{twoFactorEnabled ? "2FA is enabled" : "2FA is not enabled"}</p>
                  <p className="text-xs text-muted-foreground">
                    {twoFactorEnabled
                      ? "Your next password sign-in requires a 6-digit authenticator code."
                      : "Enable 2FA to protect access with a second factor."}
                  </p>
                </div>
                {twoFactorEnabled ? (
                  <Badge variant="secondary">Enabled</Badge>
                ) : (
                  <Badge variant="outline">Not enabled</Badge>
                )}
              </div>

              {!twoFactorEnabled ? (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    type="button"
                    onClick={handleStartTwoFactorSetup}
                    disabled={twoFactorSetupLoading}
                  >
                    {twoFactorSetupLoading ? "Preparing..." : "Set up 2FA"}
                  </Button>
                  <Dialog
                    open={twoFactorSetupOpen}
                    onOpenChange={(open) => {
                      setTwoFactorSetupOpen(open)
                      if (!open) {
                        setTwoFactorCode("")
                        setTwoFactorQrCode("")
                        setTwoFactorManualKey("")
                      }
                    }}
                  >
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Set up two-factor authentication</DialogTitle>
                      <DialogDescription>
                        Scan this QR code in Google Authenticator, Authy, 1Password, or another TOTP app.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      {twoFactorQrCode ? (
                        <div className="rounded-lg border border-border p-4">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={twoFactorQrCode} alt="2FA setup QR code" className="mx-auto h-44 w-44" />
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">Generating secure setup QR code...</p>
                      )}
                      {twoFactorManualKey ? (
                        <div className="space-y-2">
                          <Label className="text-xs">Manual key</Label>
                          <div className="rounded-md bg-muted px-3 py-2 font-mono text-xs">{twoFactorManualKey}</div>
                        </div>
                      ) : null}
                      <div className="space-y-2">
                        <Label htmlFor="two-factor-code">Enter 6-digit code</Label>
                        <Input
                          id="two-factor-code"
                          inputMode="numeric"
                          placeholder="123456"
                          value={twoFactorCode}
                          onChange={(event) => setTwoFactorCode(event.target.value)}
                          className="h-10"
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button
                        type="button"
                        onClick={handleVerifyTwoFactorSetup}
                        disabled={twoFactorVerifyLoading || !twoFactorQrCode}
                      >
                        {twoFactorVerifyLoading ? "Verifying..." : "Verify and enable"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
                </>
              ) : (
                <div className="space-y-2">
                  <Label htmlFor="disable-two-factor-code" className="text-xs">
                    Enter current authenticator code to disable 2FA
                  </Label>
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <Input
                      id="disable-two-factor-code"
                      inputMode="numeric"
                      placeholder="123456"
                      value={twoFactorDisableCode}
                      onChange={(event) => setTwoFactorDisableCode(event.target.value)}
                      className="h-9 sm:max-w-[180px]"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      type="button"
                      onClick={handleDisableTwoFactor}
                      disabled={twoFactorDisableLoading}
                    >
                      {twoFactorDisableLoading ? "Disabling..." : "Disable 2FA"}
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold">Change password</CardTitle>
              <CardDescription>Use a strong password of at least 8 characters.</CardDescription>
            </CardHeader>
            <CardContent>
              <form className="space-y-4" onSubmit={handlePasswordSubmit}>
                <div className="space-y-2">
                  <Label className="text-xs">Current password</Label>
                  <Input
                    type="password"
                    className="h-9"
                    value={passwordForm.currentPassword}
                    onChange={(event) => setPasswordForm((prev) => ({ ...prev, currentPassword: event.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">New password</Label>
                  <Input
                    type="password"
                    className="h-9"
                    value={passwordForm.newPassword}
                    onChange={(event) => setPasswordForm((prev) => ({ ...prev, newPassword: event.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Confirm new password</Label>
                  <Input
                    type="password"
                    className="h-9"
                    value={passwordForm.confirmPassword}
                    onChange={(event) => setPasswordForm((prev) => ({ ...prev, confirmPassword: event.target.value }))}
                  />
                </div>
                {passwordError ? (
                  <p className="text-sm text-destructive">{passwordError}</p>
                ) : null}
                <Button size="sm" type="submit" disabled={passwordSaving}>
                  {passwordSaving ? "Updating..." : "Update password"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="billing" className="mt-4 space-y-6">
          <div className="rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30 p-4 flex items-start gap-3">
            <CreditCard className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">Stripe billing — coming soon</p>
              <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">
                Subscription management and payment method updates via Stripe are under development.
                The plan and payment details below are illustrative.
              </p>
            </div>
          </div>

          <Card className="opacity-60 pointer-events-none select-none">
            <CardHeader>
              <CardTitle className="text-base font-semibold">Current plan</CardTitle>
              <CardDescription>Active subscription and entitlement settings.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border p-4">
                <div>
                  <p className="text-sm font-semibold text-foreground">Professional</p>
                  <p className="text-xs text-muted-foreground">$29/month · Unlimited invoices, 5 team members</p>
                </div>
                <Button variant="outline" size="sm" type="button" disabled>
                  Upgrade plan
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="opacity-60 pointer-events-none select-none">
            <CardHeader>
              <CardTitle className="text-base font-semibold">Payment method</CardTitle>
              <CardDescription>Manage payout and billing card details.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap items-center gap-3 rounded-lg border border-border p-4">
                <CreditCard className="h-5 w-5 text-muted-foreground" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">Not yet configured</p>
                  <p className="text-xs text-muted-foreground">Stripe integration coming soon</p>
                </div>
                <Button variant="ghost" size="sm" type="button" disabled>
                  Update payment
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold">Billing permissions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>Your role: <span className="font-medium text-foreground">{currentRole}</span></p>
              <p>
                {canManageBilling ? (
                  <span className="inline-flex items-center gap-1 text-foreground"><CheckCircle2 className="h-4 w-4 text-emerald-500" /> You can manage billing actions.</span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-foreground"><XCircle className="h-4 w-4 text-amber-500" /> Billing is view-only for your role.</span>
                )}
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
