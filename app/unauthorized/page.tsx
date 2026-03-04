import Link from "next/link";
import { ShieldX } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex items-center justify-center p-4">
      <div className="text-center">
        <div className="inline-flex h-20 w-20 items-center justify-center rounded-2xl bg-red-500/20 mb-6">
          <ShieldX className="h-10 w-10 text-red-400" />
        </div>
        <h1 className="text-3xl font-bold text-white mb-3">Access Denied</h1>
        <p className="text-white/50 mb-8 max-w-sm">
          You don&apos;t have permission to access this page.
        </p>
        <Link href="/login">
          <Button className="bg-blue-500 hover:bg-blue-600 text-white">
            Back to Login
          </Button>
        </Link>
      </div>
    </div>
  );
}
