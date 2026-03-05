"use client";

import { useState, Suspense } from "react";
import { signIn, getSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2, AlertCircle } from "lucide-react";

const DEMO_ACCOUNTS = [
  { label: "Client", email: "client@ruya.com", role: "CLIENT" },
  { label: "Agent", email: "agent@ruya.com", role: "AGENT" },
  { label: "Admin", email: "admin@ruya.com", role: "ADMIN" },
];

function redirectByRole(role: string | undefined, router: ReturnType<typeof useRouter>) {
  if (role === "ADMIN") router.push("/admin/dashboard");
  else if (role === "AGENT") router.push("/agent/dashboard");
  else router.push("/client/dashboard");
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const verified = searchParams.get("verified") === "true";
  const tokenError = searchParams.get("error");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const TOKEN_ERROR_MESSAGES: Record<string, string> = {
    "missing-token": "Verification link is missing. Please request a new one.",
    "invalid-token": "Verification link is invalid. Please request a new one.",
    "expired-token": "Verification link has expired. Please request a new one.",
  };

  const attemptSignIn = async (loginEmail: string, loginPassword: string) => {
    setLoading(true);
    setError("");

    const result = await signIn("credentials", {
      email: loginEmail,
      password: loginPassword,
      redirect: false,
    });

    if (!result?.ok) {
      setError("Invalid email or password. Please try again.");
      setLoading(false);
      return;
    }

    const session = await getSession();
    redirectByRole(session?.user?.role, router);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    attemptSignIn(email, password);
  };

  const handleDemo = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword("password123");
    attemptSignIn(demoEmail, "password123");
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ background: "linear-gradient(135deg, #071526 0%, #0B1F3B 50%, #0F2744 100%)" }}
    >
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-5"
            style={{ background: "rgba(201,168,76,0.12)", border: "1px solid rgba(201,168,76,0.3)" }}>
            <span className="text-2xl font-bold" style={{ color: "#C9A84C" }}>R</span>
          </div>
          <h1
            className="text-5xl font-bold tracking-[0.3em]"
            style={{ color: "#C9A84C", textShadow: "0 0 40px rgba(201,168,76,0.3)" }}
          >
            RUYA
          </h1>
          <p className="mt-2 text-xs tracking-[0.25em] uppercase"
            style={{ color: "rgba(201,168,76,0.6)" }}>
            Global Sourcing Platform
          </p>
        </div>

        {/* Card */}
        <div
          className="rounded-2xl p-8 shadow-2xl"
          style={{
            background: "rgba(15,39,68,0.8)",
            border: "1px solid rgba(201,168,76,0.15)",
            backdropFilter: "blur(10px)",
          }}
        >
          <h2 className="text-lg font-semibold text-white mb-1">Welcome back</h2>
          <p className="text-sm mb-5" style={{ color: "rgba(255,255,255,0.4)" }}>
            Sign in to access your sourcing dashboard
          </p>

          {/* Email verified success banner */}
          {verified && (
            <div
              className="flex items-center gap-2 rounded-lg px-4 py-3 mb-5 text-sm"
              style={{ background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.25)", color: "#86efac" }}
            >
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              Email verified! You can now sign in.
            </div>
          )}

          {/* Token error banner */}
          {tokenError && TOKEN_ERROR_MESSAGES[tokenError] && (
            <div
              className="flex items-center gap-2 rounded-lg px-4 py-3 mb-5 text-sm"
              style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)", color: "#fca5a5" }}
            >
              <AlertCircle className="h-4 w-4 shrink-0" />
              {TOKEN_ERROR_MESSAGES[tokenError]}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label
                className="block text-xs font-medium mb-1.5 uppercase tracking-wider"
                style={{ color: "rgba(201,168,76,0.7)" }}
              >
                Email address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="you@example.com"
                className="w-full rounded-lg px-4 py-3 text-sm text-white placeholder:text-slate-600 focus:outline-none transition-all"
                style={{
                  background: "rgba(7,21,38,0.8)",
                  border: "1px solid rgba(201,168,76,0.2)",
                }}
                onFocus={(e) => (e.target.style.borderColor = "rgba(201,168,76,0.6)")}
                onBlur={(e) => (e.target.style.borderColor = "rgba(201,168,76,0.2)")}
              />
            </div>

            {/* Password */}
            <div>
              <label
                className="block text-xs font-medium mb-1.5 uppercase tracking-wider"
                style={{ color: "rgba(201,168,76,0.7)" }}
              >
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="w-full rounded-lg px-4 py-3 text-sm text-white placeholder:text-slate-600 focus:outline-none transition-all"
                style={{
                  background: "rgba(7,21,38,0.8)",
                  border: "1px solid rgba(201,168,76,0.2)",
                }}
                onFocus={(e) => (e.target.style.borderColor = "rgba(201,168,76,0.6)")}
                onBlur={(e) => (e.target.style.borderColor = "rgba(201,168,76,0.2)")}
              />
            </div>

            {/* Error */}
            {error && (
              <div
                className="rounded-lg px-4 py-3 text-sm"
                style={{
                  background: "rgba(239,68,68,0.1)",
                  border: "1px solid rgba(239,68,68,0.25)",
                  color: "#fca5a5",
                }}
              >
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg py-3 text-sm font-bold tracking-wider uppercase transition-all mt-2"
              style={{
                background: loading ? "rgba(201,168,76,0.4)" : "#C9A84C",
                color: loading ? "rgba(11,31,59,0.6)" : "#0B1F3B",
                cursor: loading ? "not-allowed" : "pointer",
                boxShadow: loading ? "none" : "0 4px 20px rgba(201,168,76,0.3)",
              }}
            >
              {loading ? "Signing in…" : "Sign In"}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-7">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full" style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }} />
            </div>
            <div className="relative flex justify-center">
              <span
                className="px-3 text-xs uppercase tracking-widest"
                style={{ background: "rgba(15,39,68,0.8)", color: "rgba(255,255,255,0.25)" }}
              >
                Demo accounts
              </span>
            </div>
          </div>

          {/* Demo Buttons */}
          <div className="grid grid-cols-3 gap-2">
            {DEMO_ACCOUNTS.map(({ label, email: demoEmail }) => (
              <button
                key={label}
                onClick={() => handleDemo(demoEmail)}
                disabled={loading}
                className="rounded-lg py-2.5 text-xs font-semibold tracking-wider uppercase transition-all"
                style={{
                  background: "rgba(201,168,76,0.06)",
                  border: "1px solid rgba(201,168,76,0.25)",
                  color: "#C9A84C",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget.style.background = "rgba(201,168,76,0.14)");
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget.style.background = "rgba(201,168,76,0.06)");
                }}
              >
                {label}
              </button>
            ))}
          </div>

          <p className="text-center mt-4 text-xs" style={{ color: "rgba(255,255,255,0.2)" }}>
            All demo accounts use password: <span style={{ color: "rgba(201,168,76,0.5)" }}>password123</span>
          </p>
        </div>

        {/* Footer */}
        <p className="text-center mt-6 text-xs" style={{ color: "rgba(255,255,255,0.15)" }}>
          © {new Date().getFullYear()} RUYA. All rights reserved.
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div />}>
      <LoginForm />
    </Suspense>
  );
}
