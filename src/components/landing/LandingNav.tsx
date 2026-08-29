"use client";

import Link from "next/link";
import { useState } from "react";

const NAV_LINKS = [
  { label: "Platform", href: "#platform" },
  { label: "Solutions", href: "#solutions" },
  { label: "Docs", href: "/docs" },
];

export default function LandingNav() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 w-full z-50 border-b border-outline-variant flex justify-between items-center h-16 px-lg"
      style={{ backgroundColor: "rgba(19,19,20,0.8)", backdropFilter: "blur(12px)" }}
    >
      {/* Logo */}
      <div className="flex items-center gap-sm">
        <div
          className="w-8 h-8 rounded flex items-center justify-center border border-primary-container/40 shrink-0"
          style={{ boxShadow: "0 0 12px rgba(0,240,255,0.2)" }}
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <path d="M4 3L10 14L16 3" stroke="#00f0ff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M7.5 3L10 8L12.5 3" stroke="#00f0ff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="10" cy="16.5" r="1.5" fill="#00f0ff" />
          </svg>
        </div>
        <span
          className="font-bold text-on-surface"
          style={{ fontSize: "16px", letterSpacing: "-0.01em" }}
        >
          VERDICT
        </span>
      </div>

      {/* Desktop nav links */}
      <div className="hidden md:flex items-center gap-md">
        {NAV_LINKS.map((link) => (
          <a
            key={link.label}
            href={link.href}
            className="text-on-surface-variant hover:text-primary-fixed-dim transition-colors text-body-md"
          >
            {link.label}
          </a>
        ))}
      </div>

      {/* CTAs */}
      <div className="flex items-center gap-md">
        <Link
          href="/dashboard"
          className="hidden md:block px-4 py-2 text-on-surface-variant hover:text-on-surface transition-colors text-body-md border border-outline-variant rounded hover:border-primary-fixed-dim"
        >
          Log In
        </Link>
        <Link
          href="/dashboard"
          className="px-4 py-2 bg-primary-container text-on-primary-container text-body-md font-semibold rounded hover:opacity-90 transition-opacity"
        >
          Get Started
        </Link>

        {/* Mobile menu toggle */}
        <button
          className="md:hidden text-on-surface-variant hover:text-on-surface ml-2"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
        >
          <span className="material-symbols-outlined">
            {mobileOpen ? "close" : "menu"}
          </span>
        </button>
      </div>

      {/* Mobile dropdown */}
      {mobileOpen && (
        <div
          className="absolute top-16 left-0 right-0 border-b border-outline-variant flex flex-col p-lg gap-sm"
          style={{ backgroundColor: "rgba(19,19,20,0.97)", backdropFilter: "blur(12px)" }}
        >
          {NAV_LINKS.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="text-on-surface-variant hover:text-on-surface text-body-md py-2"
              onClick={() => setMobileOpen(false)}
            >
              {link.label}
            </a>
          ))}
          <Link
            href="/dashboard"
            className="text-on-surface-variant hover:text-on-surface text-body-md py-2"
            onClick={() => setMobileOpen(false)}
          >
            Log In
          </Link>
        </div>
      )}
    </nav>
  );
}
