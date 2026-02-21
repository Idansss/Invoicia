import Link from "next/link";
import { FileText } from "lucide-react";

export const metadata = { title: "Privacy Policy – Invoicia" };

export default function PrivacyPage() {
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
            <Link href="/terms" className="hover:text-foreground">Terms</Link>
            <Link href="/sign-in" className="hover:text-foreground">Sign in</Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-12 space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Privacy Policy</h1>
          <p className="mt-2 text-sm text-muted-foreground">Last updated: February 2026</p>
        </div>

        <div className="prose prose-zinc dark:prose-invert max-w-none space-y-6 text-sm text-foreground leading-relaxed">
          <section>
            <h2 className="text-base font-semibold mb-2">1. Information We Collect</h2>
            <p className="text-muted-foreground">
              We collect information you provide directly, including your name, email address, and organization
              details when you create an account. We also collect invoice data, customer information, and payment
              records you enter into the Service.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold mb-2">2. How We Use Your Information</h2>
            <p className="text-muted-foreground">
              We use your information to provide, maintain, and improve the Service; send transactional emails
              (invoice delivery, payment confirmations, reminders); and respond to your support requests.
              We do not sell your personal information to third parties.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold mb-2">3. Data Storage and Security</h2>
            <p className="text-muted-foreground">
              Your data is stored securely using industry-standard encryption in transit and at rest. We implement
              technical and organisational measures to protect against unauthorised access, alteration, or disclosure.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold mb-2">4. Data Retention</h2>
            <p className="text-muted-foreground">
              We retain your data for as long as your account is active or as needed to provide the Service.
              You may request deletion of your account and associated data at any time by contacting us.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold mb-2">5. Third-Party Services</h2>
            <p className="text-muted-foreground">
              We use third-party services including Stripe for payment processing and email delivery providers
              for transactional communications. These services have their own privacy policies governing
              their use of your information.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold mb-2">6. Your Rights</h2>
            <p className="text-muted-foreground">
              Depending on your jurisdiction, you may have rights to access, correct, or delete your personal data.
              To exercise these rights, contact us at{" "}
              <a href="mailto:privacy@invoicia.app" className="text-primary hover:underline">privacy@invoicia.app</a>.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold mb-2">7. Changes to This Policy</h2>
            <p className="text-muted-foreground">
              We may update this Privacy Policy from time to time. We will notify you of significant changes by
              posting a notice in the application or sending an email.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold mb-2">8. Contact Us</h2>
            <p className="text-muted-foreground">
              For privacy-related questions, contact us at{" "}
              <a href="mailto:privacy@invoicia.app" className="text-primary hover:underline">privacy@invoicia.app</a>.
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
