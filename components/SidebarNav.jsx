"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Activity,
  Bell,
  ChevronLeft,
  ChevronRight,
  FolderLock,
  Info,
  LayoutDashboard,
  Mail,
  Menu,
  PenBox,
  RefreshCw,
  TrendingUp,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

const links = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/financial-health", label: "Health Score", icon: Activity },
  { href: "/notifications", label: "Notifications", icon: Bell },
  { href: "/document-vault", label: "Document Vault", icon: FolderLock },
  { href: "/investments", label: "Investment Portfolio", icon: TrendingUp },
  { href: "/transaction/create", label: "Transactions", icon: PenBox },
  { href: "/bill-reminders", label: "Bill Reminder", icon: Bell },
  { href: "/recurring-manager", label: "Recurring Manager", icon: RefreshCw },
  { href: "/about", label: "About", icon: Info },
  { href: "/contact", label: "Contact", icon: Mail },
];

const SidebarContent = ({ pathname, onNavigate, collapsed = false, onToggle }) => {
  const isActive = (href) => pathname === href || pathname?.startsWith(`${href}/`);

  return (
    <div className="flex h-full flex-col border-r border-slate-200/80 bg-gradient-to-b from-slate-50 via-white to-slate-100 px-3 pb-6 pt-3 shadow-[inset_-1px_0_0_rgba(148,163,184,0.18)] backdrop-blur transition-[width] duration-300 dark:border-slate-800/80 dark:from-slate-950 dark:via-slate-950 dark:to-slate-900 dark:shadow-[inset_-1px_0_0_rgba(51,65,85,0.35)]">
      <div className={cn("flex items-center border-b border-slate-200/70 pb-3 dark:border-slate-800/70", collapsed ? "justify-center px-0" : "justify-between px-3")}>
        {!collapsed && (
          <p className="text-[10px] uppercase tracking-[0.28em] text-muted-foreground">
            Menu
          </p>
        )}
        {onToggle && (
          <button
            type="button"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className="hidden h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-800 lg:inline-flex dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
            onClick={onToggle}
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        )}
      </div>
      <nav className="space-y-1.5">
        {links.map(({ href, label, icon: Icon }) => {
          const link = (
            <Link
              key={href}
              href={href}
              onClick={onNavigate}
              className={cn(
                "flex items-center rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                collapsed ? "justify-center gap-0 px-0" : "gap-3",
                isActive(href)
                  ? "bg-blue-100 text-blue-800 shadow-sm ring-1 ring-blue-200/70 dark:bg-blue-500/15 dark:text-blue-100 dark:ring-blue-400/20"
                  : "text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {!collapsed && <span>{label}</span>}
            </Link>
          );

          if (!collapsed) {
            return link;
          }

          return (
            <Tooltip key={href}>
              <TooltipTrigger asChild>{link}</TooltipTrigger>
              <TooltipContent side="right" sideOffset={10}>
                {label}
              </TooltipContent>
            </Tooltip>
          );
        })}
      </nav>
    </div>
  );
};

const SidebarNav = () => {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  useEffect(() => {
    const saved = window.localStorage.getItem("sidebar-collapsed");
    const nextCollapsed = saved === "true";
    setIsCollapsed(nextCollapsed);
    document.documentElement.style.setProperty("--sidebar-width", nextCollapsed ? "5.5rem" : "16rem");
  }, []);

  useEffect(() => {
    document.documentElement.style.setProperty("--sidebar-width", isCollapsed ? "5.5rem" : "16rem");
    window.localStorage.setItem("sidebar-collapsed", String(isCollapsed));
  }, [isCollapsed]);

  useEffect(() => {
    if (!isOpen) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  return (
    <>
      <button
        type="button"
        aria-label="Open navigation menu"
        className="fixed left-3 top-[calc(var(--header-height)+0.75rem)] z-[70] inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200/70 bg-white/92 text-slate-700 shadow-sm backdrop-blur transition hover:bg-slate-50 lg:hidden dark:border-slate-800/70 dark:bg-slate-950/92 dark:text-slate-200 dark:hover:bg-slate-900"
        onClick={() => setIsOpen(true)}
      >
        <Menu className="h-5 w-5" />
      </button>

      <aside
        className={cn(
          "fixed left-0 top-[var(--header-height)] z-40 hidden transition-[width] duration-300 lg:block",
          isCollapsed ? "w-[5.5rem]" : "w-64"
        )}
        style={{ height: "calc(100vh - var(--header-height))" }}
      >
        <SidebarContent
          pathname={pathname}
          collapsed={isCollapsed}
          onToggle={() => setIsCollapsed((current) => !current)}
        />
      </aside>

      <div
        className={cn(
          "fixed inset-0 z-[80] bg-slate-950/40 opacity-0 transition-opacity duration-300 lg:hidden",
          isOpen ? "pointer-events-auto opacity-100" : "pointer-events-none"
        )}
        onClick={() => setIsOpen(false)}
      />

      <aside
        className={cn(
          "fixed left-0 top-0 z-[90] h-screen w-72 max-w-[85vw] -translate-x-full transition-transform duration-300 ease-out lg:hidden",
          isOpen && "translate-x-0"
        )}
      >
        <div className="absolute right-3 top-[calc(var(--header-height)+0.75rem)] z-[95]">
          <button
            type="button"
            aria-label="Close navigation menu"
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200/70 bg-white/92 text-slate-700 shadow-sm backdrop-blur transition hover:bg-slate-50 dark:border-slate-800/70 dark:bg-slate-950/92 dark:text-slate-200 dark:hover:bg-slate-900"
            onClick={() => setIsOpen(false)}
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <SidebarContent pathname={pathname} onNavigate={() => setIsOpen(false)} />
      </aside>
    </>
  );
};

export default SidebarNav;
