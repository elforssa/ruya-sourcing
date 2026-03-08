import Link from "next/link";
import Image from "next/image";
import { ClipboardList, FileCheck, PackageCheck, Users, Eye, ShieldCheck } from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen">

      {/* ── Navbar ── */}
      <header style={{ background: "linear-gradient(135deg, #071526 0%, #0B1F3B 100%)" }}
        className="sticky top-0 z-50 border-b border-white/10 backdrop-blur-sm">
        <div className="container mx-auto flex h-16 items-center justify-between px-6">
          {/* Logo */}
          <Image src="/logo.png" alt="RUYA" width={160} height={50} priority className="h-8 w-auto" />
          {/* CTA */}
          <Link
            href="/auth/login"
            className="rounded-lg px-5 py-2 text-sm font-bold tracking-wide transition-all"
            style={{ background: "#C9A84C", color: "#0B1F3B" }}
          >
            Sign In
          </Link>
        </div>
      </header>

      {/* ── Section 1: Hero ── */}
      <section
        className="relative overflow-hidden py-24 px-6 text-center"
        style={{ background: "linear-gradient(160deg, #071526 0%, #0B1F3B 50%, #0F2744 100%)" }}
      >
        {/* Subtle radial glow */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background: "radial-gradient(ellipse 80% 50% at 50% 0%, rgba(201,168,76,0.08) 0%, transparent 70%)",
          }}
        />

        <div className="relative mx-auto max-w-3xl">
          {/* Logo */}
          <Image src="/logo.png" alt="RUYA" width={160} height={50} priority className="h-20 w-auto mx-auto mb-6" />

          {/* Badge */}
          <div
            className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-medium tracking-widest uppercase mb-8"
            style={{ background: "rgba(201,168,76,0.1)", border: "1px solid rgba(201,168,76,0.3)", color: "rgba(201,168,76,0.85)" }}
          >
            <span className="h-1.5 w-1.5 rounded-full" style={{ background: "#C9A84C" }} />
            Global Sourcing Platform
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white mb-6 leading-tight">
            Source Smarter,{" "}
            <span style={{ color: "#C9A84C" }}>Scale Faster</span>
          </h1>

          <p className="text-base sm:text-lg text-white/55 max-w-2xl mx-auto mb-10 leading-relaxed">
            RUYA connects clients with expert sourcing agents to find the best suppliers in China
            and deliver anywhere in the world. Submit requests, receive competitive quotations,
            and track orders — all in one place.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/auth/register"
              className="w-full sm:w-auto rounded-xl px-8 py-3.5 text-sm font-bold tracking-wide transition-all shadow-lg"
              style={{ background: "#C9A84C", color: "#0B1F3B", boxShadow: "0 4px 24px rgba(201,168,76,0.3)" }}
            >
              Start Sourcing
            </Link>
            <Link
              href="/auth/login"
              className="w-full sm:w-auto rounded-xl px-8 py-3.5 text-sm font-bold tracking-wide transition-all"
              style={{ border: "1px solid rgba(255,255,255,0.25)", color: "rgba(255,255,255,0.85)" }}
            >
              Sign In
            </Link>
          </div>
        </div>
      </section>

      {/* ── Section 2: How It Works ── */}
      <section className="bg-white py-20 px-6">
        <div className="mx-auto max-w-5xl">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">How RUYA Works</h2>
            <p className="text-gray-500 max-w-xl mx-auto">Three simple steps from idea to delivery.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                step: "01",
                icon: ClipboardList,
                title: "Submit Your Request",
                desc: "Describe your product, quantity, and destination. Our agents get to work immediately.",
              },
              {
                step: "02",
                icon: FileCheck,
                title: "Receive Quotations",
                desc: "Compare competitive quotes from verified Chinese suppliers found by our expert agents.",
              },
              {
                step: "03",
                icon: PackageCheck,
                title: "Track Your Order",
                desc: "Accept your quotation and track every stage from production to delivery.",
              },
            ].map(({ step, icon: Icon, title, desc }) => (
              <div key={step} className="relative rounded-2xl border border-gray-100 bg-gray-50 p-8 text-center hover:shadow-md transition-shadow">
                <div
                  className="inline-flex h-14 w-14 items-center justify-center rounded-2xl mb-5"
                  style={{ background: "rgba(201,168,76,0.12)" }}
                >
                  <Icon className="h-7 w-7" style={{ color: "#C9A84C" }} />
                </div>
                <div
                  className="absolute top-6 right-6 text-xs font-bold tracking-widest"
                  style={{ color: "rgba(201,168,76,0.4)" }}
                >
                  {step}
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Section 3: Why Choose RUYA ── */}
      <section className="bg-gray-50 py-20 px-6">
        <div className="mx-auto max-w-5xl">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">Why Choose RUYA</h2>
            <p className="text-gray-500 max-w-xl mx-auto">Built for businesses that need reliable, transparent global sourcing.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: Users,
                title: "Expert Sourcing Agents",
                desc: "Real people who know China's manufacturing landscape — not algorithms. Your agent speaks the language and knows the market.",
              },
              {
                icon: Eye,
                title: "Full Transparency",
                desc: "Track every step in real time — from quotation to production to shipping. No surprises, no hidden fees.",
              },
              {
                icon: ShieldCheck,
                title: "Secure Platform",
                desc: "Your data and payments are protected at every step. Enterprise-grade security for every business size.",
              },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="rounded-2xl bg-white border border-gray-100 p-8 hover:shadow-md transition-shadow">
                <div
                  className="inline-flex h-12 w-12 items-center justify-center rounded-xl mb-5"
                  style={{ background: "rgba(11,31,59,0.06)" }}
                >
                  <Icon className="h-6 w-6" style={{ color: "#0B1F3B" }} />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer style={{ background: "#071526" }} className="py-10 px-6 border-t border-white/10">
        <div className="mx-auto max-w-5xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm" style={{ color: "rgba(255,255,255,0.3)" }}>
            © {new Date().getFullYear()} RUYA Sourcing Platform. All rights reserved.
          </p>
          <div className="flex items-center gap-6 text-sm" style={{ color: "rgba(255,255,255,0.3)" }}>
            <Link href="/legal/terms" className="hover:text-white/60 transition-colors">
              Terms of Service
            </Link>
            <span style={{ color: "rgba(255,255,255,0.12)" }}>|</span>
            <Link href="/legal/privacy" className="hover:text-white/60 transition-colors">
              Privacy Policy
            </Link>
          </div>
        </div>
      </footer>

    </div>
  );
}
