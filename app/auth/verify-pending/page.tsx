"use client";

import { useState, Suspense } from "react";
import { signOut } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Mail, RefreshCw, LogOut, CheckCircle2, Loader2, ArrowLeft } from "lucide-react";
import { AuthLayout } from "@/components/auth-layout";

function VerifyPendingContent() {
  const searchParams = useSearchParams();
  const email = searchParams.get("email");
  const fromRegister = !!email;

  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const resend = async () => {
    setStatus("sending");
    setErrorMsg("");
    try {
      const res = await fetch("/api/auth/send-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: fromRegister ? JSON.stringify({ email }) : "{}",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to send");
      setStatus("sent");
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Something went wrong.");
      setStatus("error");
    }
  };

  return (
    <AuthLayout>
      <div className="text-center">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-accent/10">
          <Mail className="h-7 w-7 text-accent" />
        </div>

        <h1 className="mb-2 text-xl font-bold text-foreground">Check your email</h1>
        <p className="mb-1 text-sm text-muted-foreground">
          We sent a verification link to
        </p>
        {email ? (
          <p className="mb-6 text-sm font-semibold text-accent">{email}</p>
        ) : (
          <p className="mb-6 text-sm text-muted-foreground">your email address.</p>
        )}
        <p className="mb-6 text-xs text-muted-foreground">
          Click the link in the email to activate your RUYA account. Check your spam folder if you don&apos;t see it.
        </p>

        {status === "sent" && (
          <div className="mb-5 flex items-center justify-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            Verification email sent! Check your inbox.
          </div>
        )}

        {status === "error" && (
          <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {errorMsg}
          </div>
        )}

        <button
          onClick={resend}
          disabled={status === "sending" || status === "sent"}
          className="btn-press flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-accent text-sm font-bold text-accent-foreground transition-all hover:bg-accent/90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {status === "sending" ? (
            <><Loader2 className="h-4 w-4 animate-spin" /> Sending...</>
          ) : status === "sent" ? (
            <><CheckCircle2 className="h-4 w-4" /> Email sent</>
          ) : (
            <><RefreshCw className="h-4 w-4" /> Resend verification email</>
          )}
        </button>

        <div className="mt-5">
          {fromRegister ? (
            <Link
              href="/auth/register"
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Wrong email? Go back
            </Link>
          ) : (
            <button
              onClick={() => signOut({ callbackUrl: "/auth/login" })}
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              <LogOut className="h-3.5 w-3.5" />
              Wrong email? Sign out
            </button>
          )}
        </div>
      </div>
    </AuthLayout>
  );
}

export default function VerifyPendingPage() {
  return (
    <Suspense fallback={<div />}>
      <VerifyPendingContent />
    </Suspense>
  );
}
