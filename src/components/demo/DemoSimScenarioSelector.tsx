"use client";
// ============================================================
// DemoSimScenarioSelector — shown on /simulations when Demo Mode active.
// Fills both change panels. Never submits.
// ============================================================

import { useState } from "react";
import { DEMO_SIMULATION_SCENARIOS } from "@/lib/demo-scenarios";
import type { DemoSimulationScenario } from "@/lib/demo-scenarios";

interface Props {
  onLoadScenario: (scenario: DemoSimulationScenario) => void;
}

export default function DemoSimScenarioSelector({ onLoadScenario }: Props) {
  const [selected, setSelected] = useState<DemoSimulationScenario | null>(null);

  return (
    <div
      style={{
        borderRadius: "8px",
        border: "1px solid rgba(0,240,255,0.18)",
        backgroundColor: "rgba(0,240,255,0.03)",
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "12px 16px",
          borderBottom: "1px solid rgba(0,240,255,0.1)",
          backgroundColor: "rgba(0,240,255,0.04)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <div
            style={{
              width: "6px",
              height: "6px",
              borderRadius: "50%",
              backgroundColor: "#00f0ff",
              boxShadow: "0 0 5px rgba(0,240,255,0.8)",
            }}
          />
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "10px",
              fontWeight: 700,
              letterSpacing: "0.12em",
              color: "#00f0ff",
              textTransform: "uppercase",
            }}
          >
            Demo Simulation Scenario
          </span>
        </div>
        <span style={{ fontFamily: "var(--font-sans)", fontSize: "11px", color: "#849495" }}>
          Curated conflict pairs · Detected live by semantic engine
        </span>
      </div>

      {/* Scenario cards */}
      <div style={{ padding: "12px 16px", display: "flex", flexDirection: "column", gap: "8px" }}>
        {DEMO_SIMULATION_SCENARIOS.map((s) => {
          const isSelected = selected?.id === s.id;
          return (
            <button
              key={s.id}
              onClick={() => setSelected(isSelected ? null : s)}
              style={{
                width: "100%",
                textAlign: "left",
                padding: "12px 14px",
                borderRadius: "6px",
                border: `1px solid ${isSelected ? "rgba(0,240,255,0.4)" : "rgba(59,73,75,0.8)"}`,
                backgroundColor: isSelected ? "rgba(0,240,255,0.07)" : "rgba(20,20,22,0.8)",
                cursor: "pointer",
                transition: "border-color 0.15s, background-color 0.15s",
              }}
              onMouseEnter={(e) => {
                if (!isSelected) {
                  (e.currentTarget as HTMLElement).style.borderColor = "rgba(0,240,255,0.25)";
                }
              }}
              onMouseLeave={(e) => {
                if (!isSelected) {
                  (e.currentTarget as HTMLElement).style.borderColor = "rgba(59,73,75,0.8)";
                }
              }}
            >
              <div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
                <div style={{ paddingTop: "3px", flexShrink: 0 }}>
                  <div
                    style={{
                      width: "14px",
                      height: "14px",
                      borderRadius: "50%",
                      border: `2px solid ${isSelected ? "#00f0ff" : "#3b494b"}`,
                      backgroundColor: isSelected ? "rgba(0,240,255,0.2)" : "transparent",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {isSelected && (
                      <div style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: "#00f0ff" }} />
                    )}
                  </div>
                </div>
                <div>
                  <p style={{ fontFamily: "var(--font-sans)", fontSize: "13px", fontWeight: 600, color: isSelected ? "#e5e2e3" : "#b9cacb", marginBottom: "3px" }}>
                    {s.title}
                  </p>
                  <p style={{ fontFamily: "var(--font-sans)", fontSize: "12px", color: "#849495", lineHeight: "1.4" }}>
                    {s.description}
                  </p>
                  <div style={{ display: "flex", gap: "8px", marginTop: "6px" }}>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "#00f0ff", opacity: 0.7 }}>
                      A: {s.changeA.title}
                    </span>
                    <span style={{ color: "#3b494b" }}>·</span>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "#6ffbbe", opacity: 0.7 }}>
                      B: {s.changeB.title}
                    </span>
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Load button */}
      {selected && (
        <div
          style={{
            borderTop: "1px solid rgba(0,240,255,0.1)",
            padding: "12px 16px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "12px",
            flexWrap: "wrap",
          }}
        >
          <p style={{ fontFamily: "var(--font-sans)", fontSize: "11px", color: "#849495", fontStyle: "italic" }}>
            Results are not predetermined — the semantic conflict engine generates them live.
          </p>
          <button
            onClick={() => { onLoadScenario(selected); setSelected(null); }}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "8px 16px",
              backgroundColor: "rgba(0,240,255,0.1)",
              border: "1px solid rgba(0,240,255,0.35)",
              borderRadius: "4px",
              fontFamily: "var(--font-mono)",
              fontSize: "11px",
              fontWeight: 700,
              letterSpacing: "0.08em",
              color: "#00f0ff",
              textTransform: "uppercase",
              cursor: "pointer",
              flexShrink: 0,
              transition: "background-color 0.15s",
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = "rgba(0,240,255,0.15)"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = "rgba(0,240,255,0.1)"; }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: "13px" }}>download</span>
            Load both panels
          </button>
        </div>
      )}
    </div>
  );
}
