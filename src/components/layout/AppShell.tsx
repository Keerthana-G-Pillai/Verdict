"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import AppSidebar from "./AppSidebar";
import { DEMO_ANALYSIS_SCENARIOS } from "@/lib/demo-scenarios";

interface AppShellProps {
  children: ReactNode;
}

/**
 * AppShell — wraps all authenticated/dashboard views.
 * Renders the fixed 256px sidebar and a main content area.
 *
 * Hidden Presentation Mode:
 *   Press Space, then Enter (within 2 seconds) while NOT focused in any
 *   input/textarea/select/contenteditable element.
 *   Loads the next curated scenario through the REAL pipeline.
 *   No results are faked — the scenario passes through the live 4-agent trial.
 */
export default function AppShell({ children }: AppShellProps) {
  const router = useRouter();
  const [spacePressed, setSpacePressed] = useState(false);
  const [presentationToast, setPresentationToast] = useState<string | null>(null);
  // Rotate through the 3 "signature" scenarios in order
  const [scenarioIndex, setScenarioIndex] = useState(0);

  const isInputFocused = useCallback(() => {
    const el = document.activeElement;
    if (!el) return false;
    const tag = el.tagName.toLowerCase();
    if (tag === "input" || tag === "textarea" || tag === "select") return true;
    if ((el as HTMLElement).isContentEditable) return true;
    return false;
  }, []);

  useEffect(() => {
    let spaceTimer: ReturnType<typeof setTimeout> | null = null;

    const handleKeydown = (e: KeyboardEvent) => {
      if (isInputFocused()) return;

      if (e.code === "Space" && !e.repeat) {
        e.preventDefault();
        setSpacePressed(true);
        // Auto-clear the "armed" state after 2 seconds
        if (spaceTimer) clearTimeout(spaceTimer);
        spaceTimer = setTimeout(() => {
          setSpacePressed(false);
        }, 2000);
        return;
      }

      if (e.code === "Enter" && spacePressed) {
        e.preventDefault();
        if (spaceTimer) clearTimeout(spaceTimer);
        setSpacePressed(false);

        // Pick a scenario — rotate through all analysis scenarios
        const scenario = DEMO_ANALYSIS_SCENARIOS[scenarioIndex % DEMO_ANALYSIS_SCENARIOS.length];
        setScenarioIndex((i) => i + 1);

        setPresentationToast(`Presentation: Loading "${scenario.label}"…`);
        setTimeout(() => setPresentationToast(null), 3000);

        // Navigate to the analyze page with the demo param — real pipeline runs
        router.push(`/analyze?demo=${scenario.id}`);
      }
    };

    window.addEventListener("keydown", handleKeydown);
    return () => {
      window.removeEventListener("keydown", handleKeydown);
      if (spaceTimer) clearTimeout(spaceTimer);
    };
  }, [spacePressed, scenarioIndex, isInputFocused, router]);

  return (
    <div className="flex min-h-screen bg-background grid-bg">
      <AppSidebar />
      <main className="ml-64 flex-1 flex flex-col min-h-screen">
        {children}
      </main>

      {/* Presentation mode arm indicator — only shows when Space has been pressed */}
      {spacePressed && (
        <div
          className="fixed bottom-6 right-6 z-[100] flex items-center gap-2 px-4 py-2 rounded border text-label-mono"
          style={{
            backgroundColor: "rgba(19,19,20,0.9)",
            borderColor: "rgba(0,240,255,0.3)",
            color: "#00f0ff",
            backdropFilter: "blur(8px)",
            fontSize: "11px",
          }}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-primary-container animate-pulse" />
          Press Enter to load presentation scenario
        </div>
      )}

      {/* Presentation mode launch toast */}
      {presentationToast && (
        <div
          className="fixed bottom-6 right-6 z-[100] flex items-center gap-2 px-4 py-2 rounded border text-label-mono"
          style={{
            backgroundColor: "rgba(19,19,20,0.9)",
            borderColor: "rgba(0,240,255,0.3)",
            color: "#00f0ff",
            backdropFilter: "blur(8px)",
            fontSize: "11px",
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>auto_awesome</span>
          {presentationToast}
        </div>
      )}
    </div>
  );
}
