"use client"

import React from "react"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { mockAuditEvents, formatDateTime, type AuditEvent } from "@/lib/mock-data"
import { Search, Filter, FileText, CreditCard, Users, Settings, Bell, Ban, ClipboardList } from "lucide-react"

const eventIcons: Record<string, React.ElementType> = {
  "invoice.created": FileText,
  "invoice.sent": FileText,
  "invoice.overdue": FileText,
  "invoice.voided": Ban,
  "payment.received": CreditCard,
  "customer.created": Users,
  "settings.updated": Settings,
  "reminder.sent": Bell,
}

const eventColors: Record<string, string> = {
  "invoice.created": "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
  "invoice.sent": "bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300",
  "invoice.overdue": "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300",
  "invoice.voided": "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
  "payment.received": "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
  "customer.created": "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
  "settings.updated": "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  "reminder.sent": "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
}

export default function AuditLogPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [eventFilter, setEventFilter] = useState("all")
  const [selectedEvent, setSelectedEvent] = useState<AuditEvent | null>(null)

  const filtered = mockAuditEvents.filter((e) => {
    if (eventFilter !== "all" && !e.event.startsWith(eventFilter)) return false
    if (searchQuery && !e.details.toLowerCase().includes(searchQuery.toLowerCase()) && !e.actor.toLowerCase().includes(searchQuery.toLowerCase())) return false
    return true
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Audit Log</h1>
        <p className="text-sm text-muted-foreground mt-1">Track all activity across your organization</p>
      </div>

      <Card>
        <CardContent className="pt-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Search events..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9 h-9" />
            </div>
            <Select value={eventFilter} onValueChange={setEventFilter}>
              <SelectTrigger className="w-40 h-9">
                <Filter className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
                <SelectValue placeholder="Event type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All events</SelectItem>
                <SelectItem value="invoice">Invoices</SelectItem>
                <SelectItem value="payment">Payments</SelectItem>
                <SelectItem value="customer">Customers</SelectItem>
                <SelectItem value="settings">Settings</SelectItem>
                <SelectItem value="reminder">Reminders</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 gap-2 text-muted-foreground">
              <ClipboardList className="h-8 w-8 opacity-40" />
              <p className="text-sm font-medium">No events found</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {filtered.map((event) => {
                const Icon = eventIcons[event.event] || FileText
                const colorClass = eventColors[event.event] || "bg-gray-100 text-gray-600"
                return (
                  <div
                    key={event.id}
                    className="flex items-center gap-4 p-4 cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => setSelectedEvent(event)}
                  >
                    <div className={`flex items-center justify-center w-9 h-9 rounded-lg shrink-0 ${colorClass}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-foreground truncate">{event.details}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-muted-foreground">{event.actor}</span>
                        <span className="text-xs text-muted-foreground">{"--"}</span>
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0">{event.event}</Badge>
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground shrink-0 hidden sm:block">{formatDateTime(event.timestamp)}</span>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detail Drawer */}
      <Sheet open={!!selectedEvent} onOpenChange={() => setSelectedEvent(null)}>
        <SheetContent>
          {selectedEvent && (
            <>
              <SheetHeader>
                <SheetTitle>Event Details</SheetTitle>
                <SheetDescription>{selectedEvent.event}</SheetDescription>
              </SheetHeader>
              <div className="mt-6 space-y-4">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Description</p>
                  <p className="text-sm text-foreground">{selectedEvent.details}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Actor</p>
                  <p className="text-sm text-foreground">{selectedEvent.actor}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Entity</p>
                  <p className="text-sm text-foreground">{selectedEvent.entity} ({selectedEvent.entityId})</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Timestamp</p>
                  <p className="text-sm text-foreground">{formatDateTime(selectedEvent.timestamp)}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Event Type</p>
                  <Badge variant="outline">{selectedEvent.event}</Badge>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}
