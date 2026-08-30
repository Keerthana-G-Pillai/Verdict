"use client";
// ============================================================
// DemoScenarioSelector — shown on /analyze when Demo Mode active.
// Appears after the user selects a change type.
// Fills form fields via callbacks — does NOT submit anything.
// No verdict, no results, no hardcoded analysis output.
// ============================================================

import { useState } from "react";
import type { ChangeType } from "@/lib/analysis/types";
import { getScenariosForType } from "@/lib/demo-scenarios";
import type { DemoScenario } from "@/lib/demo-scenarios";

interface Props {
  changeType: ChangeType;
  onLoadScenario: (scenario: DemoScenario) => void;
}

export default function DemoScenarioSelector({ changeType, onLoadScenario }: Props) {
  const scenarios = getScenariosForType(changeType);
  const [selected, setSelected] = useState<DemoScenario | null>(null);
  const [expanded, setExpanded] = useState(false);

  if (scenarios.length === 0) return null;

  const handleSelect = (s: DemoScenario) => {
    setSelected(s);
    setExpanded(true);
  };

  const handleLoad = () => {
    if (!selected) return;
    onLoadScenario(selected);
    setExpanded(false);
    setSelected(null);
  };

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
            Demo Scenario
          </span>
        </div>
        <span
          style={{
            fontFamily: "var(--font-sans)",
            fontSize: "11px",
            color: "#849495",
          }}
        >
          Curated input · Analysis generated live by VERDICT
        </span>
      </div>

      {/* Scenario cards */}
      <div style={{ padding: "12px 16px", display: "flex", flexDirection: "column", gap: "8px" }}>
        {scenarios.map((s) => {
          const isSelected = selected?.id === s.id;
          return (
            <button
              key={s.id}
              onClick={() => handleSelect(s)}
              style={{
                width: "100%",
                textAlign: "left",
                padding: "12px 14px",
                borderRadius: "6px",
                border: `1px solid ${isSelected ? "rgba(0,240,255,0.4)" : "rgba(59,73,75,0.8)"}`,
                backgroundColor: isSelected ? "rgba(0,240,255,0.07)" : "rgba(20,20,22,0.8)",
                cursor: "pointer",
                transition: "border-color 0.15s, background-color 0.15s",
                display: "flex",
                alignItems: "flex-start",
                gap: "12px",
              }}
              onMouseEnter={(e) => {
                if (!isSelected) {
                  (e.currentTarget as HTMLElement).style.borderColor = "rgba(0,240,255,0.25)";
                  (e.currentTarget as HTMLElement).style.backgroundColor = "rgba(20,20,22,1)";
                }
              }}
              onMouseLeave={(e) => {
                if (!isSelected) {
                  (e.currentTarget as HTMLElement).style.borderColor = "rgba(59,73,75,0.8)";
                  (e.currentTarget as HTMLElement).style.backgroundColor = "rgba(20,20,22,0.8)";
                }
              }}
            >
              {/* Selected indicator */}
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
                    transition: "all 0.15s",
                  }}
                >
                  {isSelected && (
                    <div
                      style={{
                        width: "6px",
                        height: "6px",
                        borderRadius: "50%",
                        backgroundColor: "#00f0ff",
                      }}
                    />
                  )}
                </div>
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <p
                  style={{
                    fontFamily: "var(--font-sans)",
                    fontSize: "13px",
                    fontWeight: 600,
                    color: isSelected ? "#e5e2e3" : "#b9cacb",
                    marginBottom: "3px",
                  }}
                >
                  {s.title}
                </p>
                <p
                  style={{
                    fontFamily: "var(--font-sans)",
                    fontSize: "12px",
                    color: "#849495",
                    lineHeight: "1.4",
                  }}
                >
                  {s.description}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Expanded preview + load button */}
      {expanded && selected && (
        <div
          style={{
            borderTop: "1px solid rgba(0,240,255,0.1)",
            padding: "16px",
            display: "flex",
            flexDirection: "column",
            gap: "14px",
          }}
        >
          {/* What VERDICT will analyze */}
          <div>
            <p
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "10px",
                fontWeight: 700,
                letterSpacing: "0.1em",
                color: "#849495",
                textTransform: "uppercase",
                marginBottom: "8px",
              }}
            >
              VERDICT will investigate
            </p>
            <ul style={{ display: "flex", flexDirection: "column", gap: "5px", listStyle: "none", margin: 0, padding: 0 }}>
              {selected.previewBullets.map((b) => (
                <li
                  key={b}
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "8px",
                    fontFamily: "var(--font-sans)",
                    fontSize: "12px",
                    color: "#b9cacb",
                    lineHeight: "1.4",
                  }}
                >
                  <span
                    className="material-symbols-outlined"
                    style={{ fontSize: "13px", color: "#00f0ff", flexShrink: 0, marginTop: "1px" }}
                  >
                    arrow_right
                  </span>
                  {b}
                </li>
              ))}
            </ul>
          </div>

          {/* Content preview */}
          <div>
            <p
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "10px",
                fontWeight: 700,
                letterSpacing: "0.1em",
                color: "#849495",
                textTransform: "uppercase",
                marginBottom: "8px",
              }}
            >
              Input Preview
            </p>
            <div
              style={{
                backgroundColor: "#0e0e0f",
                border: "1px solid #2d2d30",
                borderRadius: "4px",
                padding: "12px",
                maxHeight: "140px",
                overflowY: "auto",
              }}
            >
              <pre
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "11px",
                  color: "#849495",
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                  margin: 0,
                  lineHeight: "1.6",
                }}
              >
                {selected.content.slice(0, 800)}{selected.content.length > 800 ? "\n…" : ""}
              </pre>
            </div>
          </div>

          {/* Disclaimer + Load button */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", flexWrap: "wrap" }}>
            <p
              style={{
                fontFamily: "var(--font-sans)",
                fontSize: "11px",
                color: "#849495",
                fontStyle: "italic",
              }}
            >
              Results are not predetermined — VERDICT generates them live.
            </p>
            <button
              onClick={handleLoad}
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
                transition: "background-color 0.15s, box-shadow 0.15s",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.backgroundColor = "rgba(0,240,255,0.15)";
                (e.currentTarget as HTMLElement).style.boxShadow = "0 0 12px rgba(0,240,255,0.2)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.backgroundColor = "rgba(0,240,255,0.1)";
                (e.currentTarget as HTMLElement).style.boxShadow = "none";
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: "13px" }}>download</span>
              Load into form
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
