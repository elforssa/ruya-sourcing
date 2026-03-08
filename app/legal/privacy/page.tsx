import Link from "next/link";

export const metadata = {
  title: "Privacy Policy | RUYA",
  description: "How RUYA collects, uses, and protects your personal data.",
};

export default function PrivacyPage() {
  return (
    <div
      className="min-h-screen"
      style={{ background: "linear-gradient(135deg, #071526 0%, #0B1F3B 50%, #0F2744 100%)" }}
    >
      <div className="max-w-3xl mx-auto px-6 py-16">

        {/* Header */}
        <div className="mb-12">
          <Link
            href="/auth/login"
            className="inline-flex items-center gap-2 text-xs uppercase tracking-widest mb-10 transition-opacity hover:opacity-70"
            style={{ color: "rgba(201,168,76,0.6)" }}
          >
            ← Back to Login
          </Link>
          <div className="flex items-center gap-4 mb-4">
            <div
              className="flex items-center justify-center w-10 h-10 rounded-xl shrink-0"
              style={{ background: "rgba(201,168,76,0.1)", border: "1px solid rgba(201,168,76,0.25)" }}
            >
              <span className="text-sm font-bold" style={{ color: "#C9A84C" }}>R</span>
            </div>
            <span className="text-xs tracking-[0.2em] uppercase" style={{ color: "rgba(201,168,76,0.5)" }}>
              RUYA Global Sourcing
            </span>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Privacy Policy</h1>
          <p className="text-sm" style={{ color: "rgba(255,255,255,0.35)" }}>
            Last updated: March 2025 &nbsp;·&nbsp; Effective immediately
          </p>
        </div>

        {/* Card */}
        <div
          className="rounded-2xl p-8 md:p-10 space-y-8"
          style={{
            background: "rgba(15,39,68,0.7)",
            border: "1px solid rgba(201,168,76,0.12)",
            backdropFilter: "blur(10px)",
          }}
        >
          <Section title="1. Introduction">
            <p>
              RUYA Global Sourcing (&ldquo;RUYA&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo;) is committed to protecting your
              personal information. This Privacy Policy explains what data we collect, how we use it, and the
              rights you have regarding your information when you use the RUYA platform.
            </p>
          </Section>

          <Section title="2. Data We Collect">
            <p>We collect the following categories of personal data:</p>
            <ul>
              <li><strong className="text-white">Account data:</strong> Full name, email address, hashed password, and role (client or agent).</li>
              <li><strong className="text-white">Usage data:</strong> Sourcing requests, quotations, order history, status updates, and messages exchanged on the platform.</li>
              <li><strong className="text-white">Payment data:</strong> Payment receipt images or PDFs uploaded by clients. We do not store card numbers or banking credentials.</li>
              <li><strong className="text-white">Technical data:</strong> IP addresses (used solely for rate limiting and abuse prevention), browser type, and access timestamps.</li>
              <li><strong className="text-white">Communications:</strong> Emails sent to or from your registered address via our transactional email provider.</li>
            </ul>
          </Section>

          <Section title="3. How We Use Your Data">
            <p>Your data is used exclusively to:</p>
            <ul>
              <li>Operate and personalise your account and dashboard.</li>
              <li>Facilitate sourcing request workflows between clients and agents.</li>
              <li>Send transactional emails (email verification, password reset, order updates).</li>
              <li>Detect and prevent fraud, abuse, and unauthorised access.</li>
              <li>Comply with applicable legal obligations.</li>
            </ul>
            <p className="mt-3">
              We do not sell, rent, or share your personal data with third parties for marketing purposes.
            </p>
          </Section>

          <Section title="4. Data Storage and Security">
            <p>
              Your data is stored in a hosted PostgreSQL database managed through a secure cloud provider.
              Passwords are hashed using bcrypt with a cost factor of 12 and are never stored in plain text.
              Authentication tokens (session, email verification, password reset) are single-use and
              time-limited.
            </p>
            <p className="mt-3">
              We implement technical safeguards including HTTPS/TLS encryption in transit, HTTP security
              headers (HSTS, CSP, X-Frame-Options), and access controls limiting data visibility to
              authenticated, authorised users only.
            </p>
          </Section>

          <Section title="5. Cookies and Sessions">
            <p>
              RUYA uses a single session cookie to maintain your authenticated session. This cookie is
              HttpOnly and Secure, meaning it cannot be accessed by client-side JavaScript and is only
              transmitted over encrypted connections.
            </p>
            <p className="mt-3">
              We do not use advertising cookies, analytics trackers, or third-party tracking pixels.
            </p>
          </Section>

          <Section title="6. Third-Party Services">
            <p>We use the following sub-processors:</p>
            <ul>
              <li><strong className="text-white">Vercel</strong> — platform hosting and deployment (EU/US regions).</li>
              <li><strong className="text-white">Neon / Supabase</strong> — managed PostgreSQL database hosting.</li>
              <li><strong className="text-white">Resend</strong> — transactional email delivery. Your email address is shared with Resend solely to deliver emails you request.</li>
              <li><strong className="text-white">Upstash Redis</strong> — rate limiting counters (IP addresses only; no personal data stored).</li>
            </ul>
            <p className="mt-3">
              Each sub-processor is contractually bound to process data only as directed by RUYA and in
              accordance with applicable data protection law.
            </p>
          </Section>

          <Section title="7. Data Retention">
            <p>
              We retain your account data for as long as your account is active. If you request account
              deletion, we will remove your personal data within 30 days, except where retention is required
              by law (e.g. financial records).
            </p>
            <p className="mt-3">
              Password reset tokens are automatically invalidated after 1 hour. Email verification tokens
              expire after 24 hours.
            </p>
          </Section>

          <Section title="8. Your Rights">
            <p>Depending on your jurisdiction, you may have the right to:</p>
            <ul>
              <li><strong className="text-white">Access</strong> — request a copy of the personal data we hold about you.</li>
              <li><strong className="text-white">Rectification</strong> — request correction of inaccurate data.</li>
              <li><strong className="text-white">Erasure</strong> — request deletion of your account and associated data.</li>
              <li><strong className="text-white">Portability</strong> — receive your data in a machine-readable format.</li>
              <li><strong className="text-white">Objection</strong> — object to processing based on legitimate interests.</li>
            </ul>
            <p className="mt-3">
              To exercise any of these rights, contact us at{" "}
              <a href="mailto:privacy@ruya-sourcing.com" style={{ color: "#C9A84C" }}>
                privacy@ruya-sourcing.com
              </a>.
            </p>
          </Section>

          <Section title="9. Children's Privacy">
            <p>
              The Service is not directed to individuals under the age of 18. We do not knowingly collect
              personal data from minors. If you believe a minor has registered an account, contact us and
              we will promptly delete the account.
            </p>
          </Section>

          <Section title="10. Changes to This Policy">
            <p>
              We may update this Privacy Policy periodically. We will notify registered users of material
              changes via email at least 7 days before they take effect. The &ldquo;last updated&rdquo; date at the top
              of this page reflects the most recent revision.
            </p>
          </Section>

          <Section title="11. Contact">
            <p>
              For privacy-related enquiries, contact our data team at{" "}
              <a href="mailto:privacy@ruya-sourcing.com" style={{ color: "#C9A84C" }}>
                privacy@ruya-sourcing.com
              </a>.
            </p>
          </Section>
        </div>

        {/* Footer */}
        <div className="mt-10 text-center space-y-3">
          <div className="flex items-center justify-center gap-6 text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>
            <Link href="/legal/terms" className="hover:text-white transition-colors" style={{ color: "rgba(201,168,76,0.5)" }}>
              Terms of Service
            </Link>
            <span>·</span>
            <Link href="/auth/login" className="hover:text-white transition-colors">
              Sign In
            </Link>
            <span>·</span>
            <Link href="/auth/register" className="hover:text-white transition-colors">
              Register
            </Link>
          </div>
          <p className="text-xs" style={{ color: "rgba(255,255,255,0.12)" }}>
            © {new Date().getFullYear()} RUYA. All rights reserved.
          </p>
        </div>

      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2
        className="text-sm font-bold uppercase tracking-wider mb-3"
        style={{ color: "#C9A84C" }}
      >
        {title}
      </h2>
      <div className="text-sm leading-relaxed space-y-2" style={{ color: "rgba(255,255,255,0.6)" }}>
        {children}
      </div>
    </section>
  );
}
