"use client";

import { useEffect } from "react";
import Link from "next/link";
import WebGLShader from "@/components/intelligence/WebGLShader";

const PIPELINE_NODES = [
  { icon: "code", label: "PROPOSED", color: "border-outline-variant", textColor: "text-on-surface-variant", lineColor: "#00f0ff", delay: "0s" },
  { icon: "troubleshoot", label: "ANALYZE", color: "border-primary-container", textColor: "text-primary-container", lineColor: "#6ffbbe", delay: "0.5s" },
  { icon: "gavel", label: "CHALLENGE", color: "border-secondary-fixed", textColor: "text-secondary-fixed", lineColor: "#ffb95f", delay: "1s" },
  { icon: "hub", label: "SIMULATE", color: "border-tertiary-fixed-dim", textColor: "text-tertiary-fixed-dim", lineColor: "#00f0ff", delay: "1.5s" },
];

const CAPABILITY_CARDS = [
  {
    id: "understand",
    tag: "Understand",
    tagIcon: "visibility",
    tagColor: "text-primary-container",
    title: "Analyze what a change touches.",
    body: "Map the blast radius before deployment. Our intelligence engine traces dependencies across microservices, databases, and infrastructure as code to identify every downstream system affected.",
    code: [
      { color: "text-primary-fixed-dim", text: "Scanning dependency graph..." },
      { color: "text-on-surface-variant", text: "Found 4 downstream services impacted." },
    ],
    bgIcon: "account_tree",
    colSpan: "lg:col-span-8",
  },
  {
    id: "validate",
    tag: "Validate",
    tagIcon: "flaky",
    tagColor: "text-secondary-fixed",
    title: "Challenge assumptions.",
    body: "Detect hidden risks and architectural regressions autonomously. AI agents review code changes against architectural guidelines and historical failure patterns.",
    bgIcon: "rule",
    colSpan: "lg:col-span-4",
  },
];

export default function LandingHero() {
  // Scroll-reveal observer
  useEffect(() => {
    const reveals = document.querySelectorAll(".reveal-on-scroll");
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -50px 0px" }
    );
    reveals.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <>
      {/* ── HERO ── */}
      <section className="relative min-h-screen flex items-center justify-center pt-16 overflow-hidden">
        {/* WebGL background */}
        <div className="absolute inset-0 z-0">
          <WebGLShader className="absolute inset-0" opacity={0.6} />
        </div>

        {/* Overlay gradient — fades shader into content below */}
        <div
          className="absolute inset-0 z-10 pointer-events-none"
          style={{
            background: "linear-gradient(to bottom, transparent 0%, rgba(19,19,20,0.5) 60%, #131314 100%)",
          }}
        />

        {/* Hero content */}
        <div className="relative z-20 max-w-5xl mx-auto px-margin-mobile md:px-margin-desktop text-center flex flex-col items-center">
          {/* Live badge */}
          <div
            className="inline-flex items-center gap-2 px-3 py-1 mb-8 rounded-full border border-surface-variant animate-fade-in-up"
            style={{
              animationDelay: "0.1s",
              opacity: 0,
              backgroundColor: "rgba(32,31,32,0.5)",
              backdropFilter: "blur(4px)",
            }}
          >
            <span
              className="w-2 h-2 rounded-full bg-primary-container"
              style={{ boxShadow: "0 0 8px rgba(0,240,255,0.8)" }}
            />
            <span className="text-label-mono text-on-surface-variant tracking-wider uppercase">
              Verdict v2.0 Live
            </span>
          </div>

          {/* Headline */}
          <h1
            className="text-display-lg font-bold text-on-surface mb-6 max-w-4xl tracking-tight animate-fade-in-up"
            style={{ animationDelay: "0.2s", opacity: 0 }}
          >
            Know the consequences before you make the{" "}
            <span style={{ color: "#00f0ff" }}>change.</span>
          </h1>

          {/* Subtitle */}
          <p
            className="text-body-lg text-on-surface-variant mb-10 max-w-2xl mx-auto animate-fade-in-up"
            style={{ animationDelay: "0.3s", opacity: 0 }}
          >
            VERDICT uses AI-powered change intelligence to statically analyze, challenge, and semantically validate engineering changes before they reach production.
          </p>

          {/* CTAs */}
          <div
            className="flex flex-col sm:flex-row items-center gap-4 animate-fade-in-up"
            style={{ animationDelay: "0.4s", opacity: 0 }}
          >
            {/* One-click demo — loads the signature auth-conflict scenario and auto-submits */}
            <Link
              href="/analyze?demo=auth-conflict"
              className="w-full sm:w-auto px-8 py-3 bg-primary-container text-on-primary-container text-body-md font-bold rounded hover:bg-primary-fixed-dim transition-colors"
              style={{
                boxShadow: "0 0 15px rgba(0,240,255,0.3)",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.boxShadow = "0 0 25px rgba(0,240,255,0.5)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.boxShadow = "0 0 15px rgba(0,240,255,0.3)";
              }}
            >
              See VERDICT in Action →
            </Link>
            <Link
              href="/analyze"
              className="w-full sm:w-auto px-8 py-3 bg-transparent text-on-surface border border-outline-variant text-body-md rounded hover:bg-surface-container-high transition-colors"
            >
              Analyze a Change
            </Link>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-2 animate-bounce opacity-50">
          <span className="text-label-mono text-on-surface-variant uppercase" style={{ fontSize: "10px" }}>
            Scroll
          </span>
          <span className="material-symbols-outlined text-on-surface-variant text-sm">
            arrow_downward
          </span>
        </div>
      </section>

      {/* ── PIPELINE FLOW ── */}
      <section
        id="platform"
        className="relative py-24 z-20 border-t border-outline-variant"
        style={{ backgroundColor: "var(--color-surface)" }}
      >
        <div className="max-w-7xl mx-auto px-margin-mobile md:px-margin-desktop">
          <div className="text-center mb-16 reveal-on-scroll">
            <h2 className="text-headline-lg font-semibold text-on-surface mb-4">
              The Change Pipeline
            </h2>
            <p className="text-body-md text-on-surface-variant max-w-2xl mx-auto">
              From proposed commit to final verdict, trace the intelligence flow.
            </p>
          </div>

          {/* Flow diagram */}
          <div className="relative h-64 md:h-80 w-full glass-panel rounded-lg flex items-center justify-center p-8 reveal-on-scroll glow-border overflow-hidden group">
            <div className="absolute inset-0 grid-bg opacity-30" />
            <div className="relative w-full max-w-4xl flex flex-col md:flex-row items-center justify-between gap-4 md:gap-2 z-10">
              {PIPELINE_NODES.map((node, i) => (
                <div key={node.label} className="contents">
                  {/* Node */}
                  <div className="flex flex-col items-center gap-2 group/node">
                    <div
                      className={`w-12 h-12 rounded-full border-2 ${node.color} bg-surface flex items-center justify-center transition-all duration-300`}
                      style={
                        i > 0
                          ? { boxShadow: `0 0 15px ${node.lineColor}33` }
                          : undefined
                      }
                    >
                      <span className={`material-symbols-outlined ${node.textColor} text-xl`}>
                        {node.icon}
                      </span>
                    </div>
                    <span className={`text-label-mono ${node.textColor} uppercase tracking-wider`}>
                      {node.label}
                    </span>
                  </div>

                  {/* Connector line */}
                  {i < PIPELINE_NODES.length - 1 && (
                    <div className="hidden md:block flex-1 h-[1px] bg-outline-variant relative overflow-hidden">
                      <div
                        className="absolute top-0 left-0 h-full w-1/3 -translate-x-full"
                        style={{
                          backgroundColor: node.lineColor,
                          opacity: 0.5,
                          boxShadow: `0 0 8px ${node.lineColor}cc`,
                          animation: `flowRight 3s linear infinite`,
                          animationDelay: node.delay,
                        }}
                      />
                    </div>
                  )}
                </div>
              ))}

              {/* Final VERDICT node */}
              <div className="flex flex-col items-center gap-2">
                <div
                  className="w-16 h-16 rounded-lg border-2 border-primary-container bg-surface-container flex items-center justify-center"
                  style={{ boxShadow: "0 0 20px rgba(0,240,255,0.4)" }}
                >
                  <svg width="28" height="28" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                    <path d="M4 3L10 14L16 3" stroke="#00f0ff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M7.5 3L10 8L12.5 3" stroke="#00f0ff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    <circle cx="10" cy="16.5" r="1.5" fill="#00f0ff" />
                  </svg>
                </div>
                <span className="text-label-mono text-primary-container font-bold tracking-widest uppercase">
                  VERDICT
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── CAPABILITIES BENTO GRID ── */}
      <section id="solutions" className="py-24 z-20" style={{ backgroundColor: "var(--color-background)" }}>
        <div className="max-w-7xl mx-auto px-margin-mobile md:px-margin-desktop">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-lg auto-rows-min">

            {/* UNDERSTAND — spans 8 cols */}
            <div className="md:col-span-12 lg:col-span-8 glass-panel rounded-lg p-8 flex flex-col md:flex-row gap-8 items-start reveal-on-scroll relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
                <span className="material-symbols-outlined" style={{ fontSize: "9rem" }}>account_tree</span>
              </div>
              <div className="flex-1 z-10">
                <div className="inline-flex items-center gap-2 mb-4">
                  <span className="material-symbols-outlined text-primary-container text-sm">visibility</span>
                  <h3 className="text-label-mono text-primary-container uppercase tracking-wider">Understand</h3>
                </div>
                <h4 className="text-headline-md font-semibold text-on-surface mb-3">
                  Analyze what a change touches.
                </h4>
                <p className="text-body-md text-on-surface-variant mb-6">
                  Map the blast radius before deployment. Our intelligence engine traces dependencies across microservices, databases, and infrastructure as code to identify every downstream system affected.
                </p>
                <div className="text-code-sm text-on-surface-variant bg-surface-container-low p-4 rounded border border-surface-variant flex flex-col gap-2">
                  <div className="flex items-center gap-2 text-primary-fixed-dim">
                    <span className="material-symbols-outlined text-[14px]">arrow_right</span>
                    <span>Scanning dependency graph...</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[14px] text-surface-variant">arrow_right</span>
                    <span>Found 4 downstream services impacted.</span>
                  </div>
                </div>
              </div>
            </div>

            {/* VALIDATE — spans 4 cols */}
            <div className="md:col-span-12 lg:col-span-4 glass-panel rounded-lg p-8 flex flex-col items-start reveal-on-scroll relative overflow-hidden">
              <div className="absolute -bottom-10 -right-10 opacity-10 pointer-events-none">
                <span className="material-symbols-outlined" style={{ fontSize: "9rem" }}>rule</span>
              </div>
              <div className="z-10 flex-1 flex flex-col">
                <div className="inline-flex items-center gap-2 mb-4">
                  <span className="material-symbols-outlined text-secondary-fixed text-sm">flaky</span>
                  <h3 className="text-label-mono text-secondary-fixed uppercase tracking-wider">Validate</h3>
                </div>
                <h4 className="text-headline-md font-semibold text-on-surface mb-3">
                  Challenge assumptions.
                </h4>
                <p className="text-body-md text-on-surface-variant mb-6 flex-1">
                  Detect hidden risks and architectural regressions autonomously. AI agents review code changes against architectural guidelines and historical failure patterns.
                </p>
                <Link
                  href="/analyze"
                  className="text-secondary-fixed hover:text-on-surface transition-colors text-label-mono uppercase tracking-wider flex items-center gap-2 mt-auto"
                >
                  Start Analysis
                  <span className="material-symbols-outlined text-sm">arrow_forward</span>
                </Link>
              </div>
            </div>

            {/* SIMULATE — full width */}
            <div className="md:col-span-12 glass-panel rounded-lg p-8 flex flex-col md:flex-row-reverse gap-8 items-center reveal-on-scroll glow-border relative overflow-hidden">
              <div className="absolute top-1/2 left-0 -translate-y-1/2 -translate-x-1/4 opacity-5 pointer-events-none">
                <span className="material-symbols-outlined" style={{ fontSize: "20rem" }}>science</span>
              </div>
              <div className="flex-1 z-10 w-full">
                <div className="inline-flex items-center gap-2 mb-4">
                  <span className="material-symbols-outlined text-tertiary-fixed-dim text-sm">science</span>
                  <h3 className="text-label-mono text-tertiary-fixed-dim uppercase tracking-wider">Simulate</h3>
                </div>
                <h4 className="text-headline-md font-semibold text-on-surface mb-3">
                   Detect whether changes safely coexist.
                </h4>
                <p className="text-body-md text-on-surface-variant mb-6">
                   Perform deep semantic analysis on two changes simultaneously. Compare behavioral assumptions for conflicts that Git cannot detect — then get an evidence-based recommendation.
                </p>
                <Link
                  href="/simulate"
                  className="inline-flex items-center gap-2 px-6 py-2.5 bg-transparent border border-tertiary-fixed-dim text-tertiary-fixed-dim text-label-mono uppercase tracking-wider rounded hover:bg-surface-container-high transition-colors"
                >
                  Run Merge Simulation
                  <span className="material-symbols-outlined text-sm">arrow_forward</span>
                </Link>
              </div>

              {/* Decorative simulation timeline */}
              <div className="flex-1 w-full bg-surface-container-lowest border border-surface-variant rounded flex flex-col p-4 relative z-10 h-48 overflow-hidden">
                <div className="flex items-center justify-between mb-4 pb-2 border-b border-surface-variant">
                  <span className="text-label-mono text-on-surface">Simulation Timeline</span>
                  <span className="text-label-mono text-primary-container animate-pulse">Running...</span>
                </div>
                <div className="relative flex-1 flex flex-col justify-around">
                  <div className="progress-track">
                    <div
                      className="h-full rounded-full relative"
                      style={{ width: "85%", backgroundColor: "#6ffbbe" }}
                    >
                      <div
                        className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full"
                        style={{ backgroundColor: "#6ffbbe", boxShadow: "0 0 5px #4edea3" }}
                      />
                    </div>
                  </div>
                  <div className="progress-track">
                    <div
                      className="h-full rounded-full relative animate-pulse"
                      style={{ width: "45%", backgroundColor: "#00f0ff" }}
                    >
                      <div
                        className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full"
                        style={{ backgroundColor: "#00f0ff", boxShadow: "0 0 5px #00f0ff" }}
                      />
                    </div>
                  </div>
                  <div className="progress-track">
                    <div className="h-full w-[10%] rounded-full bg-surface-variant" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer
        className="border-t border-outline-variant py-12 z-20 relative"
        style={{ backgroundColor: "var(--color-surface-container-lowest)" }}
      >
        <div className="max-w-7xl mx-auto px-margin-mobile md:px-margin-desktop flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-sm">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="opacity-50" aria-hidden="true">
              <path d="M4 3L10 14L16 3" stroke="#849495" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M7.5 3L10 8L12.5 3" stroke="#849495" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              <circle cx="10" cy="16.5" r="1.5" fill="#849495" />
            </svg>
            <span className="text-label-mono text-on-surface-variant">© 2024 Verdict Systems</span>
          </div>
          <div className="flex gap-md">
            {["Privacy", "Terms", "Status"].map((label) => (
              <a key={label} href="#" className="text-label-mono text-on-surface-variant hover:text-on-surface transition-colors">
                {label}
              </a>
            ))}
          </div>
        </div>
      </footer>
    </>
  );
}
