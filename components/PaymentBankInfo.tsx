"use client";

import { useState } from "react";
import { Building2, Copy, CheckCircle2, MessageCircle } from "lucide-react";

const WHATSAPP_NUMBER = "+8618124804645";

const ACCOUNTS = [
  {
    id: "mad",
    currency: "MAD",
    flag: "🇲🇦",
    label: "Moroccan Dirham (MAD)",
    rows: [
      { label: "Titulaire",  value: "EL MEHDI BOUCHRIT" },
      { label: "RIB",        value: "230 815 6308980211005300 02" },
      { label: "IBAN",       value: "MA64 2308 1563 0898 0211 0053 0002" },
      { label: "Code SWIFT", value: "CIHMMAMC" },
    ],
  },
  {
    id: "usd",
    currency: "USD",
    flag: "🇺🇸",
    label: "US Dollar (USD)",
    rows: [
      { label: "Account Name",    value: "Fujma Limited" },
      { label: "Account Number",  value: "8481012043" },
      { label: "ACH Routing",     value: "026073150" },
      { label: "Fedwire Routing", value: "026073008" },
      { label: "SWIFT Code",      value: "CMFGUS33" },
      { label: "Bank Name",       value: "Community Federal Savings Bank" },
      { label: "Bank Address",    value: "89-16 Jamaica Ave, Woodhaven, NY, United States, 11421" },
      { label: "Account Type",    value: "Checking" },
    ],
  },
] as const;

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <button
      onClick={copy}
      className="ml-2 p-1 rounded hover:bg-muted transition-colors shrink-0"
      title="Copy to clipboard"
    >
      {copied
        ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
        : <Copy className="h-3.5 w-3.5 text-muted-foreground" />}
    </button>
  );
}

export default function PaymentBankInfo() {
  const [active, setActive] = useState<"mad" | "usd">("mad");
  const account = ACCOUNTS.find((a) => a.id === active)!;

  return (
    <div className="space-y-4">
      {/* Currency tabs */}
      <div className="flex rounded-lg border bg-muted/30 p-1 gap-1">
        {ACCOUNTS.map((a) => (
          <button
            key={a.id}
            onClick={() => setActive(a.id as "mad" | "usd")}
            className={`flex-1 flex items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-all ${
              active === a.id
                ? "bg-background shadow-sm text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <span>{a.flag}</span>
            {a.currency}
          </button>
        ))}
      </div>

      {/* Bank details card */}
      <div className="rounded-xl border bg-background p-4 space-y-3">
        <div className="flex items-center gap-2 mb-3">
          <Building2 className="h-4 w-4 text-primary" />
          <p className="text-sm font-semibold">{account.label}</p>
        </div>

        <div className="space-y-2.5">
          {account.rows.map((row) => (
            <div key={row.label} className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">{row.label}</p>
                <p className="text-sm font-medium font-mono break-all">{row.value}</p>
              </div>
              <CopyButton text={row.value} />
            </div>
          ))}
        </div>
      </div>

      {/* WhatsApp help */}
      <a
        href={`https://wa.me/${WHATSAPP_NUMBER.replace(/\s+/g, "")}?text=${encodeURIComponent("Hi, I need help with my payment for my RUYA order.")}`}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50/50 p-4 hover:bg-emerald-50 transition-colors"
      >
        <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
          <MessageCircle className="h-5 w-5 text-emerald-700" />
        </div>
        <div>
          <p className="text-sm font-semibold text-emerald-800">Need help with payment?</p>
          <p className="text-xs text-emerald-700">Chat with us on WhatsApp</p>
        </div>
      </a>
    </div>
  );
}
