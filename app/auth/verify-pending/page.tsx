"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";
import { Mail, RefreshCw, LogOut, CheckCircle2, Loader2 } from "lucide-react";

export default function VerifyPendingPage() {
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const resend = async () => {
    setStatus("sending");
    setErrorMsg("");
    try {
      const res = await fetch("/api/auth/send-verification", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to send");
      setStatus("sent");
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Something went wrong.");
      setStatus("error");
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
        </div>

        {/* Card */}
        <div
          className="rounded-2xl p-8 shadow-2xl text-center"
          style={{
            background: "rgba(15,39,68,0.8)",
            border: "1px solid rgba(201,168,76,0.15)",
            backdropFilter: "blur(10px)",
          }}
        >
          {/* Icon */}
          <div
            className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-5"
            style={{ background: "rgba(201,168,76,0.1)", border: "1px solid rgba(201,168,76,0.25)" }}
          >
            <Mail className="w-7 h-7" style={{ color: "#C9A84C" }} />
          </div>

          <h2 className="text-xl font-bold text-white mb-2">Check your email</h2>
          <p className="text-sm mb-6" style={{ color: "rgba(255,255,255,0.5)" }}>
            We sent a verification link to your email address. Click the link to activate your RUYA account.
          </p>

          {/* Success state */}
          {status === "sent" && (
            <div
              className="flex items-center gap-2 justify-center rounded-lg px-4 py-3 mb-5 text-sm"
              style={{ background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.25)", color: "#86efac" }}
            >
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              Verification email sent! Check your inbox.
            </div>
          )}

          {/* Error state */}
          {status === "error" && (
            <div
              className="rounded-lg px-4 py-3 mb-5 text-sm"
              style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)", color: "#fca5a5" }}
            >
              {errorMsg}
            </div>
          )}

          {/* Resend button */}
          <button
            onClick={resend}
            disabled={status === "sending" || status === "sent"}
            className="w-full rounded-lg py-3 text-sm font-bold tracking-wider uppercase transition-all mb-4 flex items-center justify-center gap-2"
            style={{
              background: status === "sent" ? "rgba(201,168,76,0.3)" : "#C9A84C",
              color: status === "sent" ? "rgba(11,31,59,0.5)" : "#0B1F3B",
              cursor: status === "sending" || status === "sent" ? "not-allowed" : "pointer",
              boxShadow: status === "sent" ? "none" : "0 4px 20px rgba(201,168,76,0.3)",
            }}
          >
            {status === "sending" ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Sending…</>
            ) : status === "sent" ? (
              <><CheckCircle2 className="h-4 w-4" /> Email sent</>
            ) : (
              <><RefreshCw className="h-4 w-4" /> Resend verification email</>
            )}
          </button>

          {/* Sign out */}
          <button
            onClick={() => signOut({ callbackUrl: "/auth/login" })}
            className="inline-flex items-center gap-1.5 text-sm transition-colors"
            style={{ color: "rgba(255,255,255,0.35)" }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.65)")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.35)")}
          >
            <LogOut className="h-3.5 w-3.5" />
            Wrong email? Sign out
          </button>
        </div>

        <p className="text-center mt-6 text-xs" style={{ color: "rgba(255,255,255,0.15)" }}>
          © {new Date().getFullYear()} RUYA. All rights reserved.
        </p>
      </div>
    </div>
  );
}
