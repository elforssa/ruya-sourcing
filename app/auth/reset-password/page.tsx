"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, Loader2, CheckCircle2, AlertCircle, KeyRound } from "lucide-react";

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  const inputStyle = {
    background: "rgba(7,21,38,0.8)",
    border: "1px solid rgba(201,168,76,0.2)",
  } as const;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Reset failed.");
      setDone(true);
      setTimeout(() => router.push("/auth/login?reset=true"), 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
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
          {!token ? (
            <div className="text-center py-4">
              <AlertCircle className="h-10 w-10 mx-auto mb-4" style={{ color: "#fca5a5" }} />
              <h2 className="text-lg font-semibold text-white mb-2">Invalid link</h2>
              <p className="text-sm mb-6" style={{ color: "rgba(255,255,255,0.45)" }}>
                This password reset link is invalid or missing. Please request a new one.
              </p>
              <a
                href="/auth/forgot-password"
                className="inline-block rounded-lg px-5 py-2.5 text-sm font-bold tracking-wider uppercase"
                style={{ background: "#C9A84C", color: "#0B1F3B", boxShadow: "0 4px 20px rgba(201,168,76,0.3)" }}
              >
                Request Reset Link
              </a>
            </div>
          ) : done ? (
            <div className="text-center py-4">
              <div
                className="inline-flex items-center justify-center w-14 h-14 rounded-full mb-5"
                style={{ background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.25)" }}
              >
                <CheckCircle2 className="h-7 w-7" style={{ color: "#86efac" }} />
              </div>
              <h2 className="text-xl font-bold text-white mb-2">Password reset!</h2>
              <p className="text-sm" style={{ color: "rgba(255,255,255,0.5)" }}>
                Redirecting you to sign in…
              </p>
            </div>
          ) : (
            <>
              <div className="mb-6">
                <div
                  className="inline-flex items-center justify-center w-10 h-10 rounded-xl mb-4"
                  style={{ background: "rgba(201,168,76,0.1)", border: "1px solid rgba(201,168,76,0.2)" }}
                >
                  <KeyRound className="h-5 w-5" style={{ color: "#C9A84C" }} />
                </div>
                <h2 className="text-lg font-semibold text-white mb-1">Set new password</h2>
                <p className="text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>
                  Choose a strong password for your account.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* New password */}
                <div>
                  <label
                    className="block text-xs font-medium mb-1.5 uppercase tracking-wider"
                    style={{ color: "rgba(201,168,76,0.7)" }}
                  >
                    New password
                  </label>
                  <div className="relative">
                    <input
                      type={showPw ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={8}
                      placeholder="Min. 8 characters"
                      className="w-full rounded-lg px-4 py-3 pr-11 text-sm text-white placeholder:text-slate-600 focus:outline-none transition-all"
                      style={inputStyle}
                      onFocus={(e) => (e.target.style.borderColor = "rgba(201,168,76,0.6)")}
                      onBlur={(e) => (e.target.style.borderColor = "rgba(201,168,76,0.2)")}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPw((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2"
                      style={{ color: "rgba(255,255,255,0.35)" }}
                    >
                      {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {/* Confirm password */}
                <div>
                  <label
                    className="block text-xs font-medium mb-1.5 uppercase tracking-wider"
                    style={{ color: "rgba(201,168,76,0.7)" }}
                  >
                    Confirm password
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirm ? "text" : "password"}
                      value={confirm}
                      onChange={(e) => setConfirm(e.target.value)}
                      required
                      placeholder="Re-enter your password"
                      className="w-full rounded-lg px-4 py-3 pr-11 text-sm text-white placeholder:text-slate-600 focus:outline-none transition-all"
                      style={inputStyle}
                      onFocus={(e) => (e.target.style.borderColor = "rgba(201,168,76,0.6)")}
                      onBlur={(e) => (e.target.style.borderColor = "rgba(201,168,76,0.2)")}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2"
                      style={{ color: "rgba(255,255,255,0.35)" }}
                    >
                      {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {confirm && password !== confirm && (
                    <p className="mt-1.5 text-xs flex items-center gap-1" style={{ color: "#fca5a5" }}>
                      <AlertCircle className="h-3 w-3" /> Passwords do not match
                    </p>
                  )}
                  {confirm && password === confirm && (
                    <p className="mt-1.5 text-xs flex items-center gap-1" style={{ color: "#86efac" }}>
                      <CheckCircle2 className="h-3 w-3" /> Passwords match
                    </p>
                  )}
                </div>

                {/* Error */}
                {error && (
                  <div
                    className="flex items-start gap-2 rounded-lg px-4 py-3 text-sm"
                    style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)", color: "#fca5a5" }}
                  >
                    <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                    {error}
                  </div>
                )}

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
                    <><Loader2 className="h-4 w-4 animate-spin" /> Resetting…</>
                  ) : (
                    "Reset Password"
                  )}
                </button>
              </form>
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

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div />}>
      <ResetPasswordContent />
    </Suspense>
  );
}
