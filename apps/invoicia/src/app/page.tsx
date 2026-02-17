import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  CircleCheckBig,
  Clock3,
  Copy,
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

const navLinks = ["Product", "Pricing", "Docs", "Changelog"];

const trustItems = ["No credit card", "2 min setup", "Bank-level secure"];

const features = [
  {
    title: "Buyer-first",
    description:
      "Beautiful, mobile-optimized invoices your clients will love. Multiple payment options, real-time status updates, and instant receipts.",
    icon: Users,
    highlighted: false,
  },
  {
    title: "Automation",
    description:
      "Set it and forget it. Automated reminders, recurring invoices, and smart follow-ups keep your cash flow healthy without lifting a finger.",
    icon: Zap,
    highlighted: true,
    badge: "Most Popular",
  },
  {
    title: "Compliance",
    description:
      "Stay compliant effortlessly. Automatic tax calculations, audit trails, and secure archiving. Built-in support for GDPR, SOC 2, and more.",
    icon: Shield,
    highlighted: false,
  },
  {
    title: "Global-ready",
    description:
      "Invoice in 135+ currencies with automatic conversion. Accept payments from anywhere with local payment methods and multi-language support.",
    icon: Globe2,
    highlighted: false,
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

const footerColumns = [
  {
    title: "Product",
    links: ["Features", "Pricing", "API", "Changelog", "Documentation"],
  },
  {
    title: "Company",
    links: ["About", "Blog", "Careers", "Press", "Partners"],
  },
  {
    title: "Resources",
    links: ["Community", "Support", "Status", "Templates", "Guides"],
  },
  {
    title: "Legal",
    links: ["Privacy", "Terms", "Security", "Compliance", "Cookies"],
  },
];

const logos = ["Company", "Studio", "Summit", "Foundry", "Pulse", "Core"];

export default function LandingPage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#07080d] text-[#edf0ff]">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_34%,rgba(86,74,255,0.22),transparent_56%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_75%,rgba(56,38,180,0.2),transparent_58%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(7,8,13,0.24)_0%,rgba(7,8,13,0.82)_85%,#07080d_100%)]" />
      </div>

      <header className="sticky top-0 z-50 border-b border-white/10 bg-[#080a14]/75 backdrop-blur-xl">
        <nav className="mx-auto flex h-[114px] w-full max-w-[1780px] items-center justify-between px-5 sm:px-10">
          <Link
            href="/"
            className="group flex items-center gap-3 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6759ff]/70"
          >
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-b from-[#6b5dff] to-[#5542f4] shadow-[0_12px_28px_rgba(95,79,255,0.35)]">
              <FileText className="h-5 w-5 text-white" />
            </span>
            <span className="text-[42px] font-semibold leading-none tracking-[-0.02em] text-white sm:text-[44px]">
              Invoicia
            </span>
          </Link>

          <div className="hidden items-center gap-14 lg:flex">
            {navLinks.map((link) => (
              <Link
                key={link}
                href="#"
                className="text-[37px] font-medium leading-none text-white/68 transition-colors hover:text-white focus-visible:outline-none focus-visible:text-white"
              >
                {link}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-5">
            <Button
              asChild
              variant="ghost"
              className="hidden h-auto rounded-full px-0 py-0 text-[37px] font-medium text-white/76 hover:bg-transparent hover:text-white md:inline-flex"
            >
              <Link href="/sign-in">Sign in</Link>
            </Button>
            <Button
              asChild
              className="h-[80px] rounded-[30px] bg-gradient-to-r from-[#5f55ff] to-[#5542f4] px-10 text-[37px] font-semibold text-white shadow-[0_16px_32px_rgba(78,66,240,0.45)] hover:brightness-110"
            >
              <Link href="/sign-up">Get started</Link>
            </Button>
          </div>
        </nav>
      </header>

      <main className="relative z-10">
        <section className="border-b border-white/10">
          <div className="mx-auto w-full max-w-[1780px] px-5 pb-24 pt-16 sm:px-10 lg:pt-20">
            <div className="grid gap-14 lg:grid-cols-[1fr_0.98fr] lg:items-center">
              <div>
                <Badge className="mb-14 h-[62px] rounded-full border border-[#473ab8] bg-[#171a46]/80 px-7 text-[32px] font-semibold text-[#9098ff] shadow-[0_0_0_1px_rgba(113,96,255,0.2)_inset]">
                  <Sparkles className="mr-3 h-7 w-7" />
                  Now with AI-powered insights
                </Badge>

                <h1 className="max-w-[920px] text-[96px] font-semibold leading-[0.98] tracking-[-0.03em] text-[#f4f6ff] sm:text-[114px] xl:text-[148px]">
                  Invoice your clients{" "}
                  <span className="block bg-gradient-to-r from-[#6f76ff] via-[#8387ff] to-[#9a91ff] bg-clip-text text-transparent">
                    professionally
                  </span>
                </h1>

                <p className="mt-12 max-w-[930px] text-[40px] leading-[1.48] text-[#9ca6bf] sm:text-[44px] xl:text-[50px]">
                  Create stunning, compliant invoices in seconds. Get paid faster
                  with automated reminders, global payment options, and real-time
                  tracking.
                </p>

                <div className="mt-14 flex flex-col gap-5 sm:flex-row">
                  <Button
                    asChild
                    className="h-[98px] rounded-[30px] bg-gradient-to-r from-[#5f55ff] to-[#5542f4] px-14 text-[46px] font-semibold text-white shadow-[0_20px_40px_rgba(88,73,250,0.45)] hover:brightness-110"
                  >
                    <Link href="/sign-up">
                      Get started free
                      <ArrowRight className="ml-4 h-11 w-11" />
                    </Link>
                  </Button>
                  <Button
                    asChild
                    variant="secondary"
                    className="h-[98px] rounded-[30px] border border-white/12 bg-white/[0.05] px-14 text-[46px] font-semibold text-white hover:bg-white/[0.09]"
                  >
                    <Link href="#">Watch demo</Link>
                  </Button>
                </div>

                <div className="mt-14 flex flex-wrap gap-x-10 gap-y-5">
                  {trustItems.map((item) => (
                    <div
                      key={item}
                      className="flex items-center gap-3 text-[37px] font-medium text-[#9ca7c0]"
                    >
                      <CheckCircle2 className="h-8 w-8 text-[#08d698]" />
                      {item}
                    </div>
                  ))}
                </div>
              </div>

              <Card className="relative overflow-hidden rounded-[42px] border border-white/10 bg-[#0b0d1a]/90 px-7 py-8 shadow-[0_35px_70px_rgba(5,7,17,0.65)] sm:px-10 sm:py-10">
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_70%_10%,rgba(80,64,255,0.12),transparent_45%)]" />

                <div className="relative z-10">
                  <div className="mb-10 flex items-start justify-between">
                    <div className="flex items-center gap-4">
                      <div className="h-20 w-20 rounded-[24px] bg-gradient-to-br from-[#6a63ff] to-[#5a42f4]" />
                      <div className="space-y-3">
                        <div className="h-8 w-44 rounded-full bg-white/7" />
                        <div className="h-6 w-28 rounded-full bg-white/7" />
                      </div>
                    </div>
                    <span className="inline-flex h-16 items-center rounded-full border border-[#05a87b]/40 bg-[#05261d] px-6 text-[34px] font-semibold text-[#08d698]">
                      <CircleCheckBig className="mr-2.5 h-7 w-7" />
                      Paid
                    </span>
                  </div>

                  <div className="rounded-[30px] border border-white/10 bg-white/[0.04] p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] sm:p-7">
                    <div className="flex items-center justify-between gap-4 text-[39px] text-[#95a0b8]">
                      <div className="flex min-w-0 items-center gap-3">
                        <Link2 className="h-8 w-8 shrink-0 text-[#8a93ad]" />
                        <span className="truncate">inv.oicia.co/a8x9k2</span>
                      </div>
                      <button
                        type="button"
                        className="inline-flex items-center gap-2 rounded-xl px-2 py-1 text-[39px] font-semibold text-[#6b65ff] transition hover:text-[#8f8bff] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6b65ff]/70"
                      >
                        Copy
                        <Copy className="h-7 w-7" />
                      </button>
                    </div>

                    <div className="mt-6 h-4 rounded-full bg-[#1f2340]">
                      <div className="h-full w-full rounded-full bg-gradient-to-r from-[#5a53ff] via-[#43a0ff] to-[#17d398]" />
                    </div>

                    <div className="mt-6 flex items-center justify-between text-[35px] text-[#9ca7bf]">
                      <span>Payment received</span>
                      <span className="font-medium text-[#d5daf3]">$2,450.00</span>
                    </div>
                  </div>

                  <div className="mt-6 grid gap-5 sm:grid-cols-2">
                    <div className="rounded-[24px] border border-white/10 bg-white/[0.04] p-6">
                      <p className="mb-4 flex items-center gap-2 text-[33px] text-[#a3acc2]">
                        <Clock3 className="h-7 w-7 text-[#8d95ab]" />
                        Avg. payment time
                      </p>
                      <p className="text-[62px] font-semibold leading-none text-white">
                        3.2 days
                      </p>
                    </div>
                    <div className="rounded-[24px] border border-white/10 bg-white/[0.04] p-6">
                      <p className="mb-4 flex items-center gap-2 text-[33px] text-[#a3acc2]">
                        <Zap className="h-7 w-7 text-[#15d597]" />
                        On-time rate
                      </p>
                      <p className="text-[62px] font-semibold leading-none text-white">
                        94%
                      </p>
                    </div>
                  </div>

                  <div className="mt-6 flex gap-4">
                    <span className="inline-flex h-14 items-center rounded-full border border-white/12 bg-white/[0.05] px-6 text-[33px] font-medium text-[#b8c0da]">
                      <FileText className="mr-2 h-6 w-6" />
                      12 invoices
                    </span>
                    <span className="inline-flex h-14 items-center rounded-full border border-[#3948bf] bg-[#111738] px-6 text-[33px] font-medium text-[#8893ff]">
                      <Users className="mr-2 h-6 w-6" />
                      8 clients
                    </span>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </section>

        <section className="border-b border-white/10 py-24">
          <div className="mx-auto w-full max-w-[1780px] px-5 sm:px-10">
            <p className="text-center text-[44px] font-medium text-[#9ba4bd]">
              Trusted by forward-thinking companies
            </p>
            <div className="mx-auto mt-12 grid max-w-[1500px] grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-6">
              {logos.map((logo) => (
                <div
                  key={logo}
                  className="h-[82px] rounded-2xl border border-white/[0.04] bg-white/[0.03] opacity-70"
                  aria-hidden="true"
                />
              ))}
            </div>
          </div>
        </section>

        <section className="py-24">
          <div className="mx-auto w-full max-w-[1780px] px-5 sm:px-10">
            <div className="mx-auto max-w-[1180px] text-center">
              <Badge className="mb-8 h-[56px] rounded-full border border-[#4033ab] bg-[#171a46]/75 px-7 text-[30px] font-semibold text-[#818cff]">
                Features
              </Badge>
              <h2 className="text-[72px] font-semibold leading-[1.06] tracking-[-0.02em] text-[#eff2ff] sm:text-[90px] xl:text-[108px]">
                Everything you need to get paid
              </h2>
              <p className="mt-8 text-[42px] leading-[1.4] text-[#9ca5bf] sm:text-[46px]">
                Professional invoicing tools designed for modern businesses
              </p>
            </div>

            <div className="mt-14 grid gap-7 lg:grid-cols-2">
              {features.map((feature) => (
                <Card
                  key={feature.title}
                  className={`relative overflow-hidden rounded-[36px] border px-10 pb-12 pt-10 shadow-[0_20px_44px_rgba(0,0,0,0.28)] ${
                    feature.highlighted
                      ? "border-[#3f46c9] bg-[radial-gradient(circle_at_20%_0%,rgba(86,74,255,0.24),rgba(15,18,40,0.95)_50%)] shadow-[0_0_0_1px_rgba(95,86,255,0.35),0_28px_56px_rgba(34,30,94,0.35)]"
                      : "border-white/10 bg-[#0c0e1b]/85"
                  }`}
                >
                  {feature.badge ? (
                    <span className="absolute right-8 top-6 inline-flex h-14 items-center rounded-full bg-gradient-to-r from-[#5f55ff] to-[#5542f4] px-6 text-[32px] font-semibold text-white">
                      {feature.badge}
                    </span>
                  ) : null}
                  <div className="mb-8 flex h-[94px] w-[94px] items-center justify-center rounded-[28px] bg-white/[0.06]">
                    <feature.icon className="h-11 w-11 text-[#9199b2]" />
                  </div>
                  <h3 className="text-[58px] font-semibold leading-none text-[#edf0ff]">
                    {feature.title}
                  </h3>
                  <p className="mt-7 text-[40px] leading-[1.45] text-[#9ea8c1]">
                    {feature.description}
                  </p>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="py-24">
          <div className="mx-auto w-full max-w-[1780px] px-5 sm:px-10">
            <div className="mx-auto max-w-[1180px] text-center">
              <Badge className="mb-8 h-[56px] rounded-full border border-[#4033ab] bg-[#171a46]/75 px-7 text-[30px] font-semibold text-[#818cff]">
                How it works
              </Badge>
              <h2 className="text-[72px] font-semibold leading-[1.06] tracking-[-0.02em] text-[#eff2ff] sm:text-[90px] xl:text-[108px]">
                Get paid in three simple steps
              </h2>
            </div>

            <div className="mt-14 grid gap-7 lg:grid-cols-3">
              {steps.map((step) => (
                <Card
                  key={step.title}
                  className="rounded-[34px] border border-white/10 bg-[#0c0e1b]/90 px-10 pb-10 pt-8"
                >
                  <p className="text-[126px] font-semibold leading-none tracking-[-0.03em] text-[#2b2f62]/68">
                    {step.number}
                  </p>
                  <div className="mt-8 flex h-[94px] w-[94px] items-center justify-center rounded-[28px] bg-white/[0.06]">
                    <step.icon className="h-11 w-11 text-[#7d88ff]" />
                  </div>
                  <h3 className="mt-8 text-[58px] font-semibold leading-[1.05] text-[#eef1ff]">
                    {step.title}
                  </h3>
                  <p className="mt-6 text-[39px] leading-[1.45] text-[#9ea8c1]">
                    {step.description}
                  </p>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="pb-24 pt-8">
          <div className="mx-auto w-full max-w-[1780px] px-5 sm:px-10">
            <div className="mx-auto max-w-[1380px] rounded-[42px] border border-white/10 bg-[radial-gradient(circle_at_50%_100%,rgba(91,79,255,0.26),rgba(10,12,24,0.95)_52%)] px-10 py-16 text-center shadow-[0_26px_70px_rgba(7,8,18,0.6)]">
              <h2 className="text-[72px] font-semibold leading-[1.06] tracking-[-0.02em] text-[#eef1ff] sm:text-[86px]">
                Ready to get paid faster?
              </h2>
              <p className="mx-auto mt-8 max-w-[980px] text-[40px] leading-[1.42] text-[#9ea8c1]">
                Join thousands of businesses using Invoicia to streamline their
                billing and improve cash flow.
              </p>
              <div className="mt-12 flex flex-col items-center justify-center gap-5 sm:flex-row">
                <Button
                  asChild
                  className="h-[98px] rounded-[30px] bg-gradient-to-r from-[#5f55ff] to-[#5542f4] px-14 text-[44px] font-semibold text-white shadow-[0_16px_34px_rgba(88,73,250,0.35)] hover:brightness-110"
                >
                  <Link href="/sign-up">
                    Start free trial
                    <ArrowRight className="ml-4 h-10 w-10" />
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="secondary"
                  className="h-[98px] rounded-[30px] border border-white/12 bg-white/[0.05] px-14 text-[44px] font-semibold text-white hover:bg-white/[0.09]"
                >
                  <Link href="#">Talk to sales</Link>
                </Button>
              </div>
              <p className="mt-10 text-[35px] text-[#9ba5bf]">
                No credit card required • Cancel anytime • 14-day free trial
              </p>
            </div>
          </div>
        </section>
      </main>

      <footer className="relative z-10 border-t border-white/10 pb-12 pt-20">
        <div className="mx-auto w-full max-w-[1780px] px-5 sm:px-10">
          <div className="grid gap-14 sm:grid-cols-2 lg:grid-cols-4">
            {footerColumns.map((column) => (
              <div key={column.title}>
                <h3 className="text-[46px] font-semibold text-[#edf0ff]">
                  {column.title}
                </h3>
                <ul className="mt-7 space-y-5">
                  {column.links.map((item) => (
                    <li key={item}>
                      <Link
                        href="#"
                        className="text-[39px] text-[#95a0bc] transition hover:text-white"
                      >
                        {item}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="mt-16 flex flex-col items-start justify-between gap-6 border-t border-white/10 pt-10 sm:flex-row sm:items-center">
            <div className="flex items-center gap-4 text-[37px] text-[#9ba6c0]">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-b from-[#6b5dff] to-[#5542f4]">
                <FileText className="h-5 w-5 text-white" />
              </span>
              <span>© 2026 Invoicia. All rights reserved.</span>
            </div>
            <div className="flex items-center gap-6 text-[#9ba6c0]">
              <Link href="#" aria-label="Twitter" className="transition hover:text-white">
                <Twitter className="h-9 w-9" />
              </Link>
              <Link href="#" aria-label="GitHub" className="transition hover:text-white">
                <Github className="h-9 w-9" />
              </Link>
              <Link href="#" aria-label="LinkedIn" className="transition hover:text-white">
                <Linkedin className="h-9 w-9" />
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
