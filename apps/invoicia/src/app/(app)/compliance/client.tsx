"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { CheckCircle2, Circle, ShieldCheck, FileText, FileCode, Globe } from "lucide-react"
import { setComplianceProfileAction } from "./actions"

const validationChecklist = [
  { label: "Company name configured", completed: true },
  { label: "Company address configured", completed: true },
  { label: "Tax ID / VAT number added", completed: false },
  { label: "Default currency set", completed: true },
  { label: "Invoice numbering configured", completed: true },
  { label: "Payment terms template set", completed: true },
  { label: "Digital signature configured", completed: false },
]

const countryPacks = [
  { country: "Nigeria" },
  { country: "Saudi Arabia" },
  { country: "UAE" },
  { country: "India" },
]

export default function ComplianceClient({ activeProfile }: { activeProfile: "BASE" | "PEPPOL" }) {
  const completedCount = validationChecklist.filter((i) => i.completed).length
  const progressPercent = (completedCount / validationChecklist.length) * 100
  const [enablingPeppol, setEnablingPeppol] = useState(false)

  const handleEnablePeppol = async () => {
    setEnablingPeppol(true)
    try {
      await setComplianceProfileAction({ profile: "PEPPOL" })
      toast.success("Peppol profile enabled")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to enable Peppol")
    } finally {
      setEnablingPeppol(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Compliance</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage compliance profiles and export artifacts</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card className={activeProfile === "BASE" ? "ring-2 ring-primary" : ""}>
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10">
                  <ShieldCheck className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">Base Profile</p>
                  <p className="text-xs text-muted-foreground">Standard invoicing compliance</p>
                </div>
              </div>
              {activeProfile === "BASE" ? (
                <Badge className="bg-primary text-primary-foreground border-0 text-xs">Active</Badge>
              ) : null}
            </div>
            <p className="text-xs text-muted-foreground mt-3">
              Includes PDF generation, basic validation, and standard invoice format.
            </p>
          </CardContent>
        </Card>

        <Card className={activeProfile === "PEPPOL" ? "ring-2 ring-primary" : ""}>
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-indigo-50 dark:bg-indigo-950">
                  <Globe className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">Peppol</p>
                  <p className="text-xs text-muted-foreground">European e-invoicing standard</p>
                </div>
              </div>
              <Badge
                variant="outline"
                className="text-xs bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800"
              >
                Recommended
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-3">
              Full UBL/XML export, Peppol network delivery, and automated validation.
            </p>
            <Button
              variant="outline"
              size="sm"
              className="mt-3 w-full bg-transparent"
              type="button"
              onClick={handleEnablePeppol}
              disabled={enablingPeppol}
            >
              {enablingPeppol ? "Enabling..." : activeProfile === "PEPPOL" ? "Peppol enabled" : "Enable Peppol"}
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base font-semibold text-foreground">Validation Checklist</CardTitle>
              <CardDescription>{completedCount} of {validationChecklist.length} items completed</CardDescription>
            </div>
            <span className="text-sm font-semibold text-primary">{Math.round(progressPercent)}%</span>
          </div>
          <Progress value={progressPercent} className="h-2 mt-2" />
        </CardHeader>
        <CardContent className="space-y-2">
          {validationChecklist.map((item) => (
            <div key={item.label} className="flex items-center gap-3 py-1.5">
              {item.completed ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
              ) : (
                <Circle className="h-4 w-4 text-muted-foreground shrink-0" />
              )}
              <span className={`text-sm ${item.completed ? "text-foreground" : "text-muted-foreground"}`}>
                {item.label}
              </span>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold text-foreground">Export Artifacts</CardTitle>
          <CardDescription>Available export formats for your invoices</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="flex items-center gap-3 rounded-lg border border-border p-4">
              <FileText className="h-5 w-5 text-red-500" />
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">PDF Export</p>
                <p className="text-xs text-muted-foreground">Standard invoice document</p>
              </div>
              <Badge
                variant="outline"
                className="text-xs bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800"
              >
                Available
              </Badge>
            </div>
            <div className="flex items-center gap-3 rounded-lg border border-border p-4">
              <FileCode className="h-5 w-5 text-blue-500" />
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">XML Export</p>
                <p className="text-xs text-muted-foreground">UBL 2.1 / Peppol format</p>
              </div>
              <Badge
                variant="outline"
                className="text-xs bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800"
              >
                Available
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold text-foreground">Country Packs</CardTitle>
          <CardDescription>Region-specific compliance modules</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {countryPacks.map((pack) => (
              <div key={pack.country} className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-border p-6 text-center">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-muted">
                  <Globe className="h-5 w-5 text-muted-foreground" />
                </div>
                <p className="text-sm font-medium text-foreground">{pack.country}</p>
                <Badge variant="secondary" className="text-xs">Coming soon</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
