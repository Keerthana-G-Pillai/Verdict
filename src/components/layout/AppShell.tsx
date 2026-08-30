"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import AppSidebar from "./AppSidebar";

interface AppShellProps {
  children: ReactNode;
}

export default function AppShell({ children }: AppShellProps) {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-background grid-bg">
      {/* Mobile overlay */}
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 md:hidden"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      {/* Sidebar — hidden on small screens unless open */}
      <div
        className={`fixed top-0 left-0 h-full z-50 transition-transform duration-200 ${
          mobileSidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        <AppSidebar onClose={() => setMobileSidebarOpen(false)} />
      </div>

      <main className="md:ml-64 flex-1 flex flex-col min-h-screen w-full">
        {/* Mobile topbar */}
        <div
          className="md:hidden flex items-center gap-3 px-4 h-14 border-b border-outline-variant sticky top-0 z-30"
          style={{ backgroundColor: "rgba(19,19,20,0.9)", backdropFilter: "blur(8px)" }}
        >
          <button
            onClick={() => setMobileSidebarOpen(true)}
            className="text-on-surface-variant hover:text-on-surface transition-colors"
            aria-label="Open navigation"
          >
            <span className="material-symbols-outlined">menu</span>
          </button>
          <div className="flex items-center gap-2">
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <path d="M4 3L10 14L16 3" stroke="#00f0ff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M7.5 3L10 8L12.5 3" stroke="#00f0ff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              <circle cx="10" cy="16.5" r="1.5" fill="#00f0ff" />
            </svg>
            <span className="text-body-md font-bold text-on-surface">VERDICT</span>
          </div>
        </div>

        {children}
      </main>
    </div>
  );
}
