"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { InvoiceStatusBadge } from "@/components/invoices/status-badge"
import { mockInvoices, formatCurrency, formatDate } from "@/lib/mock-data"
import { DollarSign, Clock, CheckCircle2, TrendingUp, Plus, UserPlus, CreditCard, Bell, ArrowRight, FileText } from "lucide-react"
import Link from "next/link"
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip as RechartsTooltip, CartesianGrid } from "recharts"

const cashflowData = [
  { month: "Aug", income: 18200, expenses: 4100 },
  { month: "Sep", income: 22400, expenses: 5200 },
  { month: "Oct", income: 19800, expenses: 3800 },
  { month: "Nov", income: 28100, expenses: 6300 },
  { month: "Dec", income: 25600, expenses: 4900 },
  { month: "Jan", income: 31200, expenses: 5400 },
  { month: "Feb", income: 27800, expenses: 4700 },
]

const kpiCards = [
  { title: "Outstanding", value: "$56,550", change: "+12.3%", icon: DollarSign, description: "Across 5 invoices" },
  { title: "Overdue", value: "$24,300", change: "+5.1%", icon: Clock, description: "1 invoice overdue" },
  { title: "Paid This Month", value: "$18,900", change: "+28.4%", icon: CheckCircle2, description: "2 invoices paid" },
  { title: "Avg. Days to Pay", value: "18 days", change: "-3.2%", icon: TrendingUp, description: "Improved from 21 days" },
]

const quickActions = [
  { label: "Create invoice", icon: Plus, href: "/app/invoices/new" },
  { label: "Add customer", icon: UserPlus, href: "/app/customers" },
  { label: "Connect payments", icon: CreditCard, href: "/app/payments" },
  { label: "Set reminders", icon: Bell, href: "/app/reminders" },
]

export default function OverviewPage() {
  const recentInvoices = mockInvoices.slice(0, 5)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Overview</h1>
        <p className="text-sm text-muted-foreground mt-1">Welcome back, John. Here{"'"}s what{"'"}s happening with your invoices.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpiCards.map((kpi) => (
          <Card key={kpi.title} className="relative overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{kpi.title}</CardTitle>
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10">
                <kpi.icon className="h-4 w-4 text-primary" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{kpi.value}</div>
              <div className="flex items-center gap-1.5 mt-1">
                <Badge variant="outline" className={`text-xs border-0 px-1.5 py-0 ${kpi.change.startsWith("+") ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300" : "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300"}`}>
                  {kpi.change}
                </Badge>
                <span className="text-xs text-muted-foreground">{kpi.description}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Cash Flow Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base font-semibold text-foreground">Cash Flow</CardTitle>
            <CardDescription>Monthly income vs expenses over the last 7 months</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={cashflowData} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                <RechartsTooltip
                  contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: 12 }}
                  formatter={(value: number) => formatCurrency(value)}
                />
                <Bar dataKey="income" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Income" />
                <Bar dataKey="expenses" fill="hsl(var(--muted))" radius={[4, 4, 0, 0]} name="Expenses" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Quick Actions + Reminders */}
        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold text-foreground">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-2">
              {quickActions.map((action) => (
                <Button key={action.label} variant="outline" className="h-auto flex-col gap-2 py-4 text-xs font-medium bg-transparent" asChild>
                  <Link href={action.href}>
                    <action.icon className="h-5 w-5 text-primary" />
                    {action.label}
                  </Link>
                </Button>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold text-foreground">Reminder Health</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bell className="h-4 w-4 text-amber-500" />
                  <span className="text-sm text-foreground">Scheduled today</span>
                </div>
                <Badge variant="secondary" className="text-xs">2</Badge>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  <span className="text-sm text-foreground">Sent this week</span>
                </div>
                <Badge variant="secondary" className="text-xs">5</Badge>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-foreground">Upcoming</span>
                </div>
                <Badge variant="secondary" className="text-xs">8</Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Recent Invoices */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base font-semibold text-foreground">Recent Invoices</CardTitle>
            <CardDescription>Your latest invoice activity</CardDescription>
          </div>
          <Button variant="ghost" size="sm" className="gap-1 text-primary" asChild>
            <Link href="/app/invoices">
              View all <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">Invoice</TableHead>
                <TableHead className="text-xs">Customer</TableHead>
                <TableHead className="text-xs">Status</TableHead>
                <TableHead className="text-xs text-right">Amount</TableHead>
                <TableHead className="text-xs hidden sm:table-cell">Due Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentInvoices.map((invoice) => (
                <TableRow key={invoice.id} className="cursor-pointer hover:bg-muted/50 transition-colors">
                  <TableCell>
                    <Link href={`/app/invoices/${invoice.id}`} className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium text-sm text-foreground">{invoice.number}</span>
                    </Link>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{invoice.customerName}</TableCell>
                  <TableCell><InvoiceStatusBadge status={invoice.status} /></TableCell>
                  <TableCell className="text-right font-medium text-sm text-foreground">{formatCurrency(invoice.amount)}</TableCell>
                  <TableCell className="text-sm text-muted-foreground hidden sm:table-cell">{formatDate(invoice.dueDate)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
