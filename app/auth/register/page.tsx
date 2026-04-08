"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { AuthLayout } from "@/components/auth-layout";

function getStrength(password: string): { level: 0 | 1 | 2 | 3; label: string; color: string } {
  if (!password) return { level: 0, label: "", color: "" };
  const hasUpper = /[A-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);
  const long = password.length >= 8;
  const types = [hasUpper, hasNumber, hasSpecial].filter(Boolean).length;
  if (!long) return { level: 1, label: "Weak", color: "bg-red-500" };
  if (types < 2) return { level: 1, label: "Weak", color: "bg-red-500" };
  if (types === 2) return { level: 2, label: "Medium", color: "bg-amber-500" };
  return { level: 3, label: "Strong", color: "bg-emerald-500" };
}

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [terms, setTerms] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
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

  const inputBase = "h-12 w-full rounded-lg border bg-background px-4 text-sm text-foreground placeholder:text-muted-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-accent/20";

  return (
    <AuthLayout>
      <div>
        <h1 className="mb-1 text-2xl font-bold text-foreground">Create your account</h1>
        <p className="mb-8 text-sm text-muted-foreground">
          Join RUYA to start sourcing products globally
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Full name */}
          <div>
            <label htmlFor="name" className="mb-1.5 block text-sm font-medium text-foreground">
              Full name
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="Jane Smith"
              className={`${inputBase} border-input focus:border-accent`}
            />
          </div>

          {/* Email */}
          <div>
            <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-foreground">
              Email address
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); if (emailTouched) validateEmailClient(e.target.value); }}
              required
              placeholder="you@example.com"
              className={`${inputBase} ${emailTouched && emailError ? "border-destructive focus:border-destructive focus:ring-destructive/20" : "border-input focus:border-accent"}`}
              onBlur={(e) => { setEmailTouched(true); validateEmailClient(e.target.value); }}
            />
            {emailTouched && emailError && (
              <p className="mt-1.5 flex items-center gap-1 text-xs text-destructive">
                <AlertCircle className="h-3 w-3" /> {emailError}
              </p>
            )}
          </div>

          {/* Password */}
          <div>
            <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-foreground">
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPw ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                placeholder="Min. 8 characters"
                className={`${inputBase} border-input pr-11 focus:border-accent`}
              />
              <button
                type="button"
                onClick={() => setShowPw((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                aria-label={showPw ? "Hide password" : "Show password"}
              >
                {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>

            {/* Strength bar */}
            {password && (
              <div className="mt-2 space-y-1">
                <div className="flex gap-1">
                  {[1, 2, 3].map((lvl) => (
                    <div
                      key={lvl}
                      className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                        strength.level >= lvl ? strength.color : "bg-muted"
                      }`}
                    />
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  <span className={strength.level >= 3 ? "text-emerald-600" : strength.level >= 2 ? "text-amber-600" : "text-red-600"}>
                    {strength.label}
                  </span>
                  {strength.level < 3 && (
                    <span> — add {strength.level === 1 ? "uppercase, numbers & symbols" : "symbols"}</span>
                  )}
                </p>
              </div>
            )}
          </div>

          {/* Confirm password */}
          <div>
            <label htmlFor="confirm" className="mb-1.5 block text-sm font-medium text-foreground">
              Confirm password
            </label>
            <div className="relative">
              <input
                id="confirm"
                type={showConfirm ? "text" : "password"}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
                placeholder="Re-enter your password"
                className={`${inputBase} border-input pr-11 focus:border-accent`}
              />
              <button
                type="button"
                onClick={() => setShowConfirm((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                aria-label={showConfirm ? "Hide password" : "Show password"}
              >
                {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {confirm && password !== confirm && (
              <p className="mt-1.5 flex items-center gap-1 text-xs text-destructive">
                <AlertCircle className="h-3 w-3" /> Passwords do not match
              </p>
            )}
            {confirm && password === confirm && confirm.length > 0 && (
              <p className="mt-1.5 flex items-center gap-1 text-xs text-emerald-600">
                <CheckCircle2 className="h-3 w-3" /> Passwords match
              </p>
            )}
          </div>

          {/* Terms */}
          <label className="group flex cursor-pointer items-start gap-3">
            <div className="relative mt-0.5 shrink-0">
              <input
                type="checkbox"
                checked={terms}
                onChange={(e) => setTerms(e.target.checked)}
                className="sr-only"
              />
              <div className={`flex h-4 w-4 items-center justify-center rounded border transition-all ${
                terms ? "border-accent bg-accent" : "border-input bg-background"
              }`}>
                {terms && (
                  <svg className="h-2.5 w-2.5" viewBox="0 0 10 10" fill="none">
                    <path d="M1.5 5l2.5 2.5 4.5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="text-accent-foreground" />
                  </svg>
                )}
              </div>
            </div>
            <span className="text-xs leading-relaxed text-muted-foreground">
              I agree to the{" "}
              <Link href="/legal/terms" className="font-semibold text-accent hover:underline">
                terms of service
              </Link>{" "}
              and acknowledge that RUYA may contact me about my account.
            </span>
          </label>

          {/* Error */}
          {error && (
            <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              {error}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading || !!(emailTouched && emailError)}
            className="btn-press flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-accent text-sm font-bold text-accent-foreground transition-all hover:bg-accent/90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Creating account...</>
            ) : (
              "Create Account"
            )}
          </button>
        </form>

        <div className="mt-8 border-t border-border pt-6 text-center">
          <p className="text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link href="/auth/login" className="font-semibold text-accent transition-colors hover:text-accent/80">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </AuthLayout>
  );
}
