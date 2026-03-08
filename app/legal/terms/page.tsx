import Link from "next/link";

export const metadata = {
  title: "Terms of Service | RUYA",
  description: "Terms and conditions governing use of the RUYA Global Sourcing Platform.",
};

export default function TermsPage() {
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
          <h1 className="text-3xl font-bold text-white mb-2">Terms of Service</h1>
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
          <Section title="1. Acceptance of Terms">
            <p>
              By accessing or using the RUYA Global Sourcing Platform (&ldquo;Service&rdquo;), you agree to be
              bound by these Terms of Service (&ldquo;Terms&rdquo;). If you do not agree, you may not use the
              Service. These Terms apply to all users including clients, sourcing agents, and administrators.
            </p>
          </Section>

          <Section title="2. Description of Service">
            <p>
              RUYA is a B2B global sourcing platform that connects clients seeking to source products with
              professional sourcing agents. The platform facilitates request submission, quotation management,
              order tracking, payment coordination, and communications between parties.
            </p>
          </Section>

          <Section title="3. Eligibility">
            <p>
              You must be at least 18 years of age and have the legal capacity to enter into binding agreements
              to use the Service. By registering, you represent that all information you provide is accurate,
              current, and complete.
            </p>
          </Section>

          <Section title="4. Account Responsibilities">
            <ul>
              <li>You are solely responsible for maintaining the confidentiality of your login credentials.</li>
              <li>You agree to notify us immediately at <a href="mailto:support@ruya-sourcing.com" style={{ color: "#C9A84C" }}>support@ruya-sourcing.com</a> of any unauthorised use of your account.</li>
              <li>You may not share, transfer, or sell your account to any third party.</li>
              <li>RUYA reserves the right to suspend or terminate accounts that violate these Terms.</li>
            </ul>
          </Section>

          <Section title="5. Client Obligations">
            <p>Clients using the platform agree to:</p>
            <ul>
              <li>Provide accurate product specifications and sourcing requirements.</li>
              <li>Communicate in good faith with assigned sourcing agents.</li>
              <li>Submit genuine payment receipts when confirming order payments.</li>
              <li>Not misuse the quotation or revision process to extract supplier intelligence without intent to purchase.</li>
            </ul>
          </Section>

          <Section title="6. Agent Obligations">
            <p>Sourcing agents on the platform agree to:</p>
            <ul>
              <li>Provide accurate, professional quotations based on genuine supplier research.</li>
              <li>Maintain confidentiality of client requirements and not share them with unauthorised parties.</li>
              <li>Update order statuses promptly and accurately.</li>
              <li>Comply with all applicable trade, export, and import regulations.</li>
            </ul>
          </Section>

          <Section title="7. Payments and Fees">
            <p>
              Payments for sourced products are coordinated through the platform. Clients agree to submit
              payment receipts as proof of transfer. RUYA does not process payments directly and is not
              responsible for losses arising from payment disputes between clients and suppliers.
            </p>
            <p className="mt-3">
              Platform service fees, if applicable, will be disclosed prior to the acceptance of any quotation.
            </p>
          </Section>

          <Section title="8. Intellectual Property">
            <p>
              All content, trademarks, logos, and software comprising the Service are the property of RUYA or
              its licensors. You may not reproduce, distribute, or create derivative works without explicit
              written permission.
            </p>
          </Section>

          <Section title="9. Limitation of Liability">
            <p>
              To the maximum extent permitted by law, RUYA shall not be liable for any indirect, incidental,
              special, or consequential damages arising from your use of the Service, including but not limited
              to product defects, shipping delays, or supplier non-performance.
            </p>
            <p className="mt-3">
              Our total liability in any matter relating to the Service shall not exceed the fees paid by you
              to RUYA in the three (3) months preceding the claim.
            </p>
          </Section>

          <Section title="10. Termination">
            <p>
              Either party may terminate an account at any time. RUYA may suspend or terminate access
              immediately for violations of these Terms, fraudulent activity, or any conduct that harms the
              platform or its users.
            </p>
          </Section>

          <Section title="11. Governing Law">
            <p>
              These Terms shall be governed by and construed in accordance with applicable law. Any disputes
              arising under these Terms shall be resolved through good-faith negotiation, and if unresolved,
              through binding arbitration.
            </p>
          </Section>

          <Section title="12. Changes to Terms">
            <p>
              We may update these Terms from time to time. We will notify registered users of material changes
              via email. Continued use of the Service after changes constitutes acceptance of the new Terms.
            </p>
          </Section>

          <Section title="13. Contact">
            <p>
              For questions about these Terms, contact us at{" "}
              <a href="mailto:legal@ruya-sourcing.com" style={{ color: "#C9A84C" }}>
                legal@ruya-sourcing.com
              </a>.
            </p>
          </Section>
        </div>

        {/* Footer */}
        <div className="mt-10 text-center space-y-3">
          <div className="flex items-center justify-center gap-6 text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>
            <Link href="/legal/privacy" className="hover:text-white transition-colors" style={{ color: "rgba(201,168,76,0.5)" }}>
              Privacy Policy
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
