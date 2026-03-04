"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, HandshakeIcon } from "lucide-react";

export default function PickupButton({ requestId }: { requestId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const pickup = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/agent/requests/${requestId}/pickup`, {
        method: "POST",
      });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error ?? "Failed to pick up request");
        return;
      }
      setDone(true);
      router.refresh();
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 border border-emerald-200 px-3 py-1.5 text-xs font-medium text-emerald-700">
        Picked up!
      </span>
    );
  }

  return (
    <button
      onClick={pickup}
      disabled={loading}
      className="inline-flex items-center gap-1.5 rounded-lg bg-primary text-primary-foreground px-3 py-1.5 text-xs font-semibold hover:opacity-90 disabled:opacity-60 transition-all"
    >
      {loading ? (
        <Loader2 className="h-3 w-3 animate-spin" />
      ) : (
        <HandshakeIcon className="h-3 w-3" />
      )}
      Pick Up
    </button>
  );
}
