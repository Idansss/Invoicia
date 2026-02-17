"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Building2, Users, Shield, CreditCard, Plus, MoreHorizontal, Lock } from "lucide-react"
import { toast } from "sonner"
import { getActionErrorMessage, runUiAction } from "@/lib/ui-action-client"

const teamMembers = [
  { name: "John Smith", email: "john@acmecorp.com", role: "Owner", initials: "JS" },
  { name: "Jane Doe", email: "jane@acmecorp.com", role: "Admin", initials: "JD" },
  { name: "Mike Johnson", email: "mike@acmecorp.com", role: "Member", initials: "MJ" },
]

export default function SettingsPage() {
  const [organizationForm, setOrganizationForm] = useState({
    organizationName: "Acme Corporation",
    legalName: "Acme Corp Inc.",
    address: "123 Business Ave, Suite 100, San Francisco, CA 94105",
    timezone: "est",
    currency: "USD",
  })
  const [organizationSaving, setOrganizationSaving] = useState(false)
  const [organizationError, setOrganizationError] = useState("")

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })
  const [passwordSaving, setPasswordSaving] = useState(false)
  const [passwordError, setPasswordError] = useState("")

  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false)
  const [twoFactorLoading, setTwoFactorLoading] = useState(false)
  const [inviteLoading, setInviteLoading] = useState(false)
  const [upgradeLoading, setUpgradeLoading] = useState(false)
  const [paymentUpdateLoading, setPaymentUpdateLoading] = useState(false)

  const handleOrganizationSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setOrganizationError("")

    if (Object.values(organizationForm).some((value) => !value.trim())) {
      const message = "All organization fields are required"
      setOrganizationError(message)
      toast.error(message)
      return
    }

    setOrganizationSaving(true)
    try {
      await runUiAction({
        type: "settings.organization.save",
        payload: organizationForm,
      })
      toast.success("Settings saved")
    } catch (error) {
      const message = getActionErrorMessage(error)
      setOrganizationError(message)
      toast.error(message)
    } finally {
      setOrganizationSaving(false)
    }
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
      await runUiAction({
        type: "settings.password.update",
        payload: passwordForm,
      })
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" })
      toast.success("Password updated")
    } catch (error) {
      const message = getActionErrorMessage(error)
      setPasswordError(message)
      toast.error(message)
    } finally {
      setPasswordSaving(false)
    }
  }

  const runQuickAction = async (
    type: string,
    payload: Record<string, unknown>,
    options: {
      setLoading: (value: boolean) => void
      successMessage: string
    }
  ) => {
    options.setLoading(true)
    try {
      await runUiAction({ type, payload })
      toast.success(options.successMessage)
      return true
    } catch (error) {
      toast.error(getActionErrorMessage(error))
      return false
    } finally {
      options.setLoading(false)
    }
  }

  const handleEnableTwoFactor = async () => {
    const success = await runQuickAction("settings.2fa.enable", { enabled: true }, {
      setLoading: setTwoFactorLoading,
      successMessage: "Two-factor authentication enabled",
    })
    if (success) {
      setTwoFactorEnabled(true)
    }
  }

  const handleInvite = async () => {
    await runQuickAction("settings.team.invite", { role: "Member" }, {
      setLoading: setInviteLoading,
      successMessage: "Invite link generated",
    })
  }

  const handleUpgrade = async () => {
    await runQuickAction("settings.billing.upgrade", { plan: "Professional" }, {
      setLoading: setUpgradeLoading,
      successMessage: "Upgrade flow started",
    })
  }

  const handleUpdatePayment = async () => {
    await runQuickAction("settings.billing.payment.update", { method: "card" }, {
      setLoading: setPaymentUpdateLoading,
      successMessage: "Payment method update started",
    })
  }

  const handleMemberAction = async (email: string) => {
    await runQuickAction("settings.team.member.manage", { email }, {
      setLoading: () => undefined,
      successMessage: "Member management action opened",
    })
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage your organization and account preferences</p>
      </div>

      <Tabs defaultValue="organization">
        <TabsList>
          <TabsTrigger value="organization" className="gap-1.5"><Building2 className="h-3.5 w-3.5" /> Organization</TabsTrigger>
          <TabsTrigger value="team" className="gap-1.5"><Users className="h-3.5 w-3.5" /> Team</TabsTrigger>
          <TabsTrigger value="security" className="gap-1.5"><Shield className="h-3.5 w-3.5" /> Security</TabsTrigger>
          <TabsTrigger value="billing" className="gap-1.5"><CreditCard className="h-3.5 w-3.5" /> Billing</TabsTrigger>
        </TabsList>

        <TabsContent value="organization" className="mt-4 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold text-foreground">Organization Details</CardTitle>
              <CardDescription>Basic information about your organization</CardDescription>
            </CardHeader>
            <CardContent>
              <form className="space-y-4" onSubmit={handleOrganizationSubmit}>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-xs">Organization Name</Label>
                    <Input
                      value={organizationForm.organizationName}
                      onChange={(event) => setOrganizationForm((prev) => ({ ...prev, organizationName: event.target.value }))}
                      className="h-9"
                    />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Legal Name</Label>
                    <Input
                      value={organizationForm.legalName}
                      onChange={(event) => setOrganizationForm((prev) => ({ ...prev, legalName: event.target.value }))}
                      className="h-9"
                    />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label className="text-xs">Address</Label>
                    <Input
                      value={organizationForm.address}
                      onChange={(event) => setOrganizationForm((prev) => ({ ...prev, address: event.target.value }))}
                      className="h-9"
                    />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Timezone</Label>
                    <Select value={organizationForm.timezone} onValueChange={(value) => setOrganizationForm((prev) => ({ ...prev, timezone: value }))}>
                    <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="est">Eastern (UTC-5)</SelectItem>
                      <SelectItem value="cst">Central (UTC-6)</SelectItem>
                      <SelectItem value="pst">Pacific (UTC-8)</SelectItem>
                      <SelectItem value="utc">UTC</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Default Currency</Label>
                    <Select value={organizationForm.currency} onValueChange={(value) => setOrganizationForm((prev) => ({ ...prev, currency: value }))}>
                    <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USD">USD</SelectItem>
                      <SelectItem value="EUR">EUR</SelectItem>
                      <SelectItem value="GBP">GBP</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
                {organizationError ? (
                  <p className="text-sm text-destructive">{organizationError}</p>
                ) : null}
                <Button size="sm" type="submit" disabled={organizationSaving}>
                  {organizationSaving ? "Saving..." : "Save changes"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="team" className="mt-4 space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-semibold text-foreground">Team Members</CardTitle>
                <CardDescription>Manage who has access to your organization</CardDescription>
              </div>
              <Button size="sm" className="gap-1.5" onClick={handleInvite} disabled={inviteLoading}>
                <Plus className="h-3.5 w-3.5" /> Invite
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Member</TableHead>
                    <TableHead className="text-xs">Role</TableHead>
                    <TableHead className="w-10" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {teamMembers.map((member) => (
                    <TableRow key={member.email}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">{member.initials}</AvatarFallback>
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
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          type="button"
                          onClick={() => handleMemberAction(member.email)}
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="mt-4 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold text-foreground">Two-Factor Authentication</CardTitle>
              <CardDescription>Add an extra layer of security to your account</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4 rounded-lg border border-dashed border-border p-6">
                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-muted">
                  <Lock className="h-5 w-5 text-muted-foreground" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">{twoFactorEnabled ? "2FA is enabled" : "2FA is not enabled"}</p>
                  <p className="text-xs text-muted-foreground">
                    {twoFactorEnabled ? "Your account has an extra security layer." : "Protect your account with two-factor authentication"}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  type="button"
                  onClick={handleEnableTwoFactor}
                  disabled={twoFactorEnabled || twoFactorLoading}
                >
                  {twoFactorLoading ? "Enabling..." : twoFactorEnabled ? "Enabled" : "Enable 2FA"}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold text-foreground">Change Password</CardTitle>
            </CardHeader>
            <CardContent>
              <form className="space-y-4" onSubmit={handlePasswordSubmit}>
                <div className="space-y-2">
                <Label className="text-xs">Current Password</Label>
                  <Input
                    type="password"
                    className="h-9"
                    value={passwordForm.currentPassword}
                    onChange={(event) => setPasswordForm((prev) => ({ ...prev, currentPassword: event.target.value }))}
                  />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">New Password</Label>
                  <Input
                    type="password"
                    className="h-9"
                    value={passwordForm.newPassword}
                    onChange={(event) => setPasswordForm((prev) => ({ ...prev, newPassword: event.target.value }))}
                  />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Confirm New Password</Label>
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
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold text-foreground">Current Plan</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between rounded-lg border border-border p-4">
                <div>
                  <p className="text-sm font-semibold text-foreground">Professional</p>
                  <p className="text-xs text-muted-foreground">$29/month - Unlimited invoices, 5 team members</p>
                </div>
                <Button variant="outline" size="sm" type="button" onClick={handleUpgrade} disabled={upgradeLoading}>
                  {upgradeLoading ? "Starting..." : "Upgrade"}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold text-foreground">Payment Method</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3 rounded-lg border border-border p-4">
                <CreditCard className="h-5 w-5 text-muted-foreground" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">{"Visa ending in 4242"}</p>
                  <p className="text-xs text-muted-foreground">{"Expires 12/2027"}</p>
                </div>
                <Button variant="ghost" size="sm" type="button" onClick={handleUpdatePayment} disabled={paymentUpdateLoading}>
                  {paymentUpdateLoading ? "Updating..." : "Update"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
