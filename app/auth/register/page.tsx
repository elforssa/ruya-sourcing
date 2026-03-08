"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Loader2, CheckCircle2, AlertCircle } from "lucide-react";

function getStrength(password: string): { level: 0 | 1 | 2 | 3; label: string; color: string } {
  if (!password) return { level: 0, label: "", color: "" };
  const hasUpper = /[A-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);
  const long = password.length >= 8;
  const types = [hasUpper, hasNumber, hasSpecial].filter(Boolean).length;
  if (!long) return { level: 1, label: "Weak", color: "#ef4444" };
  if (types < 2) return { level: 1, label: "Weak", color: "#ef4444" };
  if (types === 2) return { level: 2, label: "Medium", color: "#f59e0b" };
  return { level: 3, label: "Strong", color: "#22c55e" };
}

const inputStyle = {
  background: "rgba(7,21,38,0.8)",
  border: "1px solid rgba(201,168,76,0.2)",
} as const;

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [terms, setTerms] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState("");
  const [emailError, setEmailError] = useState("");
  const [emailTouched, setEmailTouched] = useState(false);

  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const validateEmailClient = (val: string) => {
    if (!val.trim()) { setEmailError(""); return; }
    setEmailError(EMAIL_RE.test(val) ? "" : "Please enter a valid email address.");
  };

  const strength = getStrength(password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!name.trim()) { setError("Full name is required."); return; }
    if (emailError || !EMAIL_RE.test(email)) {
      setEmailError("Please enter a valid email address.");
      setEmailTouched(true);
      return;
    }
    if (password.length < 8) { setError("Password must be at least 8 characters."); return; }
    if (password !== confirm) { setError("Passwords do not match."); return; }
    if (!terms) { setError("Please accept the terms of service to continue."); return; }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Registration failed.");
      router.push(`/auth/verify-pending?email=${encodeURIComponent(email)}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const focusBorder = (e: React.FocusEvent<HTMLInputElement>) =>
    (e.target.style.borderColor = "rgba(201,168,76,0.6)");
  const blurBorder = (e: React.FocusEvent<HTMLInputElement>) =>
    (e.target.style.borderColor = "rgba(201,168,76,0.2)");

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 py-10"
      style={{ background: "linear-gradient(135deg, #071526 0%, #0B1F3B 50%, #0F2744 100%)" }}
    >
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="text-center mb-8">
          <div
            className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-4"
            style={{ background: "rgba(201,168,76,0.12)", border: "1px solid rgba(201,168,76,0.3)" }}
          >
            <span className="text-xl font-bold" style={{ color: "#C9A84C" }}>R</span>
          </div>
          <h1
            className="text-4xl font-bold tracking-[0.3em]"
            style={{ color: "#C9A84C", textShadow: "0 0 40px rgba(201,168,76,0.3)" }}
          >
            RUYA
          </h1>
          <p className="mt-1.5 text-xs tracking-[0.25em] uppercase" style={{ color: "rgba(201,168,76,0.6)" }}>
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
          <h2 className="text-lg font-semibold text-white mb-1">Create your account</h2>
          <p className="text-sm mb-6" style={{ color: "rgba(255,255,255,0.4)" }}>
            Join RUYA to start sourcing products globally
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Full name */}
            <div>
              <label className="block text-xs font-medium mb-1.5 uppercase tracking-wider" style={{ color: "rgba(201,168,76,0.7)" }}>
                Full name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="Jane Smith"
                className="w-full rounded-lg px-4 py-3 text-sm text-white placeholder:text-slate-600 focus:outline-none transition-all"
                style={inputStyle}
                onFocus={focusBorder}
                onBlur={blurBorder}
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-medium mb-1.5 uppercase tracking-wider" style={{ color: "rgba(201,168,76,0.7)" }}>
                Email address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); if (emailTouched) validateEmailClient(e.target.value); }}
                required
                placeholder="you@example.com"
                className="w-full rounded-lg px-4 py-3 text-sm text-white placeholder:text-slate-600 focus:outline-none transition-all"
                style={emailTouched && emailError
                  ? { ...inputStyle, borderColor: "rgba(239,68,68,0.6)" }
                  : inputStyle
                }
                onFocus={focusBorder}
                onBlur={(e) => { blurBorder(e); setEmailTouched(true); validateEmailClient(e.target.value); }}
              />
              {emailTouched && emailError && (
                <p className="mt-1.5 text-xs flex items-center gap-1" style={{ color: "#fca5a5" }}>
                  <AlertCircle className="h-3 w-3" /> {emailError}
                </p>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-medium mb-1.5 uppercase tracking-wider" style={{ color: "rgba(201,168,76,0.7)" }}>
                Password
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
                  onFocus={focusBorder}
                  onBlur={blurBorder}
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

              {/* Strength indicator */}
              {password && (
                <div className="mt-2 space-y-1.5">
                  <div className="flex gap-1">
                    {[1, 2, 3].map((lvl) => (
                      <div
                        key={lvl}
                        className="h-1 flex-1 rounded-full transition-all duration-300"
                        style={{
                          background: strength.level >= lvl ? strength.color : "rgba(255,255,255,0.1)",
                        }}
                      />
                    ))}
                  </div>
                  <p className="text-xs" style={{ color: strength.color }}>
                    {strength.label} password
                    {strength.level < 3 && (
                      <span style={{ color: "rgba(255,255,255,0.3)" }}>
                        {" "}— add {strength.level === 1 ? "uppercase letters, numbers & symbols" : "symbols"} to strengthen
                      </span>
                    )}
                  </p>
                </div>
              )}
            </div>

            {/* Confirm password */}
            <div>
              <label className="block text-xs font-medium mb-1.5 uppercase tracking-wider" style={{ color: "rgba(201,168,76,0.7)" }}>
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
                  onFocus={focusBorder}
                  onBlur={blurBorder}
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
              {confirm && password === confirm && confirm.length > 0 && (
                <p className="mt-1.5 text-xs flex items-center gap-1" style={{ color: "#86efac" }}>
                  <CheckCircle2 className="h-3 w-3" /> Passwords match
                </p>
              )}
            </div>

            {/* Terms */}
            <label className="flex items-start gap-3 cursor-pointer group">
              <div className="relative mt-0.5 shrink-0">
                <input
                  type="checkbox"
                  checked={terms}
                  onChange={(e) => setTerms(e.target.checked)}
                  className="sr-only"
                />
                <div
                  className="h-4 w-4 rounded flex items-center justify-center transition-all"
                  style={{
                    background: terms ? "#C9A84C" : "rgba(7,21,38,0.8)",
                    border: `1px solid ${terms ? "#C9A84C" : "rgba(201,168,76,0.3)"}`,
                  }}
                >
                  {terms && (
                    <svg className="h-2.5 w-2.5" viewBox="0 0 10 10" fill="none">
                      <path d="M1.5 5l2.5 2.5 4.5-5" stroke="#0B1F3B" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </div>
              </div>
              <span className="text-xs leading-relaxed" style={{ color: "rgba(255,255,255,0.45)" }}>
                I agree to the{" "}
                <span className="font-semibold" style={{ color: "rgba(201,168,76,0.8)" }}>
                  terms of service
                </span>{" "}
                and acknowledge that RUYA may contact me about my account.
              </span>
            </label>

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

            {/* Submit */}
            <button
              type="submit"
              disabled={loading || !!(emailTouched && emailError)}
              className="w-full rounded-lg py-3 text-sm font-bold tracking-wider uppercase transition-all mt-1 flex items-center justify-center gap-2"
              style={{
                background: (loading || !!(emailTouched && emailError)) ? "rgba(201,168,76,0.4)" : "#C9A84C",
                color: (loading || !!(emailTouched && emailError)) ? "rgba(11,31,59,0.6)" : "#0B1F3B",
                cursor: (loading || !!(emailTouched && emailError)) ? "not-allowed" : "pointer",
                boxShadow: (loading || !!(emailTouched && emailError)) ? "none" : "0 4px 20px rgba(201,168,76,0.3)",
              }}
            >
              {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Creating account…</> : "Create Account"}
            </button>
          </form>

          {/* Sign in link */}
          <div className="mt-6 pt-5 border-t text-center" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
            <p className="text-sm" style={{ color: "rgba(255,255,255,0.35)" }}>
              Already have an account?{" "}
              <a
                href="/auth/login"
                className="font-semibold"
                style={{ color: "#C9A84C" }}
              >
                Sign in
              </a>
            </p>
          </div>
        </div>

        <p className="text-center mt-6 text-xs" style={{ color: "rgba(255,255,255,0.15)" }}>
          © {new Date().getFullYear()} RUYA. All rights reserved.
        </p>
      </div>
    </div>
  );
}
