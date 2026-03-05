"use client";

import { useState } from "react";
import { CheckCircle2, Loader2, ArrowLeft, Mail } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
    } finally {
      setLoading(false);
      setSubmitted(true);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ background: "linear-gradient(135deg, #071526 0%, #0B1F3B 50%, #0F2744 100%)" }}
    >
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="text-center mb-10">
          <div
            className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-5"
            style={{ background: "rgba(201,168,76,0.12)", border: "1px solid rgba(201,168,76,0.3)" }}
          >
            <span className="text-2xl font-bold" style={{ color: "#C9A84C" }}>R</span>
          </div>
          <h1
            className="text-5xl font-bold tracking-[0.3em]"
            style={{ color: "#C9A84C", textShadow: "0 0 40px rgba(201,168,76,0.3)" }}
          >
            RUYA
          </h1>
          <p className="mt-2 text-xs tracking-[0.25em] uppercase" style={{ color: "rgba(201,168,76,0.6)" }}>
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
          {submitted ? (
            <div className="text-center py-4">
              <div
                className="inline-flex items-center justify-center w-14 h-14 rounded-full mb-5"
                style={{ background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.25)" }}
              >
                <CheckCircle2 className="h-7 w-7" style={{ color: "#86efac" }} />
              </div>
              <h2 className="text-xl font-bold text-white mb-3">Check your email</h2>
              <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.5)" }}>
                If this email exists in our system, you&apos;ll receive a password reset link shortly. Check your spam folder if you don&apos;t see it.
              </p>
              <div className="mt-8 pt-6 border-t" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
                <a
                  href="/auth/login"
                  className="inline-flex items-center gap-1.5 text-sm font-semibold"
                  style={{ color: "#C9A84C" }}
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  Back to sign in
                </a>
              </div>
            </div>
          ) : (
            <>
              <div className="mb-6">
                <div
                  className="inline-flex items-center justify-center w-10 h-10 rounded-xl mb-4"
                  style={{ background: "rgba(201,168,76,0.1)", border: "1px solid rgba(201,168,76,0.2)" }}
                >
                  <Mail className="h-5 w-5" style={{ color: "#C9A84C" }} />
                </div>
                <h2 className="text-lg font-semibold text-white mb-1">Forgot your password?</h2>
                <p className="text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>
                  Enter your email and we&apos;ll send you a reset link.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
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

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-lg py-3 text-sm font-bold tracking-wider uppercase transition-all mt-1 flex items-center justify-center gap-2"
                  style={{
                    background: loading ? "rgba(201,168,76,0.4)" : "#C9A84C",
                    color: loading ? "rgba(11,31,59,0.6)" : "#0B1F3B",
                    cursor: loading ? "not-allowed" : "pointer",
                    boxShadow: loading ? "none" : "0 4px 20px rgba(201,168,76,0.3)",
                  }}
                >
                  {loading ? (
                    <><Loader2 className="h-4 w-4 animate-spin" /> Sending…</>
                  ) : (
                    "Send Reset Link"
                  )}
                </button>
              </form>

              <div className="mt-6 pt-5 border-t text-center" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
                <a
                  href="/auth/login"
                  className="inline-flex items-center gap-1.5 text-sm"
                  style={{ color: "rgba(255,255,255,0.35)" }}
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  Back to sign in
                </a>
              </div>
            </>
          )}
        </div>

        <p className="text-center mt-6 text-xs" style={{ color: "rgba(255,255,255,0.15)" }}>
          © {new Date().getFullYear()} RUYA. All rights reserved.
        </p>
      </div>
    </div>
  );
}
