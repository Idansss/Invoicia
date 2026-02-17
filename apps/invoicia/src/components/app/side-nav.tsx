"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell,
  ClipboardList,
  FileText,
  Home,
  Package,
  Receipt,
  Settings,
  ShieldCheck,
  Shapes,
  Users,
  Wallet,
} from "lucide-react";

import { cn } from "@/lib/utils";

const navItems = [
  { href: "/app", label: "Overview", icon: Home },
  { href: "/invoices", label: "Invoices", icon: FileText },
  { href: "/quotes", label: "Quotes", icon: Receipt },
  { href: "/customers", label: "Customers", icon: Users },
  { href: "/products", label: "Products", icon: Package },
  { href: "/payments", label: "Payments", icon: Wallet },
  { href: "/reminders", label: "Reminders", icon: Bell },
  { href: "/templates", label: "Templates", icon: Shapes },
  { href: "/compliance", label: "Compliance", icon: ShieldCheck },
  { href: "/settings", label: "Settings", icon: Settings },
  { href: "/audit", label: "Audit Log", icon: ClipboardList },
];

function isActive(pathname: string, href: string) {
  if (href === "/app") return pathname === "/app";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function SideNav({ compact = false }: { compact?: boolean }) {
  const pathname = usePathname();

  return (
    <nav className={cn("grid gap-1", compact && "grid-cols-2 sm:grid-cols-3")}>
      {navItems.map((item) => {
        const active = isActive(pathname, item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors",
              active
                ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300"
                : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-100",
            )}
          >
            <item.icon
              className={cn(
                "h-4 w-4",
                active
                  ? "text-indigo-600 dark:text-indigo-300"
                  : "text-zinc-500 group-hover:text-zinc-800 dark:text-zinc-500 dark:group-hover:text-zinc-200",
              )}
            />
            <span className="font-medium">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

