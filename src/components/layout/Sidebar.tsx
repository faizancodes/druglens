"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Search,
  Pill,
  Salad,
  GitCompare,
  FlaskConical,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  badge?: string;
}

const NAV_ITEMS: NavItem[] = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: <LayoutDashboard className="w-4 h-4" />,
  },
  {
    label: "Explore",
    href: "/explore",
    icon: <Search className="w-4 h-4" />,
  },
  {
    label: "Food Interactions",
    href: "/food-interactions",
    icon: <Salad className="w-4 h-4" />,
    badge: "NEW",
  },
  {
    label: "Compare Drugs",
    href: "/compare",
    icon: <GitCompare className="w-4 h-4" />,
  },
];

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard" || pathname === "/";
    return pathname.startsWith(href);
  };

  return (
    <aside
      className={cn(
        "flex flex-col w-[220px] shrink-0 bg-[#0f0f0f] border-r border-[#1a1a1a] h-full",
        className
      )}
    >
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 py-5 border-b border-[#1a1a1a]">
        <div className="w-7 h-7 bg-[#00C9A7] flex items-center justify-center shrink-0">
          <FlaskConical className="w-4 h-4 text-[#0a0a0a]" />
        </div>
        <div>
          <span className="text-sm font-bold text-white tracking-tight">
            Drug<span className="text-[#00C9A7]">lens</span>
          </span>
          <p className="text-[9px] uppercase tracking-[0.08em] text-[#555555] font-semibold leading-none mt-0.5">
            Pharmacovigilance
          </p>
        </div>
      </div>

      {/* Nav section label */}
      <div className="px-5 pt-5 pb-2">
        <p className="text-[9px] uppercase tracking-[0.1em] text-[#555555] font-semibold">
          Navigation
        </p>
      </div>

      {/* Nav items */}
      <nav className="flex-1 px-3 space-y-0.5">
        {NAV_ITEMS.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group flex items-center gap-3 px-3 py-2.5 text-sm transition-colors duration-150 rounded-[2px]",
                active
                  ? "bg-[#00C9A7]/10 text-[#00C9A7]"
                  : "text-[#666666] hover:text-[#a1a1a1] hover:bg-[#111111]"
              )}
            >
              <span
                className={cn(
                  "shrink-0 transition-colors",
                  active ? "text-[#00C9A7]" : "text-[#444444] group-hover:text-[#666666]"
                )}
              >
                {item.icon}
              </span>
              <span className="flex-1 font-medium">{item.label}</span>
              {item.badge && (
                <span className="text-[8px] font-bold uppercase tracking-[0.08em] bg-[#00C9A7]/15 text-[#00C9A7] px-1.5 py-0.5 rounded-[2px]">
                  {item.badge}
                </span>
              )}
              {active && (
                <ChevronRight className="w-3 h-3 text-[#00C9A7] shrink-0" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Drug search hint */}
      <div className="px-3 pb-3">
        <div className="border border-[#1a1a1a] bg-[#0a0a0a] p-3 rounded-[2px]">
          <div className="flex items-center gap-2 mb-2">
            <Pill className="w-3.5 h-3.5 text-[#00C9A7]" />
            <span className="text-[10px] font-semibold uppercase tracking-[0.06em] text-[#a1a1a1]">
              Drug Lookup
            </span>
          </div>
          <p className="text-[10px] text-[#555555] leading-relaxed">
            Search any drug in the top bar to view its adverse event profile.
          </p>
        </div>
      </div>

      {/* Footer */}
      <div className="px-5 py-4 border-t border-[#1a1a1a]">
        <p className="text-[9px] text-[#444444] uppercase tracking-[0.06em]">
          FDA FAERS · USDA FDC
        </p>
        <p className="text-[9px] text-[#333333] mt-0.5">
          Data updated daily
        </p>
      </div>
    </aside>
  );
}
