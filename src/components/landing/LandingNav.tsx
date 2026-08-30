"use client";

import Link from "next/link";
import { useState } from "react";
import { useAuth } from "@/lib/auth/auth-context";
import AuthModal from "@/components/auth/AuthModal";

const NAV_LINKS = [
  { label: "Platform", href: "#platform" },
  { label: "How It Works", href: "#solutions" },
  { label: "Docs", href: "/docs" },
];

export default function LandingNav() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signin");
  const { user, signOut, supabaseConfigured } = useAuth();

  const openSignIn = () => { setAuthMode("signin"); setAuthOpen(true); setMobileOpen(false); };

  return (
    <>
      <nav
        className="fixed top-0 left-0 w-full z-50 flex justify-between items-center h-16 px-lg"
        style={{
          backgroundColor: "rgba(13,14,16,0.85)",
          backdropFilter: "blur(16px)",
          borderBottom: "1px solid rgba(0,240,255,0.12)",
          boxShadow: "0 1px 0 rgba(0,240,255,0.06)",
        }}
      >
        {/* Logo — clicking goes home */}
        <Link href="/" className="flex items-center gap-sm group">
          <div
            className="w-8 h-8 rounded flex items-center justify-center shrink-0 transition-all duration-200"
            style={{
              border: "1px solid rgba(0,240,255,0.35)",
              boxShadow: "0 0 12px rgba(0,240,255,0.2)",
              backgroundColor: "rgba(0,240,255,0.05)",
            }}
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <path d="M4 3L10 14L16 3" stroke="#00f0ff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M7.5 3L10 8L12.5 3" stroke="#00f0ff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              <circle cx="10" cy="16.5" r="1.5" fill="#00f0ff" />
            </svg>
          </div>
          <span
            className="font-bold text-on-surface group-hover:text-primary-container transition-colors"
            style={{ fontSize: "16px", letterSpacing: "0.06em" }}
          >
            VERDICT
          </span>
        </Link>

        {/* Desktop nav links */}
        <div className="hidden md:flex items-center gap-md">
          {NAV_LINKS.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="text-body-md transition-colors"
              style={{ color: "rgba(180,195,200,0.8)" }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "#00f0ff"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "rgba(180,195,200,0.8)"; }}
            >
              {link.label}
            </a>
          ))}
        </div>

        {/* CTAs */}
        <div className="flex items-center gap-md">
          {user ? (
            /* Signed-in: show user + dashboard link */
            <>
              <Link
                href="/dashboard"
                className="hidden md:flex items-center gap-2 px-4 py-2 text-body-md transition-colors rounded"
                style={{ color: "rgba(180,195,200,0.8)", border: "1px solid rgba(0,240,255,0.18)" }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "#00f0ff"; (e.currentTarget as HTMLElement).style.borderColor = "rgba(0,240,255,0.4)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "rgba(180,195,200,0.8)"; (e.currentTarget as HTMLElement).style.borderColor = "rgba(0,240,255,0.18)"; }}
              >
                <div
                  className="w-5 h-5 rounded-full flex items-center justify-center text-label-mono font-bold"
                  style={{ backgroundColor: "rgba(0,240,255,0.15)", color: "#00f0ff", fontSize: "10px", border: "1px solid rgba(0,240,255,0.3)" }}
                >
                  {(user.user_metadata?.display_name || user.email || "?")[0].toUpperCase()}
                </div>
                Dashboard
              </Link>
              <button
                onClick={() => signOut()}
                className="hidden md:block text-body-sm transition-colors"
                style={{ color: "rgba(180,195,200,0.6)" }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "#ffffff"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "rgba(180,195,200,0.6)"; }}
              >
                Sign out
              </button>
            </>
          ) : (
            /* Guest: sign in + get started */
            <>
              {supabaseConfigured && (
                <button
                  onClick={openSignIn}
                  className="hidden md:block px-4 py-2 text-body-md transition-colors rounded"
                  style={{ color: "rgba(180,195,200,0.8)", border: "1px solid rgba(0,240,255,0.18)" }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "#00f0ff"; (e.currentTarget as HTMLElement).style.borderColor = "rgba(0,240,255,0.4)"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "rgba(180,195,200,0.8)"; (e.currentTarget as HTMLElement).style.borderColor = "rgba(0,240,255,0.18)"; }}
                >
                  Sign in
                </button>
              )}
              {!supabaseConfigured && (
                <Link
                  href="/dashboard"
                  className="hidden md:block px-4 py-2 text-body-md transition-colors rounded"
                  style={{ color: "rgba(180,195,200,0.8)", border: "1px solid rgba(0,240,255,0.18)" }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "#00f0ff"; (e.currentTarget as HTMLElement).style.borderColor = "rgba(0,240,255,0.4)"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "rgba(180,195,200,0.8)"; (e.currentTarget as HTMLElement).style.borderColor = "rgba(0,240,255,0.18)"; }}
                >
                  Dashboard
                </Link>
              )}
            </>
          )}
          <Link
            href="/analyze"
            className="px-4 py-2 text-body-md font-semibold rounded transition-all"
            style={{
              backgroundColor: "#00f0ff",
              color: "#0a0f10",
              boxShadow: "0 0 16px rgba(0,240,255,0.35)",
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = "0 0 28px rgba(0,240,255,0.6)"; (e.currentTarget as HTMLElement).style.backgroundColor = "#1af5ff"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = "0 0 16px rgba(0,240,255,0.35)"; (e.currentTarget as HTMLElement).style.backgroundColor = "#00f0ff"; }}
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
              Dashboard
            </Link>
            {!user && supabaseConfigured && (
              <button
                onClick={openSignIn}
                className="text-left text-on-surface-variant hover:text-on-surface text-body-md py-2"
              >
                Sign in
              </button>
            )}
            {user && (
              <button
                onClick={() => { signOut(); setMobileOpen(false); }}
                className="text-left text-on-surface-variant hover:text-on-surface text-body-md py-2"
              >
                Sign out
              </button>
            )}
          </div>
        )}
      </nav>

      {/* Auth modal */}
      <AuthModal
        isOpen={authOpen}
        onClose={() => setAuthOpen(false)}
        defaultMode={authMode}
        onSuccess={() => setAuthOpen(false)}
      />
    </>
  );
}
