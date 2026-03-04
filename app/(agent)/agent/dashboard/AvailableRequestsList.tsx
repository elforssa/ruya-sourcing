"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { MapPin, Loader2, Sparkles, CheckCircle2, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";

type Request = {
  id: string;
  productName: string;
  quantity: number;
  destinationCountry: string | null;
  createdAt: Date;
  client: { name: string | null };
};

type Toast = { id: string; message: string; type: "success" | "error" };

export default function AvailableRequestsList({
  initialRequests,
}: {
  initialRequests: Request[];
}) {
  const router = useRouter();
  const [requests, setRequests] = useState(initialRequests);
  const [picking, setPicking] = useState<string | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((message: string, type: Toast["type"]) => {
    const id = Math.random().toString(36).slice(2);
    setToasts((t) => [...t, { id, message, type }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3500);
  }, []);

  const pickup = async (req: Request) => {
    setPicking(req.id);
    try {
      const res = await fetch(`/api/requests/${req.id}/assign`, { method: "POST" });
      const data = await res.json();

      if (!res.ok) {
        addToast(data.error ?? "Failed to pick up request", "error");
        return;
      }

      // Optimistic removal from the available list
      setRequests((prev) => prev.filter((r) => r.id !== req.id));
      addToast(`"${req.productName}" added to your queue`, "success");

      // Refresh server component so My Requests updates
      router.refresh();
    } catch {
      addToast("Network error — please try again", "error");
    } finally {
      setPicking(null);
    }
  };

  if (requests.length === 0) return null;

  return (
    <>
      {/* Toast stack — fixed bottom-right */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`flex items-center gap-2.5 rounded-xl px-4 py-3 text-sm font-medium shadow-lg pointer-events-auto animate-in slide-in-from-bottom-2 duration-200 ${
              t.type === "success"
                ? "bg-emerald-600 text-white"
                : "bg-red-600 text-white"
            }`}
          >
            {t.type === "success" ? (
              <CheckCircle2 className="h-4 w-4 shrink-0" />
            ) : (
              <AlertCircle className="h-4 w-4 shrink-0" />
            )}
            {t.message}
          </div>
        ))}
      </div>

      <Card className="border-amber-200 bg-amber-50/30 mb-6">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-amber-100 flex items-center justify-center shrink-0">
              <Sparkles className="h-4 w-4 text-amber-600" />
            </div>
            <div>
              <CardTitle className="text-base">Available Requests</CardTitle>
              <p className="text-sm text-muted-foreground mt-0.5">
                {requests.length} unassigned request{requests.length !== 1 ? "s" : ""} — pick one up to start working
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-amber-200/60 bg-amber-50/60">
                  <th className="text-left px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Client</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Product</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden md:table-cell">Destination</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden sm:table-cell">Date</th>
                  <th className="text-right px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-amber-100">
                {requests.map((req) => (
                  <tr key={req.id} className="hover:bg-amber-50/60 transition-colors">
                    <td className="px-6 py-3.5 font-medium">{req.client.name}</td>
                    <td className="px-4 py-3.5">
                      <p className="font-medium">{req.productName}</p>
                      <p className="text-xs text-muted-foreground">{req.quantity.toLocaleString()} units</p>
                    </td>
                    <td className="px-4 py-3.5 text-muted-foreground hidden md:table-cell">
                      {req.destinationCountry ? (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5 shrink-0" />
                          {req.destinationCountry}
                        </span>
                      ) : "—"}
                    </td>
                    <td className="px-4 py-3.5 text-muted-foreground hidden sm:table-cell">
                      {formatDate(req.createdAt)}
                    </td>
                    <td className="px-6 py-3.5 text-right">
                      <button
                        onClick={() => pickup(req)}
                        disabled={picking === req.id}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-primary text-primary-foreground px-3 py-1.5 text-xs font-semibold hover:opacity-90 disabled:opacity-60 transition-all"
                      >
                        {picking === req.id ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <Sparkles className="h-3 w-3" />
                        )}
                        Pick Up
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
