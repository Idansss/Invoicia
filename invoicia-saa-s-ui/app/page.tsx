import Link from "next/link"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Shield, Zap, Globe, ArrowRight, FileText } from "lucide-react"

const features = [
  {
    title: "Buyer-first links",
    description: "Hosted invoice pages that build trust and speed up payment.",
    icon: FileText,
  },
  {
    title: "Automation",
    description: "Reminders and late fees (optional) to reduce chasing.",
    icon: Zap,
  },
  {
    title: "Compliance-ready",
    description: "Export artifacts and validation scaffolding as you scale.",
    icon: Shield,
  },
  {
    title: "Global from day one",
    description: "Multi-currency workflows with room for country packs.",
    icon: Globe,
  },
]

export default function Page() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/70 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-primary">
              <FileText className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-lg font-bold tracking-tight text-foreground">Invoicia</span>
          </Link>
          <div className="flex items-center gap-2">
            <Button variant="ghost" className="font-medium" asChild>
              <Link href="/login">Sign in</Link>
            </Button>
            <Button className="font-medium" asChild>
              <Link href="/signup">Get started</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
        <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
          <div className="space-y-6">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary" className="text-xs">
                Modern invoicing UI
              </Badge>
              <Badge variant="outline" className="text-xs">
                App Router
              </Badge>
            </div>
            <h1 className="text-balance text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
              {"The modern electronic invoice experience\u2014structured by default."}
            </h1>
            <p className="text-pretty text-base text-muted-foreground sm:text-lg">
              Create, send, and track invoices with a clean dashboard, hosted invoice links, and compliance scaffolding
              built for teams.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button className="gap-2 font-medium" asChild>
                <Link href="/app">
                  Open app <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button variant="outline" className="gap-2 bg-transparent font-medium" asChild>
                <Link href="/signup">
                  Create account <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Dev proof: this route should show a fixed badge in the top-right in development.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {features.map((f) => (
              <Card key={f.title} className="hover:shadow-sm transition-shadow">
                <CardContent className="pt-6 space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center justify-center h-9 w-9 rounded-lg bg-primary/10">
                      <f.icon className="h-4 w-4 text-primary" />
                    </div>
                    <p className="text-sm font-semibold text-foreground">{f.title}</p>
                  </div>
                  <p className="text-sm text-muted-foreground">{f.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}
