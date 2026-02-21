import Link from "next/link";
import { FileText } from "lucide-react";

export const metadata = { title: "Terms of Service – Invoicia" };

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="mx-auto max-w-4xl px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary">
              <FileText className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="text-lg font-bold tracking-tight text-foreground">Invoicia</span>
          </Link>
          <nav className="flex items-center gap-4 text-sm text-muted-foreground">
            <Link href="/privacy" className="hover:text-foreground">Privacy</Link>
            <Link href="/sign-in" className="hover:text-foreground">Sign in</Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-12 space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Terms of Service</h1>
          <p className="mt-2 text-sm text-muted-foreground">Last updated: February 2026</p>
        </div>

        <div className="prose prose-zinc dark:prose-invert max-w-none space-y-6 text-sm text-foreground leading-relaxed">
          <section>
            <h2 className="text-base font-semibold mb-2">1. Acceptance of Terms</h2>
            <p className="text-muted-foreground">
              By accessing or using Invoicia (&ldquo;the Service&rdquo;), you agree to be bound by these Terms of Service.
              If you do not agree to these terms, please do not use the Service.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold mb-2">2. Use of the Service</h2>
            <p className="text-muted-foreground">
              Invoicia provides an invoicing and billing management platform. You may use the Service only for lawful
              purposes and in accordance with these Terms. You are responsible for maintaining the confidentiality of
              your account credentials.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold mb-2">3. Data and Privacy</h2>
            <p className="text-muted-foreground">
              Your use of the Service is also governed by our{" "}
              <Link href="/privacy" className="text-primary hover:underline">Privacy Policy</Link>.
              We process your data as described therein.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold mb-2">4. Intellectual Property</h2>
            <p className="text-muted-foreground">
              All content, features, and functionality of the Service are owned by Invoicia and protected by
              applicable intellectual property laws. You retain ownership of data you upload or create.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold mb-2">5. Limitation of Liability</h2>
            <p className="text-muted-foreground">
              To the fullest extent permitted by law, Invoicia shall not be liable for any indirect, incidental,
              special, consequential, or punitive damages arising from your use of the Service.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold mb-2">6. Modifications</h2>
            <p className="text-muted-foreground">
              We reserve the right to modify these Terms at any time. We will notify you of material changes by
              posting a notice in the application or sending an email. Continued use of the Service after changes
              constitutes acceptance.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold mb-2">7. Contact</h2>
            <p className="text-muted-foreground">
              For questions about these Terms, contact us at{" "}
              <a href="mailto:legal@invoicia.app" className="text-primary hover:underline">legal@invoicia.app</a>.
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
