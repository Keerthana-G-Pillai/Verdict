"use client";

import { Suspense, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import AppShell from "@/components/layout/AppShell";
import ChangeTypeSelector, { CHANGE_TYPES } from "@/components/analysis/ChangeTypeSelector";
import type { ChangeType, AnalysisInput } from "@/lib/analysis/types";
import { nanoid } from "@/lib/analysis/nanoid";
import { useAnalysisStore } from "@/store/analysis-store";

const LANGUAGES = [
  "TypeScript", "JavaScript", "Python", "Java", "Go", "Rust", "C#",
  "Ruby", "PHP", "Swift", "Kotlin", "C++", "SQL", "Other",
];

function AnalyzeInputInner() {
  const router = useRouter();
  const saveAnalysis = useAnalysisStore((s) => s.saveAnalysis);

  const [changeType, setChangeType] = useState<ChangeType>("code");
  const [title, setTitle] = useState("");
  const [language, setLanguage] = useState("");
  const [content, setContent] = useState("");
  const [description, setDescription] = useState("");
  const [projectContext, setProjectContext] = useState("");
  const [fileContext, setFileContext] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const currentTypeConfig = CHANGE_TYPES.find((t) => t.id === changeType)!;

  const handleSubmit = useCallback(async () => {
    if (!content.trim() || content.trim().length < 10) {
      setError("Please provide at least 10 characters of change content.");
      return;
    }
    setError("");
    setLoading(true);

    const input: AnalysisInput = {
      id: nanoid(),
      title: title.trim() || `${currentTypeConfig.label} — ${new Date().toLocaleDateString()}`,
      changeType,
      language: language || undefined,
      content: content.trim(),
      description: description.trim() || undefined,
      projectContext: projectContext.trim() || undefined,
      fileContext: fileContext.trim() || undefined,
      createdAt: new Date().toISOString(),
    };

    saveAnalysis({
      id: input.id, input, stages: [], events: [],
      context: { summary: "", changeType, detectedDomain: "", affectedAreas: [], dependencies: [], scope: "moderate" },
      riskFindings: [], safetyFindings: [], simulationResults: [], evidence: [],
      riskScore: 0, confidence: 0, criticalCount: 0, highCount: 0, mediumCount: 0, lowCount: 0,
      verdict: "approved", verdictRationale: "", conditions: [], recommendations: [],
      analyzedAt: "", analyzerVersion: "", executionMs: 0,
    } as import("@/lib/analysis/types").AnalysisResult);

    router.push(`/analyze/${input.id}`);
  }, [changeType, content, description, fileContext, language, projectContext, title, currentTypeConfig, saveAnalysis, router]);

  return (
    <AppShell>
      <div className="flex-1 flex flex-col min-h-screen pt-lg px-margin-desktop pb-xl">
        {/* Header */}
        <header className="mb-xl">
          <div className="flex items-center gap-sm text-label-mono text-on-surface-variant mb-sm">
            <Link href="/dashboard" className="inline-flex items-center gap-1 hover:text-on-surface transition-colors">
              <span className="material-symbols-outlined text-[14px]">home</span>
              Dashboard
            </Link>
            <span>/</span>
            <span className="text-on-surface">New Analysis</span>
          </div>
          <h1 className="text-headline-lg font-bold text-on-surface tracking-tight">What are you changing?</h1>
          <p className="text-body-md text-on-surface-variant mt-sm max-w-2xl">
            Submit a proposed change. VERDICT will analyze risks, validate safety, and issue an evidence-based decision.
          </p>
        </header>

        <div className="flex flex-col gap-xl max-w-4xl">
          {/* Change type selector */}
          <div>
            <label className="block text-label-mono text-on-surface-variant uppercase tracking-wider mb-sm">Change Type</label>
            <ChangeTypeSelector selected={changeType} onChange={setChangeType} />
          </div>

          {/* Title */}
          <div>
            <label className="block text-label-mono text-on-surface-variant uppercase tracking-wider mb-sm">
              Title <span className="text-outline normal-case tracking-normal">— optional</span>
            </label>
            <input
              type="text" value={title} onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Increase payment retry attempts from 3 to 5"
              className="input-base w-full px-4 py-3"
            />
          </div>

          {/* Language */}
          {(changeType === "code" || changeType === "diff") && (
            <div>
              <label className="block text-label-mono text-on-surface-variant uppercase tracking-wider mb-sm">
                Language <span className="text-outline normal-case tracking-normal">— optional</span>
              </label>
              <select value={language} onChange={(e) => setLanguage(e.target.value)} className="input-base px-4 py-3 w-full max-w-xs">
                <option value="">Auto-detect</option>
                {LANGUAGES.map((l) => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
          )}

          {/* Project context */}
          {(changeType === "diff" || changeType === "pr") && (
            <div>
              <label className="block text-label-mono text-on-surface-variant uppercase tracking-wider mb-sm">
                Repository / Service Context <span className="text-outline normal-case tracking-normal">— optional</span>
              </label>
              <input type="text" value={projectContext} onChange={(e) => setProjectContext(e.target.value)}
                placeholder="e.g. payment-service, auth-api" className="input-base w-full px-4 py-3" />
            </div>
          )}

          {/* File context */}
          <div>
            <label className="block text-label-mono text-on-surface-variant uppercase tracking-wider mb-sm">
              File / Path Context <span className="text-outline normal-case tracking-normal">— optional</span>
            </label>
            <input type="text" value={fileContext} onChange={(e) => setFileContext(e.target.value)}
              placeholder="e.g. src/auth/middleware.ts, lib/payments/retry.js"
              className="input-base w-full px-4 py-3" />
            <p className="mt-1 text-label-mono text-on-surface-variant" style={{ fontSize: "11px" }}>
              Helps agents understand which files are affected and their surrounding context.
            </p>
          </div>

          {/* Main content */}
          <div>
            <div className="flex items-center justify-between mb-sm">
              <label className="block text-label-mono text-on-surface-variant uppercase tracking-wider">
                {currentTypeConfig.contentLabel} <span className="text-error ml-1">*</span>
              </label>
              <span className="text-label-mono text-on-surface-variant">
                {content.length > 0 && `${content.length} chars`}
              </span>
            </div>
            <textarea
              value={content}
              onChange={(e) => { setContent(e.target.value); if (error) setError(""); }}
              placeholder={currentTypeConfig.placeholder}
              rows={changeType === "decision" ? 8 : 14}
              className={`input-base w-full px-4 py-3 resize-none text-code-sm leading-relaxed ${error ? "border-error" : ""}`}
              style={{ fontFamily: changeType === "decision" ? "var(--font-sans)" : "var(--font-mono)" }}
            />
            {error && (
              <p className="mt-2 text-label-mono text-error flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]">error</span>{error}
              </p>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-label-mono text-on-surface-variant uppercase tracking-wider mb-sm">
              Additional Context <span className="text-outline normal-case tracking-normal">— optional</span>
            </label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)}
              placeholder="Why are you making this change? What problem does it solve?"
              rows={3} className="input-base w-full px-4 py-3 resize-none text-body-md" />
          </div>

          {/* Submit */}
          <div className="flex items-center gap-md">
            <button
              onClick={handleSubmit} disabled={loading}
              className="inline-flex items-center gap-sm px-8 py-3 bg-primary-container text-on-primary-fixed-variant text-body-md font-bold rounded hover:bg-primary-fixed-dim transition-colors disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
              style={{ boxShadow: "0 0 15px rgba(0,240,255,0.3)" }}
            >
              {loading ? (
                <><span className="material-symbols-outlined text-[18px] animate-spin">progress_activity</span>Starting Analysis…</>
              ) : (
                <><span className="material-symbols-outlined text-[18px]">play_arrow</span>Run VERDICT →</>
              )}
            </button>
            <p className="text-label-mono text-on-surface-variant">Analysis typically takes 5–15 seconds</p>
          </div>
        </div>
      </div>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </AppShell>
  );
}

export default function AnalyzeInputPage() {
  return (
    <Suspense>
      <AnalyzeInputInner />
    </Suspense>
  );
}
