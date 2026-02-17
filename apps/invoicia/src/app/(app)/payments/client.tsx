"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { toast } from "sonner"
import { CheckCircle2, XCircle, Clock, CreditCard, ArrowUpRight, ExternalLink } from "lucide-react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { PaymentStatusBadge } from "@/components/invoices/status-badge"
import { connectStripeAction, openPayoutGuidanceAction } from "./actions"

export interface PaymentRow {
  id: string
  invoiceId: string
  invoiceNumber: string
  customerName: string
  amount: string
  status: "REQUIRES_PAYMENT_METHOD" | "PENDING" | "SUCCEEDED" | "FAILED" | "CANCELED" | "REFUNDED"
  method: string
  date: string
}

interface PaymentSummary {
  successful: { total: string; count: number }
  failed: { total: string; count: number }
  pending: { total: string; count: number }
}

interface PaymentsClientProps {
  payments: PaymentRow[]
  summary: PaymentSummary
}

export function PaymentsClient({ payments, summary }: PaymentsClientProps) {
  const router = useRouter()
  const [connectingStripe, setConnectingStripe] = useState(false)
  const [payoutHelpLoading, setPayoutHelpLoading] = useState(false)

  const handleConnectStripe = async () => {
    setConnectingStripe(true)
    try {
      const result = await connectStripeAction()
      toast.success("Stripe connection flow started")
      router.push(result.nextUrl)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to start Stripe connection")
    } finally {
      setConnectingStripe(false)
    }
  }

  const handleLearnMore = async () => {
    setPayoutHelpLoading(true)
    try {
      const result = await openPayoutGuidanceAction()
      toast.success("Payout setup guidance opened")
      router.push(result.nextUrl)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to open payout guidance")
    } finally {
      setPayoutHelpLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Payments</h1>
        <p className="text-sm text-muted-foreground mt-1">Track payment activity and manage integrations</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {[
          {
            label: "Successful",
            value: summary.successful.total,
            count: summary.successful.count,
            icon: CheckCircle2,
            color: "text-emerald-600 dark:text-emerald-400",
            bg: "bg-emerald-50 dark:bg-emerald-950",
          },
          {
            label: "Failed",
            value: summary.failed.total,
            count: summary.failed.count,
            icon: XCircle,
            color: "text-red-600 dark:text-red-400",
            bg: "bg-red-50 dark:bg-red-950",
          },
          {
            label: "Pending",
            value: summary.pending.total,
            count: summary.pending.count,
            icon: Clock,
            color: "text-amber-600 dark:text-amber-400",
            bg: "bg-amber-50 dark:bg-amber-950",
          },
        ].map((stat) => (
          <Card key={stat.label}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                  <p className="text-2xl font-bold text-foreground mt-1">{stat.value}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{stat.count} transactions</p>
                </div>
                <div className={`flex items-center justify-center w-10 h-10 rounded-lg ${stat.bg}`}>
                  <stat.icon className={`h-5 w-5 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-dashed">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-950 shrink-0">
              <CreditCard className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div className="flex-1 text-center sm:text-left">
              <p className="text-sm font-semibold text-foreground">Connect Stripe</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Accept credit cards, ACH, and international payments directly from your invoices.
              </p>
            </div>
            <Button className="gap-1.5 font-medium shrink-0" type="button" onClick={handleConnectStripe} disabled={connectingStripe}>
              <ExternalLink className="h-3.5 w-3.5" /> {connectingStripe ? "Connecting..." : "Connect"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold text-foreground">Payment Events</CardTitle>
          <CardDescription>All payment transactions linked to invoices</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-xs font-medium">Invoice</TableHead>
                <TableHead className="text-xs font-medium">Customer</TableHead>
                <TableHead className="text-xs font-medium">Status</TableHead>
                <TableHead className="text-xs font-medium hidden sm:table-cell">Method</TableHead>
                <TableHead className="text-xs font-medium text-right">Amount</TableHead>
                <TableHead className="text-xs font-medium hidden md:table-cell">Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payments.map((payment) => (
                <TableRow key={payment.id} className="hover:bg-muted/50 transition-colors">
                  <TableCell>
                    <Link
                      href={`/invoices/${payment.invoiceId}`}
                      className="text-sm font-medium text-foreground hover:text-primary transition-colors flex items-center gap-1"
                    >
                      {payment.invoiceNumber} <ArrowUpRight className="h-3 w-3 opacity-0 group-hover:opacity-100" />
                    </Link>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{payment.customerName}</TableCell>
                  <TableCell>
                    <PaymentStatusBadge status={payment.status} />
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground hidden sm:table-cell">{payment.method}</TableCell>
                  <TableCell className="text-sm font-semibold text-right text-foreground">{payment.amount}</TableCell>
                  <TableCell className="text-sm text-muted-foreground hidden md:table-cell">{payment.date}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold text-foreground">Payouts</CardTitle>
          <CardDescription>Automatic payouts to your bank account</CardDescription>
        </CardHeader>
        <CardContent className="text-center py-8">
          <CreditCard className="h-8 w-8 mx-auto mb-2 text-muted-foreground opacity-40" />
          <p className="text-sm font-medium text-muted-foreground">Connect a payment provider to enable payouts</p>
          <Button
            variant="outline"
            size="sm"
            className="mt-3 bg-transparent"
            type="button"
            onClick={handleLearnMore}
            disabled={payoutHelpLoading}
          >
            {payoutHelpLoading ? "Opening..." : "Learn more"}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
