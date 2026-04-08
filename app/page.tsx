import Link from "next/link";
import Image from "next/image";
import {
  ClipboardList,
  FileCheck,
  PackageCheck,
  Users,
  Eye,
  ShieldCheck,
  ArrowRight,
  Globe,
  TrendingUp,
} from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-navy-900">
      {/* ── Navbar ── */}
      <header className="sticky top-0 z-50 border-b border-white/10 bg-navy-900/80 backdrop-blur-md">
        <div className="container mx-auto flex h-16 items-center justify-between px-6">
          <Image
            src="/logo-v2.png"
            alt="RUYA"
            width={120}
            height={32}
            className="h-8 w-auto"
            priority
          />
          <div className="flex items-center gap-3">
            <Link
              href="/auth/login"
              className="rounded-lg px-5 py-2 text-sm font-medium text-white/70 transition-colors hover:text-white"
            >
              Sign In
            </Link>
            <Link
              href="/auth/register"
              className="btn-press rounded-lg bg-gold-500 px-5 py-2 text-sm font-bold text-navy-900 transition-all hover:bg-gold-400 hover:shadow-lg"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="relative overflow-hidden px-6 py-28 text-center sm:py-36">
        {/* Animated gradient mesh */}
        <div
          className="animate-gradient-shift pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 60% 50% at 20% 20%, rgba(201,168,76,0.06) 0%, transparent 60%), radial-gradient(ellipse 50% 40% at 80% 80%, rgba(43,82,128,0.08) 0%, transparent 60%), radial-gradient(ellipse 80% 50% at 50% 0%, rgba(201,168,76,0.05) 0%, transparent 50%)",
            backgroundSize: "200% 200%",
          }}
        />

        <div className="relative mx-auto max-w-3xl">
          <div className="animate-fade-in-up">
            <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-gold-500/20 bg-gold-500/10 px-4 py-1.5 text-xs font-medium uppercase tracking-widest text-gold-400">
              <span className="h-1.5 w-1.5 rounded-full bg-gold-500" />
              Global Sourcing Platform
            </div>
          </div>

          <h1 className="animate-fade-in-up delay-100 mb-6 text-4xl font-bold leading-tight text-white sm:text-5xl md:text-6xl">
            Source Smarter,{" "}
            <span className="bg-gradient-to-r from-gold-400 to-gold-600 bg-clip-text text-transparent">
              Scale Faster
            </span>
          </h1>

          <p className="animate-fade-in-up delay-200 mx-auto mb-10 max-w-2xl text-base leading-relaxed text-white/50 sm:text-lg">
            RUYA connects clients with expert sourcing agents to find the best
            suppliers in China and deliver anywhere in the world. Submit
            requests, receive competitive quotations, and track orders — all in
            one place.
          </p>

          <div className="animate-fade-in-up delay-300 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/auth/register"
              className="btn-press flex w-full items-center justify-center gap-2 rounded-xl bg-gold-500 px-8 py-3.5 text-sm font-bold text-navy-900 shadow-lg transition-all hover:bg-gold-400 hover:shadow-xl sm:w-auto"
              style={{ boxShadow: "0 4px 24px rgba(201,168,76,0.25)" }}
            >
              Start Sourcing
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/auth/login"
              className="btn-press w-full rounded-xl border border-white/20 px-8 py-3.5 text-sm font-medium text-white/80 transition-all hover:border-white/40 hover:text-white sm:w-auto"
            >
              Sign In
            </Link>
          </div>
        </div>
      </section>

      {/* ── Trust Bar ── */}
      <section className="border-y border-white/5 bg-navy-800/50 px-6 py-10">
        <div className="mx-auto grid max-w-4xl grid-cols-2 gap-8 sm:grid-cols-4">
          {[
            { value: "500+", label: "Orders Sourced" },
            { value: "50+", label: "Verified Agents" },
            { value: "30+", label: "Countries Served" },
            { value: "98%", label: "Client Satisfaction" },
          ].map(({ value, label }) => (
            <div key={label} className="text-center">
              <div className="text-2xl font-bold text-gold-500 sm:text-3xl">
                {value}
              </div>
              <div className="mt-1 text-xs font-medium uppercase tracking-wider text-white/30">
                {label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── How It Works ── */}
      <section className="bg-white px-6 py-20">
        <div className="mx-auto max-w-5xl">
          <div className="mb-14 text-center">
            <h2 className="mb-3 text-3xl font-bold text-navy-800 sm:text-4xl">
              How RUYA Works
            </h2>
            <p className="mx-auto max-w-xl text-muted-foreground">
              Three simple steps from idea to delivery.
            </p>
          </div>

          <div className="relative grid grid-cols-1 gap-8 md:grid-cols-3">
            {/* Connecting line (desktop only) */}
            <div className="pointer-events-none absolute left-0 right-0 top-[4.5rem] hidden h-px bg-gradient-to-r from-transparent via-gold-300/40 to-transparent md:block" />

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
            ].map(({ step, icon: Icon, title, desc }, i) => (
              <div
                key={step}
                className="group relative rounded-2xl border border-gray-100 bg-white p-8 text-center shadow-elevation-1 transition-all hover:-translate-y-1 hover:shadow-elevation-2"
              >
                <div className="relative z-10 mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-gold-50 transition-colors group-hover:bg-gold-100">
                  <Icon className="h-7 w-7 text-gold-600" />
                </div>
                <div className="absolute right-6 top-6 text-xs font-bold tracking-widest text-gold-300">
                  {step}
                </div>
                <h3 className="mb-2 text-lg font-bold text-navy-800">
                  {title}
                </h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Why Choose RUYA — Bento Grid ── */}
      <section className="bg-gray-50 px-6 py-20">
        <div className="mx-auto max-w-5xl">
          <div className="mb-14 text-center">
            <h2 className="mb-3 text-3xl font-bold text-navy-800 sm:text-4xl">
              Why Choose RUYA
            </h2>
            <p className="mx-auto max-w-xl text-muted-foreground">
              Built for businesses that need reliable, transparent global
              sourcing.
            </p>
          </div>

          {/* Bento grid: 2 large + 2 small on desktop */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {/* Large card */}
            <div className="group rounded-2xl border border-gray-100 bg-white p-8 shadow-elevation-1 transition-all hover:-translate-y-1 hover:shadow-elevation-2 lg:col-span-2">
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-navy-50">
                <Users className="h-6 w-6 text-navy-700" />
              </div>
              <h3 className="mb-2 text-lg font-bold text-navy-800">
                Expert Sourcing Agents
              </h3>
              <p className="max-w-lg text-sm leading-relaxed text-muted-foreground">
                Real people who know China&apos;s manufacturing landscape — not
                algorithms. Your agent speaks the language, knows the market, and
                negotiates on your behalf to get you the best possible deal.
              </p>
            </div>

            {/* Small card */}
            <div className="group rounded-2xl border border-gray-100 bg-white p-8 shadow-elevation-1 transition-all hover:-translate-y-1 hover:shadow-elevation-2">
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-navy-50">
                <Eye className="h-6 w-6 text-navy-700" />
              </div>
              <h3 className="mb-2 text-lg font-bold text-navy-800">
                Full Transparency
              </h3>
              <p className="text-sm leading-relaxed text-muted-foreground">
                Track every step in real time — from quotation to production to
                shipping. No surprises, no hidden fees.
              </p>
            </div>

            {/* Small card */}
            <div className="group rounded-2xl border border-gray-100 bg-white p-8 shadow-elevation-1 transition-all hover:-translate-y-1 hover:shadow-elevation-2">
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-navy-50">
                <ShieldCheck className="h-6 w-6 text-navy-700" />
              </div>
              <h3 className="mb-2 text-lg font-bold text-navy-800">
                Secure Platform
              </h3>
              <p className="text-sm leading-relaxed text-muted-foreground">
                Your data and payments are protected at every step.
                Enterprise-grade security for every business size.
              </p>
            </div>

            {/* Large card */}
            <div className="group rounded-2xl border border-gray-100 bg-white p-8 shadow-elevation-1 transition-all hover:-translate-y-1 hover:shadow-elevation-2 lg:col-span-2">
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-navy-50">
                <Globe className="h-6 w-6 text-navy-700" />
              </div>
              <h3 className="mb-2 text-lg font-bold text-navy-800">
                Global Reach, Local Expertise
              </h3>
              <p className="max-w-lg text-sm leading-relaxed text-muted-foreground">
                From factory floors in Shenzhen to doorsteps worldwide. We handle
                the complexity of international sourcing so you can focus on
                growing your business across 30+ countries.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA Section ── */}
      <section className="bg-navy-900 px-6 py-20">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="mb-4 text-3xl font-bold text-white sm:text-4xl">
            Ready to Source Smarter?
          </h2>
          <p className="mb-8 text-white/50">
            Join hundreds of businesses already using RUYA to streamline their
            global sourcing.
          </p>
          <Link
            href="/auth/register"
            className="btn-press inline-flex items-center gap-2 rounded-xl bg-gold-500 px-8 py-3.5 text-sm font-bold text-navy-900 shadow-lg transition-all hover:bg-gold-400 hover:shadow-xl"
          >
            Get Started Free
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-white/5 bg-navy-900 px-6 py-12">
        <div className="mx-auto max-w-5xl">
          <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
            <div className="flex items-center gap-3">
              <Image
                src="/logo-v2.png"
                alt="RUYA"
                width={96}
                height={24}
                className="h-6 w-auto opacity-50"
              />
            </div>
            <div className="flex items-center gap-6 text-sm text-white/30">
              <Link
                href="/legal/terms"
                className="transition-colors hover:text-white/60"
              >
                Terms of Service
              </Link>
              <span className="text-white/10">|</span>
              <Link
                href="/legal/privacy"
                className="transition-colors hover:text-white/60"
              >
                Privacy Policy
              </Link>
            </div>
          </div>
          <div className="mt-8 border-t border-white/5 pt-6 text-center text-xs text-white/20">
            &copy; {new Date().getFullYear()} RUYA Sourcing Platform. All rights
            reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
