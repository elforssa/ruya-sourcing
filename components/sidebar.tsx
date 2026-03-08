"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import {
  LayoutDashboard,
  ClipboardList,
  FileText,
  ShoppingCart,
  Users,
  Settings,
  LogOut,
  ChevronRight,
  Menu,
  X,
} from "lucide-react";
import { cn, getInitials } from "@/lib/utils";
import { NotificationBell } from "@/components/notification-bell";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

type NavItem = { label: string; href: string; icon: React.ElementType };

const clientNav: NavItem[] = [
  { label: "Dashboard",    href: "/client/dashboard",  icon: LayoutDashboard },
  { label: "My Requests",  href: "/client/requests",   icon: ClipboardList },
  { label: "Quotations",   href: "/client/quotations", icon: FileText },
  { label: "Orders",       href: "/client/orders",     icon: ShoppingCart },
];

const agentNav: NavItem[] = [
  { label: "Dashboard",  href: "/agent/dashboard",  icon: LayoutDashboard },
  { label: "Requests",   href: "/agent/requests",   icon: ClipboardList },
  { label: "Quotations", href: "/agent/quotations", icon: FileText },
  { label: "Orders",     href: "/agent/orders",     icon: ShoppingCart },
];

const adminNav: NavItem[] = [
  { label: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
  { label: "Users",     href: "/admin/users",     icon: Users },
  { label: "Requests",  href: "/admin/requests",  icon: ClipboardList },
  { label: "Orders",    href: "/admin/orders",    icon: ShoppingCart },
  { label: "Settings",  href: "/admin/settings",  icon: Settings },
];

const ROLE_LABEL: Record<string, string> = { ADMIN: "Admin", AGENT: "Agent", CLIENT: "Client" };
const ROLE_COLOR: Record<string, string> = {
  ADMIN:  "bg-red-500/20 text-red-300",
  AGENT:  "bg-purple-500/20 text-purple-300",
  CLIENT: "bg-emerald-500/20 text-emerald-300",
};

function RuyaLogo() {
  return <Image src="/logo.png" alt="RUYA" width={120} height={40} className="h-8 w-auto" />;
}

function NavLinks({
  nav,
  pathname,
  onNavigate,
}: {
  nav: NavItem[];
  pathname: string;
  onNavigate?: () => void;
}) {
  return (
    <div className="space-y-0.5">
      {nav.map(({ label, href, icon: Icon }) => {
        const active = pathname === href || pathname.startsWith(href + "/");
        return (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
              active
                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
            {label}
            {active && <ChevronRight className="ml-auto h-3 w-3 opacity-50" />}
          </Link>
        );
      })}
    </div>
  );
}

function UserFooter({ role }: { role: string }) {
  const { data: session } = useSession();
  return (
    <div className="border-t border-sidebar-border p-4 space-y-3">
      <div className="flex items-center gap-3">
        <Avatar className="h-8 w-8 shrink-0">
          <AvatarFallback className="bg-sidebar-accent text-sidebar-accent-foreground text-xs">
            {getInitials(session?.user?.name)}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{session?.user?.name ?? "User"}</p>
          <span className={cn("inline-block rounded-full px-1.5 py-0.5 text-xs font-medium", ROLE_COLOR[role] ?? "bg-gray-500/20 text-gray-300")}>
            {ROLE_LABEL[role] ?? role}
          </span>
        </div>
      </div>
      <Button
        variant="ghost"
        size="sm"
        className="w-full justify-start text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
        onClick={() => signOut({ callbackUrl: "/auth/login" })}
      >
        <LogOut className="mr-2 h-4 w-4" />
        Sign Out
      </Button>
    </div>
  );
}

export function Sidebar({ role }: { role: "CLIENT" | "AGENT" | "ADMIN" }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const nav = role === "ADMIN" ? adminNav : role === "AGENT" ? agentNav : clientNav;

  // Close drawer on route change
  useEffect(() => { setMobileOpen(false); }, [pathname]);

  // Prevent body scroll when drawer is open
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  const sidebarContent = (
    <>
      <div className="flex h-16 items-center justify-between border-b border-sidebar-border px-5">
        <RuyaLogo />
        <NotificationBell />
      </div>
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <NavLinks nav={nav} pathname={pathname} onNavigate={() => setMobileOpen(false)} />
      </nav>
      <UserFooter role={role} />
    </>
  );

  return (
    <>
      {/* ── Desktop sidebar ── */}
      <aside className="hidden md:flex h-screen w-64 flex-col shrink-0 border-r border-sidebar-border bg-sidebar text-sidebar-foreground">
        {sidebarContent}
      </aside>

      {/* ── Mobile top bar ── */}
      <header className="md:hidden fixed top-0 inset-x-0 z-40 flex h-14 items-center justify-between border-b border-sidebar-border bg-sidebar text-sidebar-foreground px-4">
        <button
          onClick={() => setMobileOpen(true)}
          className="rounded-lg p-2 hover:bg-sidebar-accent/60 transition-colors"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </button>
        <RuyaLogo />
        <NotificationBell />
      </header>

      {/* ── Mobile drawer overlay ── */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />

          {/* Drawer panel */}
          <aside className="relative flex w-72 max-w-[85vw] flex-col bg-sidebar text-sidebar-foreground shadow-2xl animate-in slide-in-from-left duration-200">
            <div className="flex h-14 items-center justify-between border-b border-sidebar-border px-5">
              <RuyaLogo />
              <button
                onClick={() => setMobileOpen(false)}
                className="rounded-lg p-1.5 hover:bg-sidebar-accent/60 transition-colors"
                aria-label="Close menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <nav className="flex-1 overflow-y-auto px-3 py-4">
              <NavLinks nav={nav} pathname={pathname} onNavigate={() => setMobileOpen(false)} />
            </nav>
            <UserFooter role={role} />
          </aside>
        </div>
      )}
    </>
  );
}
