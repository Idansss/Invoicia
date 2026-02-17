import Link from "next/link";
import { notFound } from "next/navigation";
import { FileText, MessageSquareText } from "lucide-react";

import { prisma } from "@/server/db";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DisputeForm } from "./ui";

export default async function DisputePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const invoice = await prisma.invoice.findFirst({
    where: { token },
    include: { org: { select: { name: true } }, customer: true },
  });
  if (!invoice) return notFound();

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="mx-auto max-w-2xl flex items-center justify-between px-4 py-4">
          <Link href={`/i/${token}`} className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary">
              <FileText className="h-4 w-4 text-primary-foreground" />
            </div>
            Back to invoice
          </Link>
          <div className="text-sm text-muted-foreground">{invoice.org.name}</div>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-10">
        <Card>
          <CardHeader className="space-y-2">
            <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-muted">
              <MessageSquareText className="h-5 w-5 text-muted-foreground" />
            </div>
            <CardTitle>Request a change</CardTitle>
            <CardDescription>
              This will notify {invoice.org.name}. Everything is tracked in the invoice timeline.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DisputeForm token={token} />
            <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
              <FileText className="h-3.5 w-3.5" />
              Attachments and revisions are preserved for audit purposes.
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
