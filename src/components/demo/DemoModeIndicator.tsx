"use client";
// ============================================================
// DemoModeIndicator — sidebar badge shown while demo is active.
// Includes tooltip clarifying results are live, plus exit button.
// ============================================================

import { useDemoStore } from "@/store/demo-store";

export default function DemoModeIndicator() {
  const { active, deactivate } = useDemoStore();
  if (!active) return null;

  return (
    <div
      style={{
        margin: "0 12px 12px",
        borderRadius: "6px",
        border: "1px solid rgba(0,240,255,0.2)",
        backgroundColor: "rgba(0,240,255,0.04)",
        padding: "10px 12px",
      }}
    >
      {/* Header row */}
      <div style={{ display: "flex", alignItems: "center", gap: "7px", marginBottom: "4px" }}>
        <div
          style={{
            width: "7px",
            height: "7px",
            borderRadius: "50%",
            backgroundColor: "#00f0ff",
            boxShadow: "0 0 6px rgba(0,240,255,0.8)",
            flexShrink: 0,
            animation: "demo-dot-pulse 2s ease-in-out infinite",
          }}
        />
        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "10px",
            fontWeight: 700,
            letterSpacing: "0.1em",
            color: "#00f0ff",
            textTransform: "uppercase",
          }}
        >
          Demo Mode
        </span>
      </div>

      {/* Description */}
      <p
        style={{
          fontFamily: "var(--font-sans)",
          fontSize: "11px",
          color: "#849495",
          lineHeight: "1.5",
          marginBottom: "8px",
        }}
      >
        Curated inputs. Live analysis pipeline.
      </p>

      {/* Exit button */}
      <button
        onClick={deactivate}
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: "10px",
          letterSpacing: "0.08em",
          color: "#849495",
          textTransform: "uppercase",
          background: "none",
          border: "none",
          cursor: "pointer",
          padding: 0,
          display: "flex",
          alignItems: "center",
          gap: "5px",
          transition: "color 0.15s",
        }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "#e5e2e3"; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "#849495"; }}
      >
        <span className="material-symbols-outlined" style={{ fontSize: "12px" }}>close</span>
        Exit Demo Mode
      </button>

      <style>{`
        @keyframes demo-dot-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </div>
  );
}
