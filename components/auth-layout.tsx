import Image from "next/image";
import Link from "next/link";

export function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      {/* Left brand panel — hidden on mobile */}
      <div className="relative hidden w-[45%] flex-col justify-between overflow-hidden bg-navy-900 p-10 lg:flex">
        {/* Subtle grid pattern */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(201,168,76,1) 1px, transparent 1px), linear-gradient(90deg, rgba(201,168,76,1) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />
        {/* Radial glow */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 70% 50% at 30% 50%, rgba(201,168,76,0.06) 0%, transparent 70%)",
          }}
        />

        <div className="relative z-10">
          <Link href="/">
            <Image
              src="/logo-v2.png"
              alt="RUYA"
              width={120}
              height={32}
              className="h-8 w-auto"
              priority
            />
          </Link>
        </div>

        <div className="relative z-10 max-w-sm">
          <h2 className="mb-3 text-2xl font-bold text-white">
            Source smarter,{" "}
            <span className="text-gold-500">scale faster</span>
          </h2>
          <p className="text-sm leading-relaxed text-white/40">
            Connect with expert sourcing agents, get competitive quotations from
            verified suppliers, and track your orders from production to
            delivery.
          </p>
        </div>

        <div className="relative z-10 text-xs text-white/20">
          &copy; {new Date().getFullYear()} RUYA Sourcing Platform
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex flex-1 flex-col">
        {/* Mobile logo */}
        <div className="flex items-center justify-between p-6 lg:hidden">
          <Link href="/">
            <Image
              src="/logo-v2.png"
              alt="RUYA"
              width={96}
              height={24}
              className="h-6 w-auto"
            />
          </Link>
        </div>

        <div className="flex flex-1 items-center justify-center px-6 py-8">
          <div className="w-full max-w-[420px]">{children}</div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-center gap-4 p-6 text-xs text-muted-foreground">
          <Link
            href="/legal/terms"
            className="transition-colors hover:text-foreground"
          >
            Terms of Service
          </Link>
          <span className="text-border">|</span>
          <Link
            href="/legal/privacy"
            className="transition-colors hover:text-foreground"
          >
            Privacy Policy
          </Link>
        </div>
      </div>
    </div>
  );
}
