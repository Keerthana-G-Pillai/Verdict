"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { NavItem } from "@/types";

const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: "dashboard" },
  { label: "Analyses", href: "/analyses", icon: "analytics" },
  { label: "Simulations", href: "/simulations", icon: "account_tree" },
  { label: "Engineering Memory", href: "/memory", icon: "history" },
  { label: "Settings", href: "/settings", icon: "settings" },
];


export default function AppSidebar() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed top-0 left-0 h-full w-64 border-r border-outline-variant flex flex-col py-lg z-50"
      style={{ backgroundColor: "var(--color-surface-container-low)" }}
    >
      {/* Logo */}
      <div className="px-md mb-xl flex items-center gap-sm">
        <div
          className="w-8 h-8 rounded flex items-center justify-center border border-primary-container/40 shrink-0"
          style={{ boxShadow: "0 0 12px rgba(0,240,255,0.2)" }}
        >
          {/* Verdict V/medal icon — SVG recreation of the logo mark */}
          <svg
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M4 3L10 14L16 3"
              stroke="#00f0ff"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M7.5 3L10 8L12.5 3"
              stroke="#00f0ff"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <circle cx="10" cy="16.5" r="1.5" fill="#00f0ff" />
          </svg>
        </div>
        <div>
          <div
            className="font-bold leading-none text-on-surface"
            style={{ fontSize: "16px", letterSpacing: "-0.01em" }}
          >
            Verdict
          </div>
          <div className="text-label-mono text-on-surface-variant mt-0.5">
            Change Intelligence
          </div>
        </div>
      </div>

      {/* New Analysis CTA */}
      <div className="px-md mb-lg">
        <Link
          href="/analyze"
          className="w-full bg-primary-container text-on-primary-fixed-variant hover:bg-primary-fixed-dim transition-colors duration-200 py-2 px-4 rounded flex items-center justify-center gap-sm text-label-mono active:scale-95"
        >
          <span className="material-symbols-outlined text-[16px]">add</span>
          New Analysis
        </Link>
      </div>

      {/* Primary navigation */}
      <ul className="flex flex-col flex-1 px-sm gap-xs">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={`flex items-center gap-md px-md py-2 rounded transition-colors duration-200 text-body-md active:scale-95 ${
                  isActive
                    ? "sidebar-item-active"
                    : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container-highest"
                }`}
              >
                <span
                  className="material-symbols-outlined text-[20px]"
                  style={
                    isActive
                      ? { fontVariationSettings: "'FILL' 1, 'wght' 300, 'GRAD' 0, 'opsz' 20" }
                      : {}
                  }
                >
                  {item.icon}
                </span>
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>

      {/* Bottom — version stamp */}
      <div className="mt-auto px-md pt-lg border-t border-outline-variant/30">
        <p className="text-label-mono text-on-surface-variant" style={{ fontSize: "10px" }}>
          VERDICT v2.0 · Static &amp; Semantic Analysis
        </p>
      </div>
    </nav>
  );
}
