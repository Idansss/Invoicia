"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Eye, Clock, Send, CheckCircle2 } from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Separator } from "@/components/ui/separator"
import { createDefaultReminderPolicyAction, toggleReminderRuleAction } from "./actions"

export interface ReminderRuleRow {
  id: string
  timing: string
  dayOffset: number
  tone: "friendly" | "firm" | "final"
  enabled: boolean
  subject: string
  body: string
}

export interface ReminderLogRow {
  id: string
  reminder: string
  customer: string
  invoice: string
  status: "sent" | "delivered" | "opened" | "failed"
  date: string
}

interface RemindersClientProps {
  rules: ReminderRuleRow[]
  logs: ReminderLogRow[]
}

const toneColors: Record<ReminderRuleRow["tone"], string> = {
  friendly: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800",
  firm: "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300 border-amber-200 dark:border-amber-800",
  final: "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300 border-red-200 dark:border-red-800",
}

export function RemindersClient({ rules: initialRules, logs }: RemindersClientProps) {
  const router = useRouter()
  const [rules, setRules] = useState(initialRules)
  const [updatingRuleId, setUpdatingRuleId] = useState<string | null>(null)
  const [creatingDefaults, setCreatingDefaults] = useState(false)

  const toggleRule = async (id: string) => {
    const nextRule = rules.find((rule) => rule.id === id)
    if (!nextRule) return

    const nextEnabled = !nextRule.enabled
    setRules(rules.map((rule) => (rule.id === id ? { ...rule, enabled: nextEnabled } : rule)))
    setUpdatingRuleId(id)

    try {
      await toggleReminderRuleAction({ ruleId: id, enabled: nextEnabled })
      toast.success("Reminder rule updated")
    } catch (error) {
      setRules(rules.map((rule) => (rule.id === id ? { ...rule, enabled: nextRule.enabled } : rule)))
      toast.error(error instanceof Error ? error.message : "Failed to update reminder")
    } finally {
      setUpdatingRuleId(null)
    }
  }

  const handleCreateDefaults = async () => {
    setCreatingDefaults(true)
    try {
      await createDefaultReminderPolicyAction()
      toast.success("Default reminder policy created")
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create policy")
    } finally {
      setCreatingDefaults(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Reminders</h1>
        <p className="text-sm text-muted-foreground mt-1">Configure automated payment reminder policies</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold text-foreground">Reminder Rules</CardTitle>
              <CardDescription>Set when and how to remind customers about payments</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {rules.length === 0 ? (
                <div className="rounded-lg border border-dashed border-border p-6 text-center">
                  <p className="text-sm text-muted-foreground">No reminder rules configured yet.</p>
                  <Button className="mt-3" type="button" onClick={handleCreateDefaults} disabled={creatingDefaults}>
                    {creatingDefaults ? "Creating..." : "Create default policy"}
                  </Button>
                </div>
              ) : (
                rules.map((rule) => (
                  <div key={rule.id} className="rounded-lg border border-border p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10">
                          <Clock className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">{rule.timing}</p>
                          <p className="text-xs text-muted-foreground">Day offset: {rule.dayOffset > 0 ? "+" : ""}{rule.dayOffset}</p>
                        </div>
                      </div>
                      <Switch
                        checked={rule.enabled}
                        onCheckedChange={() => toggleRule(rule.id)}
                        disabled={updatingRuleId === rule.id}
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">Tone:</span>
                      <Badge variant="outline" className={`text-xs border ${toneColors[rule.tone]}`}>
                        {rule.tone.charAt(0).toUpperCase() + rule.tone.slice(1)}
                      </Badge>
                    </div>
                    <div className="text-xs text-muted-foreground bg-muted/50 rounded-md p-3">
                      <p className="font-medium text-foreground mb-1">Subject: {rule.subject}</p>
                      <p>{rule.body}</p>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2">
          <Card className="sticky top-20">
            <CardHeader>
              <CardTitle className="text-base font-semibold text-foreground">Email Preview</CardTitle>
              <CardDescription>Preview how reminders appear to customers</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border border-border overflow-hidden">
                <div className="bg-muted px-4 py-3 border-b border-border">
                  <p className="text-xs text-muted-foreground">From: invoices@invoicia.com</p>
                  <p className="text-xs text-muted-foreground">To: billing@customer.com</p>
                  <p className="text-xs font-medium text-foreground mt-1">Subject: Friendly reminder: Invoice due soon</p>
                </div>
                <div className="p-4 space-y-3 text-sm text-foreground">
                  <p>Hi there,</p>
                  <p className="text-muted-foreground">Just a friendly reminder that your invoice is due soon. Please let us know if you have any questions.</p>
                  <div className="pt-2">
                    <Button size="sm" className="w-full" asChild>
                      <Link href="/invoices">View Invoice</Link>
                    </Button>
                  </div>
                  <Separator />
                  <p className="text-xs text-muted-foreground text-center">Sent via Invoicia</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold text-foreground">Reminder Logs</CardTitle>
          <CardDescription>History of sent reminders</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-xs font-medium">Reminder</TableHead>
                <TableHead className="text-xs font-medium">Customer</TableHead>
                <TableHead className="text-xs font-medium hidden sm:table-cell">Invoice</TableHead>
                <TableHead className="text-xs font-medium">Status</TableHead>
                <TableHead className="text-xs font-medium hidden md:table-cell">Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="text-sm text-foreground">{log.reminder}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{log.customer}</TableCell>
                  <TableCell className="text-sm text-muted-foreground hidden sm:table-cell">{log.invoice}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs">
                      {log.status === "sent" && <Send className="h-3 w-3 mr-1" />}
                      {log.status === "delivered" && <CheckCircle2 className="h-3 w-3 mr-1" />}
                      {log.status === "opened" && <Eye className="h-3 w-3 mr-1" />}
                      {log.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground hidden md:table-cell">{log.date}</TableCell>
                </TableRow>
              ))}
              {logs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-32 text-center text-sm text-muted-foreground">
                    No reminders sent yet
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
