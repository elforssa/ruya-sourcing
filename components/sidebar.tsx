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
  Menu,
  X,
} from "lucide-react";
import { cn, getInitials } from "@/lib/utils";
import { NotificationBell } from "@/components/notification-bell";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

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
    <div className="space-y-1" role="navigation" aria-label="Main navigation">
      {nav.map(({ label, href, icon: Icon }) => {
        const active = pathname === href || pathname.startsWith(href + "/");
        return (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            className={cn(
              "group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150",
              active
                ? "bg-sidebar-accent text-sidebar-primary font-semibold"
                : "text-sidebar-foreground/60 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground hover:translate-x-0.5"
            )}
          >
            {/* Gold left border for active */}
            {active && (
              <div className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-sidebar-primary" />
            )}
            <Icon className={cn(
              "h-4 w-4 shrink-0 transition-colors",
              active ? "text-sidebar-primary" : "text-sidebar-foreground/50 group-hover:text-sidebar-foreground/80"
            )} />
            {label}
          </Link>
        );
      })}
    </div>
  );
}

function UserFooter({ role }: { role: string }) {
  const { data: session } = useSession();
  return (
    <div className="border-t border-sidebar-border p-4">
      <div className="flex items-center gap-3">
        <Avatar className="h-9 w-9 shrink-0">
          <AvatarFallback className="bg-sidebar-accent text-sidebar-accent-foreground text-xs font-semibold">
            {getInitials(session?.user?.name)}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-sidebar-foreground">
            {session?.user?.name ?? "User"}
          </p>
          <span className={cn(
            "inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
            ROLE_COLOR[role] ?? "bg-gray-500/20 text-gray-300"
          )}>
            {ROLE_LABEL[role] ?? role}
          </span>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: "/auth/login" })}
          className="shrink-0 rounded-lg p-2 text-sidebar-foreground/40 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground"
          aria-label="Sign out"
          title="Sign out"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

export function Sidebar({ role }: { role: "CLIENT" | "AGENT" | "ADMIN" }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const nav = role === "ADMIN" ? adminNav : role === "AGENT" ? agentNav : clientNav;

  useEffect(() => { setMobileOpen(false); }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  const sidebarContent = (
    <>
      <div className="flex h-16 items-center justify-between border-b border-sidebar-border px-5">
        <Image
          src="/logo-v2.png"
          alt="RUYA"
          width={120}
          height={32}
          className="h-8 w-auto"
        />
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
      {/* Desktop sidebar */}
      <aside className="hidden md:flex h-screen w-72 flex-col shrink-0 border-r border-sidebar-border bg-sidebar text-sidebar-foreground">
        {sidebarContent}
      </aside>

      {/* Mobile top bar */}
      <header className="md:hidden fixed top-0 inset-x-0 z-40 flex h-14 items-center justify-between border-b border-sidebar-border bg-sidebar text-sidebar-foreground px-4">
        <button
          onClick={() => setMobileOpen(true)}
          className="rounded-lg p-2 hover:bg-sidebar-accent/60 transition-colors"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </button>
        <Image
          src="/logo-v2.png"
          alt="RUYA"
          width={96}
          height={24}
          className="h-6 w-auto"
        />
        <NotificationBell />
      </header>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="relative flex w-72 max-w-[85vw] flex-col bg-sidebar text-sidebar-foreground shadow-2xl animate-in slide-in-from-left duration-200">
            <div className="flex h-14 items-center justify-between border-b border-sidebar-border px-5">
              <Image
                src="/logo-v2.png"
                alt="RUYA"
                width={96}
                height={24}
                className="h-6 w-auto"
              />
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
