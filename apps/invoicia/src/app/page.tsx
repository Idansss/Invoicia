import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  CircleCheckBig,
  Clock3,
  FileText,
  Github,
  Globe2,
  Linkedin,
  Link2,
  Shield,
  Sparkles,
  Twitter,
  Users,
  Zap,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const navLinks = [
  { label: "Product", href: "#product" },
  { label: "Pricing", href: "#pricing" },
  { label: "How it works", href: "#how-it-works" },
  { label: "Changelog", href: "#changelog" },
];

const trustItems = ["No credit card", "2 min setup", "Bank-level secure"];

const features = [
  {
    title: "Buyer-first",
    description:
      "Beautiful, mobile-optimized invoices your clients will love. Multiple payment options, real-time status updates, and instant receipts.",
    icon: Users,
  },
  {
    title: "Automation",
    description:
      "Set it and forget it. Automated reminders, recurring invoices, and smart follow-ups keep your cash flow healthy without lifting a finger.",
    icon: Zap,
    badge: "Most Popular",
    highlighted: true,
  },
  {
    title: "Compliance",
    description:
      "Stay compliant effortlessly. Automatic tax calculations, audit trails, and secure archiving. Built-in support for GDPR, SOC 2, and more.",
    icon: Shield,
  },
  {
    title: "Global-ready",
    description:
      "Invoice in 135+ currencies with automatic conversion. Accept payments from anywhere with local payment methods and multi-language support.",
    icon: Globe2,
  },
];

const steps = [
  {
    number: "01",
    title: "Create your invoice",
    description:
      "Use our intuitive editor or import from your existing tools. Add your branding, line items, and payment terms in seconds.",
    icon: FileText,
  },
  {
    number: "02",
    title: "Send & track",
    description:
      "Share via email or unique link. Get real-time notifications when your client views, downloads, or pays your invoice.",
    icon: Link2,
  },
  {
    number: "03",
    title: "Get paid faster",
    description:
      "Accept payments instantly with Stripe, PayPal, bank transfer, and more. Funds hit your account in 24-48 hours.",
    icon: CircleCheckBig,
  },
];

const footerColumns: { title: string; links: { label: string; href: string }[] }[] = [
  {
    title: "Product",
    links: [
      { label: "Features", href: "#product" },
      { label: "Pricing", href: "#pricing" },
      { label: "API", href: "#" },
      { label: "Changelog", href: "#changelog" },
      { label: "Documentation", href: "#" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", href: "#" },
      { label: "Blog", href: "#" },
      { label: "Careers", href: "#" },
      { label: "Press", href: "#" },
      { label: "Partners", href: "#" },
    ],
  },
  {
    title: "Resources",
    links: [
      { label: "Community", href: "#" },
      { label: "Support", href: "#" },
      { label: "Status", href: "#" },
      { label: "Templates", href: "#" },
      { label: "Guides", href: "#" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Privacy", href: "/privacy" },
      { label: "Terms", href: "/terms" },
      { label: "Security", href: "#" },
      { label: "Compliance", href: "#" },
      { label: "Cookies", href: "#" },
    ],
  },
];

export default function LandingPage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#07080d] text-white">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_25%,rgba(90,76,255,0.28),transparent_55%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_70%,rgba(70,56,190,0.2),transparent_55%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(7,8,13,0.15)_0%,rgba(7,8,13,0.9)_100%)]" />
      </div>

      <header className="sticky top-0 z-50 border-b border-white/10 bg-black/30 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 shadow-lg shadow-indigo-500/20">
              <FileText className="h-5 w-5" />
            </div>
            <span className="text-lg font-semibold tracking-tight text-white">Invoicia</span>
          </Link>

          <nav className="hidden items-center gap-8 text-sm font-medium text-white/70 md:flex">
            {navLinks.map((link) => (
              <Link key={link.label} className="hover:text-white" href={link.href}>
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <Link
              className="hidden text-sm text-white/70 hover:text-white md:inline"
              href="/sign-in"
            >
              Sign in
            </Link>
            <Button
              asChild
              className="h-10 rounded-full bg-indigo-500 px-5 text-sm font-medium text-white shadow-lg shadow-indigo-500/20 hover:bg-indigo-400"
            >
              <Link href="/sign-up">Get started</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="relative z-10">
        <section className="border-b border-white/10 py-16 sm:py-20">
          <div className="mx-auto grid max-w-6xl items-center gap-10 px-6 lg:grid-cols-2 lg:gap-12">
            <div>
              <Badge className="mb-8 rounded-full border border-indigo-500/35 bg-indigo-500/10 px-4 py-1.5 text-base font-semibold text-indigo-300">
                <Sparkles className="mr-2 h-4 w-4" />
                Now with AI-powered insights
              </Badge>

              <h1 className="text-[clamp(44px,5vw,80px)] font-semibold leading-[0.95] tracking-tight text-white">
                Invoice your clients{" "}
                <span className="text-indigo-300">professionally</span>
              </h1>

              <p className="mt-6 max-w-xl text-lg leading-relaxed text-white/80 sm:text-xl">
                Create stunning, compliant invoices in seconds. Get paid faster with
                automated reminders, global payment options, and real-time tracking.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Button
                  asChild
                  className="h-12 rounded-2xl bg-indigo-500 px-6 text-base font-semibold shadow-lg shadow-indigo-500/25 hover:bg-indigo-400"
                >
                  <Link href="/sign-up">
                    Get started free
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button
                  variant="secondary"
                  className="h-12 rounded-2xl border border-white/10 bg-white/5 px-6 text-base font-semibold text-white hover:bg-white/10 cursor-not-allowed opacity-70"
                  disabled
                  title="Demo coming soon"
                >
                  Watch demo (coming soon)
                </Button>
              </div>

              <div className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-white/80 sm:text-base">
                {trustItems.map((item) => (
                  <span key={item} className="inline-flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                    {item}
                  </span>
                ))}
              </div>
            </div>

            <Card className="rounded-3xl border-white/10 bg-[#0d0f1d]/80 p-5 shadow-[0_20px_60px_rgba(7,8,20,0.55)] backdrop-blur">
              <div className="mb-6 flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-indigo-400 to-violet-600" />
                  <div className="space-y-2">
                    <div className="h-3 w-24 rounded-full bg-white/10" />
                    <div className="h-2.5 w-16 rounded-full bg-white/10" />
                  </div>
                </div>
                <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-sm font-medium text-emerald-400">
                  <CircleCheckBig className="h-3.5 w-3.5" />
                  Paid
                </span>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-2 text-sm text-white/75">
                    <Link2 className="h-4 w-4 shrink-0" />
                    <span className="truncate">inv.oicia.co/a8x9k2</span>
                  </div>
                  <button
                    type="button"
                    className="text-sm font-medium text-indigo-400 hover:text-indigo-300"
                  >
                    Copy
                  </button>
                </div>

                <div className="mt-4 h-2 w-full rounded-full bg-white/10">
                  <div className="h-full w-full rounded-full bg-gradient-to-r from-indigo-500 via-sky-400 to-emerald-400" />
                </div>

                <div className="mt-3 flex items-center justify-between text-sm text-white/55">
                  <span>Payment received</span>
                  <span className="font-medium text-white/75">$2,450.00</span>
                </div>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                  <p className="flex items-center gap-2 text-sm text-white/75">
                    <Clock3 className="h-4 w-4" />
                    Avg. payment time
                  </p>
                  <p className="mt-2 text-3xl font-semibold text-white">3.2 days</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                  <p className="flex items-center gap-2 text-sm text-white/75">
                    <Zap className="h-4 w-4 text-emerald-400" />
                    On-time rate
                  </p>
                  <p className="mt-2 text-3xl font-semibold text-white">94%</p>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <span className="inline-flex items-center rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-sm text-white/70">
                  <FileText className="mr-1 h-3.5 w-3.5" />
                  12 invoices
                </span>
                <span className="inline-flex items-center rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3 py-1 text-sm text-indigo-300">
                  <Users className="mr-1 h-3.5 w-3.5" />
                  8 clients
                </span>
              </div>
            </Card>
          </div>
        </section>

        <section className="border-b border-white/10 py-16">
          <div className="mx-auto max-w-6xl px-6">
            <p className="text-center text-lg text-white/80">Trusted by forward-thinking companies</p>
            <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
              {Array.from({ length: 6 }).map((_, index) => (
                <div
                  key={index}
                  className="h-12 rounded-xl border border-white/5 bg-white/[0.03]"
                  aria-hidden="true"
                />
              ))}
            </div>
          </div>
        </section>

        <section id="product" className="py-20">
          <div className="mx-auto max-w-6xl px-6">
            <div className="text-center">
              <Badge className="rounded-full border border-indigo-500/35 bg-indigo-500/10 px-4 py-1.5 text-sm font-semibold text-indigo-300">
                Features
              </Badge>
              <h2 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl">
                Everything you need to get paid
              </h2>
              <p className="mt-4 text-lg text-white/80 sm:text-xl">
                Professional invoicing tools designed for modern businesses
              </p>
            </div>

            <div className="mt-10 grid gap-6 md:grid-cols-2">
              {features.map((feature) => (
                <Card
                  key={feature.title}
                  className={`relative rounded-3xl border p-8 ${
                    feature.highlighted
                      ? "border-indigo-500/35 bg-[radial-gradient(circle_at_50%_0%,rgba(96,77,255,0.2),rgba(13,15,29,0.9)_55%)]"
                      : "border-white/10 bg-[#0d0f1d]/70"
                  }`}
                >
                  {feature.badge ? (
                    <span className="absolute -right-2 -top-3 rounded-full bg-indigo-500 px-3 py-1 text-xs font-semibold">
                      {feature.badge}
                    </span>
                  ) : null}

                  <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/5">
                    <feature.icon className="h-6 w-6 text-indigo-300" />
                  </div>
                  <h3 className="text-3xl font-semibold tracking-tight text-white">{feature.title}</h3>
                  <p className="mt-3 text-lg leading-relaxed text-white/80">{feature.description}</p>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section id="pricing" className="py-20 border-b border-white/10">
          <div className="mx-auto max-w-6xl px-6">
            <div className="text-center">
              <Badge className="rounded-full border border-indigo-500/35 bg-indigo-500/10 px-4 py-1.5 text-sm font-semibold text-indigo-300">
                Pricing
              </Badge>
              <h2 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl">
                Simple, transparent pricing
              </h2>
              <p className="mt-4 text-lg text-white/80">
                Start free, upgrade when you grow. No hidden fees.
              </p>
            </div>

            <div className="mt-12 grid gap-6 md:grid-cols-3">
              {[
                {
                  name: "Starter",
                  price: "Free",
                  period: "forever",
                  description: "Perfect for freelancers and solo founders.",
                  features: ["Up to 10 invoices/month", "1 team member", "PDF export", "Email delivery", "Basic reminders"],
                  cta: "Get started",
                  href: "/sign-up",
                  highlighted: false,
                },
                {
                  name: "Professional",
                  price: "$29",
                  period: "per month",
                  description: "For growing teams that invoice at scale.",
                  features: ["Unlimited invoices", "5 team members", "Peppol & UBL XML", "Automated reminders", "Stripe payments", "Audit log"],
                  cta: "Start free trial",
                  href: "/sign-up",
                  highlighted: true,
                },
                {
                  name: "Enterprise",
                  price: "Custom",
                  period: "contact us",
                  description: "For large organisations with advanced needs.",
                  features: ["Unlimited everything", "Unlimited team members", "SSO & advanced security", "Custom compliance packs", "SLA & dedicated support", "API access"],
                  cta: "Talk to sales",
                  href: "#get-started",
                  highlighted: false,
                },
              ].map((plan) => (
                <Card
                  key={plan.name}
                  className={`relative flex flex-col rounded-3xl border p-8 ${
                    plan.highlighted
                      ? "border-indigo-500/50 bg-[radial-gradient(circle_at_50%_0%,rgba(96,77,255,0.25),rgba(13,15,29,0.95)_55%)] shadow-[0_0_40px_rgba(96,77,255,0.15)]"
                      : "border-white/10 bg-[#0d0f1d]/70"
                  }`}
                >
                  {plan.highlighted ? (
                    <span className="absolute -right-2 -top-3 rounded-full bg-indigo-500 px-3 py-1 text-xs font-semibold">
                      Most popular
                    </span>
                  ) : null}
                  <div className="mb-6">
                    <p className="text-sm font-semibold text-indigo-300 uppercase tracking-widest">{plan.name}</p>
                    <div className="mt-2 flex items-baseline gap-1">
                      <span className="text-4xl font-bold tracking-tight text-white">{plan.price}</span>
                      <span className="text-sm text-white/50">/{plan.period}</span>
                    </div>
                    <p className="mt-2 text-sm text-white/60">{plan.description}</p>
                  </div>
                  <ul className="flex-1 space-y-3 mb-8">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-center gap-2 text-sm text-white/80">
                        <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Button
                    asChild
                    className={plan.highlighted
                      ? "h-11 rounded-2xl bg-indigo-500 font-semibold shadow-lg shadow-indigo-500/20 hover:bg-indigo-400"
                      : "h-11 rounded-2xl border border-white/10 bg-white/5 font-semibold text-white hover:bg-white/10"
                    }
                    variant={plan.highlighted ? "default" : "secondary"}
                  >
                    <Link href={plan.href}>{plan.cta}</Link>
                  </Button>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section id="how-it-works" className="py-20">
          <div className="mx-auto max-w-6xl px-6">
            <div className="text-center">
              <Badge className="rounded-full border border-indigo-500/35 bg-indigo-500/10 px-4 py-1.5 text-sm font-semibold text-indigo-300">
                How it works
              </Badge>
              <h2 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl">
                Get paid in three simple steps
              </h2>
            </div>

            <div className="mt-10 grid gap-6 md:grid-cols-3">
              {steps.map((step) => (
                <Card key={step.title} className="rounded-3xl border border-white/10 bg-[#0d0f1d]/70 p-8">
                  <p className="text-7xl font-semibold tracking-tight text-indigo-900/80">{step.number}</p>
                  <div className="mt-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/5">
                    <step.icon className="h-6 w-6 text-indigo-300" />
                  </div>
                  <h3 className="mt-5 text-3xl font-semibold tracking-tight text-white">{step.title}</h3>
                  <p className="mt-3 text-lg leading-relaxed text-white/80">{step.description}</p>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section id="get-started" className="pb-20 pt-6">
          <div className="mx-auto max-w-6xl px-6">
            <Card className="rounded-3xl border border-white/10 bg-[radial-gradient(circle_at_50%_100%,rgba(98,80,255,0.24),rgba(13,15,29,0.95)_55%)] px-6 py-12 text-center sm:px-10">
              <h2 className="text-4xl font-semibold tracking-tight text-white sm:text-5xl">Ready to get paid faster?</h2>
              <p className="mx-auto mt-4 max-w-2xl text-lg leading-relaxed text-white/80 sm:text-xl">
                Join thousands of businesses using Invoicia to streamline their billing and improve cash flow.
              </p>
              <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Button
                  asChild
                  className="h-12 rounded-2xl bg-indigo-500 px-6 text-base font-semibold shadow-lg shadow-indigo-500/20 hover:bg-indigo-400"
                >
                  <Link href="/sign-up">
                    Start free trial
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button
                  variant="secondary"
                  className="h-12 rounded-2xl border border-white/10 bg-white/5 px-6 text-base font-semibold text-white hover:bg-white/10 cursor-not-allowed opacity-70"
                  disabled
                  title="Sales contact coming soon"
                >
                  Talk to sales (coming soon)
                </Button>
              </div>
              <p className="mt-6 text-sm text-white/55">
                No credit card required • Cancel anytime • 14-day free trial
              </p>
            </Card>
          </div>
        </section>
      </main>

      <footer id="changelog" className="relative z-10 border-t border-white/10 py-16">
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
            {footerColumns.map((column) => (
              <div key={column.title}>
                <h3 className="text-sm font-semibold uppercase tracking-widest text-white/50">{column.title}</h3>
                <ul className="mt-4 space-y-3">
                  {column.links.map((item) => (
                    <li key={item.label}>
                      <Link href={item.href} className="text-sm text-white/80 hover:text-white">
                        {item.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="mt-12 flex flex-col items-start justify-between gap-4 border-t border-white/10 pt-6 sm:flex-row sm:items-center">
            <div className="flex items-center gap-3 text-lg text-white/75">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600">
                <FileText className="h-4 w-4" />
              </span>
              © 2026 Invoicia. All rights reserved.
            </div>
            <div className="flex items-center gap-4 text-white/75">
              <a href="https://twitter.com/invoicia" target="_blank" rel="noopener noreferrer" aria-label="Invoicia on Twitter" className="hover:text-white">
                <Twitter className="h-5 w-5" />
              </a>
              <a href="https://github.com/invoicia" target="_blank" rel="noopener noreferrer" aria-label="Invoicia on GitHub" className="hover:text-white">
                <Github className="h-5 w-5" />
              </a>
              <a href="https://linkedin.com/company/invoicia" target="_blank" rel="noopener noreferrer" aria-label="Invoicia on LinkedIn" className="hover:text-white">
                <Linkedin className="h-5 w-5" />
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
