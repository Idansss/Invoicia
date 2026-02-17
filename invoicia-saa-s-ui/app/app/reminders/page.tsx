"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Separator } from "@/components/ui/separator"
import { mockReminderRules, type ReminderTone } from "@/lib/mock-data"
import { Eye, Clock, Send, CheckCircle2 } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"
import { getActionErrorMessage, runUiAction } from "@/lib/ui-action-client"

const toneColors: Record<ReminderTone, string> = {
  friendly: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800",
  firm: "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300 border-amber-200 dark:border-amber-800",
  final: "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300 border-red-200 dark:border-red-800",
}

const mockLogs = [
  { id: "1", reminder: "3 days before due", customer: "TechStart Inc.", invoice: "INV-2026-000124", status: "sent", date: "Feb 16, 2026" },
  { id: "2", reminder: "On due date", customer: "Global Retail Ltd.", invoice: "INV-2026-000125", status: "delivered", date: "Dec 31, 2025" },
  { id: "3", reminder: "7 days after due", customer: "Global Retail Ltd.", invoice: "INV-2026-000125", status: "opened", date: "Jan 7, 2026" },
  { id: "4", reminder: "3 days before due", customer: "CloudSync Systems", invoice: "INV-2026-000127", status: "sent", date: "Feb 24, 2026" },
]

export default function RemindersPage() {
  const [rules, setRules] = useState(mockReminderRules)
  const [updatingRuleId, setUpdatingRuleId] = useState<string | null>(null)

  const toggleRule = async (id: string) => {
    const nextRule = rules.find((rule) => rule.id === id)
    if (!nextRule) return

    const nextEnabled = !nextRule.enabled
    setRules(rules.map((rule) => (rule.id === id ? { ...rule, enabled: nextEnabled } : rule)))
    setUpdatingRuleId(id)

    try {
      await runUiAction({
        type: "reminders.rule.toggle",
        payload: { id, enabled: nextEnabled },
      })
      toast.success("Reminder rule updated")
    } catch (error) {
      setRules(rules.map((rule) => (rule.id === id ? { ...rule, enabled: nextRule.enabled } : rule)))
      toast.error(getActionErrorMessage(error))
    } finally {
      setUpdatingRuleId(null)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Reminders</h1>
        <p className="text-sm text-muted-foreground mt-1">Configure automated payment reminder policies</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Reminder Rules */}
        <div className="lg:col-span-3 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold text-foreground">Reminder Rules</CardTitle>
              <CardDescription>Set when and how to remind customers about payments</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {rules.map((rule) => (
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
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Email Preview */}
        <div className="lg:col-span-2">
          <Card className="sticky top-20">
            <CardHeader>
              <CardTitle className="text-base font-semibold text-foreground">Email Preview</CardTitle>
              <CardDescription>Preview how reminders appear to customers</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border border-border overflow-hidden">
                <div className="bg-muted px-4 py-3 border-b border-border">
                  <p className="text-xs text-muted-foreground">From: invoices@acmecorp.com</p>
                  <p className="text-xs text-muted-foreground">To: billing@customer.com</p>
                  <p className="text-xs font-medium text-foreground mt-1">Subject: Friendly reminder: Invoice INV-2026-000124 due soon</p>
                </div>
                <div className="p-4 space-y-3 text-sm text-foreground">
                  <p>Hi TechStart Inc.,</p>
                  <p className="text-muted-foreground">Just a friendly reminder that invoice INV-2026-000124 for $8,750.00 is due on Feb 19, 2026. Please let us know if you have any questions.</p>
                  <div className="pt-2">
                    <Button size="sm" className="w-full" asChild>
                      <Link href="/app/invoices/inv-2">View Invoice</Link>
                    </Button>
                  </div>
                  <Separator />
                  <p className="text-xs text-muted-foreground text-center">Sent via Invoicia on behalf of Acme Corp</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Logs */}
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
              {mockLogs.map((log) => (
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
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
