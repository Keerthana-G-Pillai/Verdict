import type { ReactNode } from "react";
import AppSidebar from "./AppSidebar";

interface AppShellProps {
  children: ReactNode;
}

/**
 * AppShell — wraps all authenticated/dashboard views.
 * Renders the fixed 256px sidebar and a main content area.
 */
export default function AppShell({ children }: AppShellProps) {
  return (
    <div className="flex min-h-screen bg-background grid-bg">
      <AppSidebar />
      <main className="ml-64 flex-1 flex flex-col min-h-screen">
        {children}
      </main>
    </div>
  );
}
