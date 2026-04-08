"use client";

import { useState, Suspense } from "react";
import { signIn, getSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { AuthLayout } from "@/components/auth-layout";

function redirectByRole(role: string | undefined, router: ReturnType<typeof useRouter>) {
  if (role === "ADMIN") router.push("/admin/dashboard");
  else if (role === "AGENT") router.push("/agent/dashboard");
  else router.push("/client/dashboard");
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const verified   = searchParams.get("verified") === "true";
  const tokenError  = searchParams.get("error");
  const isSuspended = tokenError === "suspended";
  const reset       = searchParams.get("reset") === "true";
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
      if (result?.error === "ACCOUNT_SUSPENDED") {
        setError("Your account has been suspended. Contact support@ruya-sourcing.com");
      } else if (result?.error === "TOO_MANY_ATTEMPTS") {
        setError("Too many login attempts. Please wait 15 minutes before trying again.");
      } else {
        setError("Invalid email or password. Please try again.");
      }
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

  return (
    <AuthLayout>
      <div>
        <h1 className="mb-1 text-2xl font-bold text-foreground">Welcome back</h1>
        <p className="mb-8 text-sm text-muted-foreground">
          Sign in to access your sourcing dashboard
        </p>

        {/* Success banners */}
        {reset && (
          <div className="mb-5 flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            Password reset successfully. Please sign in.
          </div>
        )}

        {verified && (
          <div className="mb-5 flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            Email verified! You can now sign in.
          </div>
        )}

        {isSuspended && (
          <div className="mb-5 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>
              Your account has been suspended.{" "}
              <a href="mailto:support@ruya-sourcing.com" className="font-medium underline">
                Contact support
              </a>
            </span>
          </div>
        )}

        {!isSuspended && tokenError && TOKEN_ERROR_MESSAGES[tokenError] && (
          <div className="mb-5 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {TOKEN_ERROR_MESSAGES[tokenError]}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-foreground">
              Email address
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="you@example.com"
              className="h-12 w-full rounded-lg border border-input bg-background px-4 text-sm text-foreground placeholder:text-muted-foreground transition-colors focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            />
          </div>

          <div>
            <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-foreground">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="Enter your password"
              className="h-12 w-full rounded-lg border border-input bg-background px-4 text-sm text-foreground placeholder:text-muted-foreground transition-colors focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            />
            <div className="mt-1.5 flex justify-end">
              <Link
                href="/auth/forgot-password"
                className="text-xs font-medium text-accent transition-colors hover:text-accent/80"
              >
                Forgot your password?
              </Link>
            </div>
          </div>

          {error && (
            <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn-press flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-accent text-sm font-bold text-accent-foreground transition-all hover:bg-accent/90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Signing in...</>
            ) : (
              "Sign In"
            )}
          </button>
        </form>

        <div className="mt-8 border-t border-border pt-6 text-center">
          <p className="text-sm text-muted-foreground">
            Don&apos;t have an account?{" "}
            <Link href="/auth/register" className="font-semibold text-accent transition-colors hover:text-accent/80">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </AuthLayout>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div />}>
      <LoginForm />
    </Suspense>
  );
}
