import Link from "next/link";
import { notFound } from "next/navigation";
import {
  FileText,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  Building2,
  Mail,
  Calendar,
  DollarSign,
  MessageSquare,
} from "lucide-react";

import { prisma } from "@/server/db";
import { computeInvoiceTotals } from "@/domain/invoice-calculations";
import { formatDate, formatMoney } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { InvoiceStatusBadge } from "@/components/invoices/status-badge";
import { TrackView } from "./track-view";
import { isStripeConfigured } from "@/server/payments/stripe";
import { HostedInvoiceActions } from "./hosted-actions";

export default async function HostedInvoicePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  const invoice = await prisma.invoice.findFirst({
    where: { token },
    include: {
      org: { select: { name: true, currency: true, timezone: true } },
      customer: true,
      lineItems: true,
      payments: true,
      creditNotes: true,
    },
  });
  if (!invoice) return notFound();

  const totals = computeInvoiceTotals(invoice);
  const paidCents = invoice.payments.filter((p) => p.status === "SUCCEEDED").reduce((s, p) => s + p.amountCents, 0);
  const creditsCents = invoice.creditNotes.reduce((s, c) => s + c.amountCents, 0);
  const dueCents = Math.max(0, totals.totalCents - paidCents - creditsCents);
  const stripeEnabled = isStripeConfigured();
  const isPaid = invoice.status === "PAID";
  const isOverdue = invoice.status === "OVERDUE";

  const subtotal = totals.subtotalCents;
  const taxAmount = totals.taxCents;

  return (
    <div className="min-h-screen bg-background">
      <TrackView token={token} />
      <header className="border-b border-border bg-card">
        <div className="mx-auto max-w-3xl flex items-center justify-between px-4 py-4 sm:px-6">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary">
              <FileText className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="text-lg font-bold tracking-tight text-foreground">{invoice.org.name}</span>
          </div>
          <HostedInvoiceActions pdfUrl={`/api/public/invoices/${token}/pdf`} />
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6 space-y-6">
        {isPaid ? (
          <div className="flex items-center gap-3 rounded-lg bg-emerald-50 dark:bg-emerald-950 border border-emerald-200 dark:border-emerald-800 p-4">
            <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-200">Payment received</p>
              <p className="text-xs text-emerald-600 dark:text-emerald-400">
                This invoice was paid. Thank you!
              </p>
            </div>
          </div>
        ) : null}

        {isOverdue ? (
          <div className="flex items-center gap-3 rounded-lg bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 p-4">
            <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-red-800 dark:text-red-200">Payment overdue</p>
              <p className="text-xs text-red-600 dark:text-red-400">
                This invoice was due on {invoice.dueDate ? formatDate(invoice.dueDate, invoice.org.timezone) : "N/A"}.
              </p>
            </div>
          </div>
        ) : null}

        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-foreground">{invoice.number}</h1>
                <div className="flex items-center gap-2 mt-2">
                  <InvoiceStatusBadge status={invoice.status} />
                  {invoice.purchaseOrderNumber ? (
                    <Badge variant="outline" className="text-xs">PO: {invoice.purchaseOrderNumber}</Badge>
                  ) : null}
                </div>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-foreground">{formatMoney(isPaid ? 0 : dueCents, invoice.org.currency)}</p>
                <p className="text-xs text-muted-foreground mt-1">{isPaid ? "Paid in full" : "Amount due"}</p>
              </div>
            </div>

            <Separator className="my-6" />

            <div className="grid gap-6 sm:grid-cols-2">
              <div className="space-y-3">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">From</p>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-sm font-medium text-foreground">{invoice.org.name}</span>
                  </div>
                </div>
              </div>
              <div className="space-y-3">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Bill To</p>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-sm font-medium text-foreground">{invoice.customer.name}</span>
                  </div>
                  <div className="flex items-center gap-2 pl-[22px]">
                    <Mail className="h-3 w-3 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">{invoice.customer.email ?? ""}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-6 mt-6 pt-4 border-t border-border">
              <div className="flex items-center gap-2">
                <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Issued</p>
                  <p className="text-xs font-medium text-foreground">{formatDate(invoice.issueDate, invoice.org.timezone)}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Due</p>
                  <p className="text-xs font-medium text-foreground">{invoice.dueDate ? formatDate(invoice.dueDate, invoice.org.timezone) : "-"}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <DollarSign className="h-3.5 w-3.5 text-muted-foreground" />
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Terms</p>
                  <p className="text-xs font-medium text-foreground">{invoice.paymentTermsDays ? `Net ${invoice.paymentTermsDays}` : "Net 30"}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Description</TableHead>
                  <TableHead className="text-xs text-right">Qty</TableHead>
                  <TableHead className="text-xs text-right">Unit Price</TableHead>
                  <TableHead className="text-xs text-right">Tax</TableHead>
                  <TableHead className="text-xs text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoice.lineItems.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <p className="text-sm font-medium text-foreground">{item.description}</p>
                      <p className="text-xs text-muted-foreground">Unit: {item.unit}</p>
                    </TableCell>
                    <TableCell className="text-sm text-right text-foreground">{item.quantity.toString()}</TableCell>
                    <TableCell className="text-sm text-right text-foreground">{formatMoney(item.unitPriceCents, invoice.org.currency)}</TableCell>
                    <TableCell className="text-sm text-right text-muted-foreground">{item.taxPercent ?? invoice.taxPercent ?? 0}%</TableCell>
                    <TableCell className="text-sm text-right font-medium text-foreground">
                      {formatMoney(Math.round(Number(item.quantity.toString()) * item.unitPriceCents), invoice.org.currency)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            <div className="px-4 py-4 border-t border-border space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="text-foreground">{formatMoney(subtotal, invoice.org.currency)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Tax</span>
                <span className="text-foreground">{formatMoney(taxAmount, invoice.org.currency)}</span>
              </div>
              <Separator />
              <div className="flex justify-between text-lg font-bold">
                <span className="text-foreground">Total Due</span>
                <span className="text-foreground">{formatMoney(isPaid ? 0 : dueCents, invoice.org.currency)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {invoice.notes ? (
          <Card>
            <CardContent className="pt-6">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Notes</p>
              <p className="text-sm text-muted-foreground">{invoice.notes}</p>
            </CardContent>
          </Card>
        ) : null}

        {!isPaid ? (
          <div className="space-y-3">
            <form action={`/api/public/invoices/${token}/pay`} method="post">
              <Button
                className="w-full h-12 text-base font-semibold gap-2"
                type="submit"
                disabled={!stripeEnabled || dueCents <= 0 || invoice.status === "VOID" || invoice.status === "DRAFT"}
              >
                <CreditCard className="h-5 w-5" />
                Pay {formatMoney(dueCents, invoice.org.currency)}
              </Button>
            </form>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1 gap-1.5 bg-transparent" asChild>
                <Link href={`/api/public/invoices/${token}/pdf`} target="_blank">
                  <FileText className="h-4 w-4" /> Download PDF
                </Link>
              </Button>
              <Button variant="outline" className="flex-1 gap-1.5 bg-transparent" asChild>
                <Link href={`/i/${token}/dispute`}>
                  <MessageSquare className="h-4 w-4" /> Raise Dispute
                </Link>
              </Button>
            </div>
          </div>
        ) : null}

        <footer className="text-center py-6 border-t border-border">
          <p className="text-xs text-muted-foreground">
            This invoice was sent via{" "}
            <Link href="/sign-in" className="text-primary hover:underline font-medium">
              Invoicia
            </Link>
            . Questions? Contact{" "}
            <span className="text-foreground">{invoice.customer.email ?? "billing@invoicia.com"}</span>
          </p>
        </footer>
      </main>
    </div>
  );
}
