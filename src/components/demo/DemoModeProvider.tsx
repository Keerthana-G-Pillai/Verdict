"use client";
// ============================================================
// DemoModeProvider — mounts the K+P shortcut listener and
// renders the activation toast. Wraps the authenticated app.
// ============================================================

import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { useDemoShortcut } from "@/hooks/useDemoShortcut";
import { useDemoStore } from "@/store/demo-store";
import { useAuth } from "@/lib/auth/auth-context";
import DemoActivationToast from "./DemoActivationToast";

export default function DemoModeProvider({ children }: { children: ReactNode }) {
  useDemoShortcut();

  const { active, deactivate } = useDemoStore();
  const { user } = useAuth();
  const [showToast, setShowToast] = useState(false);

  // Show toast on activation
  useEffect(() => {
    if (active) {
      setShowToast(true);
      const t = setTimeout(() => setShowToast(false), 4000);
      return () => clearTimeout(t);
    }
  }, [active]);

  // Deactivate demo mode on logout
  useEffect(() => {
    if (!user) deactivate();
  }, [user, deactivate]);

  return (
    <>
      {children}
      {showToast && <DemoActivationToast onDone={() => setShowToast(false)} />}
    </>
  );
}
