import Link from "next/link"
import { ArrowRight, FileText, Globe, Shield, Zap } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

const features = [
  {
    title: "Buyer-first",
    description: "Hosted invoice links that feel trustworthy and convert faster.",
    icon: FileText,
  },
  {
    title: "Automation",
    description: "Scheduled reminders and optional late fees reduce chasing.",
    icon: Zap,
  },
  {
    title: "Compliance",
    description: "Validation and export scaffolding for structured invoicing.",
    icon: Shield,
  },
  {
    title: "Global-ready",
    description: "Multi-currency and org-level settings from day one.",
    icon: Globe,
  },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/70 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
              <FileText className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-lg font-bold tracking-tight text-foreground">Invoicia</span>
          </Link>
          <div className="flex items-center gap-2">
            <Button variant="ghost" className="font-medium" asChild>
              <Link href="/sign-in">Sign in</Link>
            </Button>
            <Button className="font-medium" asChild>
              <Link href="/sign-up">Get started</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
        <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
          <div className="space-y-6">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary" className="text-xs">
                Structured invoices
              </Badge>
              <Badge variant="outline" className="text-xs">
                Next.js App Router
              </Badge>
            </div>

            <h1 className="text-balance text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
              The best electronic invoice experience, structured by default.
            </h1>
            <p className="text-pretty text-base text-muted-foreground sm:text-lg">
              Hosted invoice links are the buyer experience. Automated reminders and late fees reduce chasing. Compliance packs treat structured invoices as canonical.
            </p>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Button className="gap-2 font-medium" asChild>
                <Link href="/app">
                  Open app <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button variant="outline" className="gap-2 bg-transparent font-medium" asChild>
                <Link href="/sign-up">
                  Create account <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {features.map((feature) => (
              <Card key={feature.title} className="transition-shadow hover:shadow-sm">
                <CardContent className="space-y-2 pt-6">
                  <div className="flex items-center gap-2">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                      <feature.icon className="h-4 w-4 text-primary" />
                    </div>
                    <p className="text-sm font-semibold text-foreground">{feature.title}</p>
                  </div>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}
