import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, Globe, Package, TrendingUp, Shield } from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900">
      <header className="border-b border-white/10 backdrop-blur-sm">
        <div className="container mx-auto flex h-16 items-center justify-between px-6">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-blue-500 flex items-center justify-center">
              <Globe className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold text-white tracking-tight">RUYA</span>
          </div>
          <nav className="flex items-center gap-4">
            <Link href="/login">
              <Button variant="ghost" className="text-white/80 hover:text-white hover:bg-white/10">
                Sign In
              </Button>
            </Link>
            <Link href="/login">
              <Button className="bg-blue-500 hover:bg-blue-600 text-white">
                Get Started
              </Button>
            </Link>
          </nav>
        </div>
      </header>

      <main>
        <section className="container mx-auto px-6 py-24 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-4 py-1.5 text-sm text-blue-300 mb-8">
            <span className="h-1.5 w-1.5 rounded-full bg-blue-400" />
            Global Sourcing Platform
          </div>
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
            Source Smarter,<br />
            <span className="text-blue-400">Scale Faster</span>
          </h1>
          <p className="text-lg md:text-xl text-white/60 max-w-2xl mx-auto mb-10">
            RUYA connects clients with expert sourcing agents to find the best suppliers worldwide.
            Submit requests, receive competitive quotations, and track orders — all in one place.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link href="/login">
              <Button size="lg" className="bg-blue-500 hover:bg-blue-600 text-white h-12 px-8">
                Start Sourcing <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </section>

        <section className="container mx-auto px-6 pb-24">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                icon: Package,
                title: "Submit Requests",
                desc: "Describe your product needs, quantities, and budget. Our agents get to work immediately.",
              },
              {
                icon: TrendingUp,
                title: "Compare Quotations",
                desc: "Receive detailed quotations from verified suppliers with transparent pricing.",
              },
              {
                icon: Shield,
                title: "Track Orders",
                desc: "Follow your order from production to delivery with real-time status updates.",
              },
            ].map(({ icon: Icon, title, desc }) => (
              <div
                key={title}
                className="rounded-2xl border border-white/10 bg-white/5 p-8 backdrop-blur-sm hover:bg-white/10 transition-colors"
              >
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/20">
                  <Icon className="h-6 w-6 text-blue-400" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
                <p className="text-white/60 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="border-t border-white/10 bg-white/5">
          <div className="container mx-auto px-6 py-16 text-center">
            <h2 className="text-2xl font-bold text-white mb-3">Demo Accounts</h2>
            <p className="text-white/50 mb-8 text-sm">Use these credentials to explore the platform</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl mx-auto">
              {[
                { role: "Admin", email: "admin@ruya.com", color: "red" },
                { role: "Agent", email: "agent@ruya.com", color: "purple" },
                { role: "Client", email: "client@ruya.com", color: "green" },
              ].map(({ role, email, color }) => (
                <div key={role} className="rounded-xl border border-white/10 bg-white/5 p-5 text-left">
                  <div className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium mb-3 ${
                    color === "red" ? "bg-red-500/20 text-red-300" :
                    color === "purple" ? "bg-purple-500/20 text-purple-300" :
                    "bg-green-500/20 text-green-300"
                  }`}>
                    {role}
                  </div>
                  <p className="text-white text-sm font-medium">{email}</p>
                  <p className="text-white/40 text-xs mt-1">password123</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-white/10 py-8">
        <div className="container mx-auto px-6 text-center text-white/30 text-sm">
          © {new Date().getFullYear()} RUYA Sourcing Platform
        </div>
      </footer>
    </div>
  );
}
