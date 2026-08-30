"use client";
// ============================================================
// DemoActivationToast — premium activation notification.
// Appears for 4 seconds after K+P is pressed.
// ============================================================

import { useEffect, useState } from "react";

interface Props {
  onDone: () => void;
}

export default function DemoActivationToast({ onDone }: Props) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Trigger enter animation on next frame
    const t = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(t);
  }, []);

  return (
    <div
      className="fixed bottom-6 right-6 z-[9999] pointer-events-none"
      style={{
        transform: visible ? "translateY(0)" : "translateY(16px)",
        opacity: visible ? 1 : 0,
        transition: "transform 0.35s cubic-bezier(0.16,1,0.3,1), opacity 0.3s ease",
      }}
    >
      <div
        style={{
          backgroundColor: "#131314",
          border: "1px solid rgba(0,240,255,0.35)",
          boxShadow: "0 0 24px rgba(0,240,255,0.12), 0 8px 32px rgba(0,0,0,0.6)",
          borderRadius: "6px",
          padding: "14px 18px",
          display: "flex",
          alignItems: "flex-start",
          gap: "12px",
          minWidth: "280px",
          maxWidth: "360px",
        }}
      >
        {/* Pulsing dot */}
        <div style={{ paddingTop: "3px", flexShrink: 0 }}>
          <div
            style={{
              width: "8px",
              height: "8px",
              borderRadius: "50%",
              backgroundColor: "#00f0ff",
              boxShadow: "0 0 8px rgba(0,240,255,0.9)",
              animation: "demo-pulse 1.5s ease-in-out infinite",
            }}
          />
        </div>

        <div>
          <p
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "11px",
              fontWeight: 700,
              letterSpacing: "0.12em",
              color: "#00f0ff",
              textTransform: "uppercase",
              marginBottom: "4px",
            }}
          >
            Demo Mode Activated
          </p>
          <p
            style={{
              fontFamily: "var(--font-sans)",
              fontSize: "13px",
              color: "#b9cacb",
              lineHeight: "1.5",
            }}
          >
            Judge-ready scenarios are now available on the Analyze page.
          </p>
        </div>
      </div>

      <style>{`
        @keyframes demo-pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(0.85); }
        }
      `}</style>
    </div>
  );
}
