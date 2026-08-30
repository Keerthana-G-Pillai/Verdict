"use client";

import { useState, useEffect, useCallback } from "react";
import AppShell from "@/components/layout/AppShell";

// ── Types ─────────────────────────────────────────────────────

interface ProviderStatus {
  name: string;
  label: string;
  available: boolean;
  reason: string;
}

interface StatusResponse {
  activeProvider: string;
  anyAI: boolean;
  providers: ProviderStatus[];
  models: Record<string, string>;
}

// ── Sub-components ────────────────────────────────────────────

function SectionHeader({ icon, title, subtitle }: { icon: string; title: string; subtitle: string }) {
  return (
    <div className="flex items-start gap-4 mb-6">
      <div
        className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{ backgroundColor: "var(--color-surface-container-low)", border: "1px solid #2d2d30" }}
      >
        <span className="material-symbols-outlined text-[20px]" style={{ color: "var(--color-primary)" }}>
          {icon}
        </span>
      </div>
      <div>
        <h2 className="text-body-lg font-semibold text-on-surface">{title}</h2>
        <p className="text-body-sm text-on-surface-variant mt-0.5">{subtitle}</p>
      </div>
    </div>
  );
}

function ProviderRow({
  provider,
  model,
  isActive,
}: {
  provider: ProviderStatus;
  model?: string;
  isActive: boolean;
}) {
  const isPrimary = provider.name === "watsonx";
  const isFallback = provider.name === "fallback";

  return (
    <div
      className="flex items-center gap-4 px-4 py-3 rounded-lg transition-colors"
      style={{
        backgroundColor: provider.available
          ? "var(--color-surface-container)"
          : "var(--color-surface-container-low)",
        border: `1px solid ${isActive ? "var(--color-primary)" : "#2d2d30"}`,
        opacity: provider.available ? 1 : 0.6,
      }}
    >
      {/* Status dot */}
      <div
        className="w-2 h-2 rounded-full flex-shrink-0"
        style={{
          backgroundColor: provider.available
            ? isFallback
              ? "#6b7280"
              : "var(--color-primary)"
            : "#ef4444",
          boxShadow: provider.available && !isFallback
            ? "0 0 6px var(--color-primary)"
            : "none",
        }}
      />

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-body-sm font-medium text-on-surface">{provider.label}</span>
          {isPrimary && (
            <span
              className="text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider"
              style={{
                backgroundColor: "rgba(0,240,255,0.1)",
                color: "var(--color-primary)",
                border: "1px solid rgba(0,240,255,0.2)",
              }}
            >
              Primary
            </span>
          )}
          {isActive && (
            <span
              className="text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider"
              style={{
                backgroundColor: "rgba(0,240,255,0.15)",
                color: "var(--color-primary)",
                border: "1px solid rgba(0,240,255,0.3)",
              }}
            >
              Active
            </span>
          )}
          {isFallback && (
            <span
              className="text-[10px] px-1.5 py-0.5 rounded uppercase tracking-wider"
              style={{
                backgroundColor: "rgba(107,114,128,0.15)",
                color: "#9ca3af",
                border: "1px solid rgba(107,114,128,0.2)",
              }}
            >
              Always On
            </span>
          )}
        </div>
        <p className="text-body-xs text-on-surface-variant mt-0.5">{provider.reason}</p>
        {model && provider.available && !isFallback && (
          <p className="text-label-mono text-on-surface-variant mt-0.5 opacity-70">
            model: {model}
          </p>
        )}
      </div>

      {/* Status label */}
      <span
        className="text-label-mono text-[11px] flex-shrink-0"
        style={{ color: provider.available ? "var(--color-primary)" : "#6b7280" }}
      >
        {provider.available ? (isFallback ? "READY" : "ONLINE") : "OFFLINE"}
      </span>
    </div>
  );
}

function EnvVarRow({ name, description, example }: { name: string; description: string; example: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(`${name}=`).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }, [name]);

  return (
    <div
      className="px-4 py-3 rounded-lg"
      style={{
        backgroundColor: "var(--color-surface-container-low)",
        border: "1px solid #2d2d30",
      }}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <code
              className="text-label-mono text-[12px] px-2 py-0.5 rounded"
              style={{
                backgroundColor: "var(--color-surface-container-high)",
                color: "var(--color-primary)",
                border: "1px solid #2d2d30",
              }}
            >
              {name}
            </code>
          </div>
          <p className="text-body-xs text-on-surface-variant mt-1.5">{description}</p>
          <p className="text-label-mono text-[11px] mt-1 opacity-50">e.g. {example}</p>
        </div>
        <button
          onClick={handleCopy}
          className="flex-shrink-0 flex items-center gap-1.5 px-2.5 py-1 rounded text-[11px] transition-all"
          style={{
            backgroundColor: copied ? "rgba(0,240,255,0.1)" : "var(--color-surface-container)",
            color: copied ? "var(--color-primary)" : "var(--color-on-surface-variant)",
            border: "1px solid #2d2d30",
          }}
          title="Copy variable name"
        >
          <span className="material-symbols-outlined text-[14px]">
            {copied ? "check" : "content_copy"}
          </span>
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────

export default function SettingsPage() {
  const [status, setStatus] = useState<StatusResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const fetchStatus = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const res = await fetch("/api/status");
      if (!res.ok) throw new Error("Status check failed");
      const data: StatusResponse = await res.json();
      setStatus(data);
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not reach status endpoint");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  const activeProvider = status?.activeProvider === "auto"
    ? status.providers.find((p) => p.available && p.name !== "fallback")?.name ?? "fallback"
    : status?.activeProvider ?? "fallback";

  return (
    <AppShell>
      <div className="flex-1 overflow-auto">
        <div className="max-w-3xl mx-auto px-6 py-10">

          {/* Page header */}
          <div className="mb-10">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-headline-lg font-semibold text-on-surface">Settings</h1>
                <p className="text-body-md text-on-surface-variant mt-1">
                  Configure AI providers, API keys, and system preferences.
                </p>
              </div>
              <button
                onClick={() => fetchStatus(true)}
                disabled={refreshing}
                className="flex items-center gap-2 px-3 py-1.5 rounded text-body-sm transition-colors"
                style={{
                  backgroundColor: "var(--color-surface-container)",
                  color: "var(--color-on-surface-variant)",
                  border: "1px solid #2d2d30",
                  opacity: refreshing ? 0.6 : 1,
                }}
              >
                <span
                  className="material-symbols-outlined text-[16px]"
                  style={{ animation: refreshing ? "spin 1s linear infinite" : "none" }}
                >
                  refresh
                </span>
                Refresh
              </button>
            </div>

            {/* Overall AI status banner */}
            {!loading && status && (
              <div
                className="mt-4 flex items-center gap-3 px-4 py-3 rounded-lg"
                style={{
                  backgroundColor: status.anyAI
                    ? "rgba(0,240,255,0.06)"
                    : "rgba(239,68,68,0.06)",
                  border: `1px solid ${status.anyAI ? "rgba(0,240,255,0.2)" : "rgba(239,68,68,0.2)"}`,
                }}
              >
                <span
                  className="material-symbols-outlined text-[20px]"
                  style={{ color: status.anyAI ? "var(--color-primary)" : "#ef4444" }}
                >
                  {status.anyAI ? "smart_toy" : "warning"}
                </span>
                <div>
                  <p
                    className="text-body-sm font-medium"
                    style={{ color: status.anyAI ? "var(--color-primary)" : "#ef4444" }}
                  >
                    {status.anyAI
                      ? `AI-powered analysis active — running on ${
                          activeProvider === "watsonx"
                            ? "IBM watsonx Granite 3.3"
                            : activeProvider === "groq"
                            ? "Groq Llama 3.1"
                            : "OpenRouter"
                        }`
                      : "No AI provider configured — using deterministic fallback"}
                  </p>
                  <p className="text-body-xs text-on-surface-variant mt-0.5">
                    {status.anyAI
                      ? `Provider override: ${status.activeProvider === "auto" ? "auto-detect (recommended)" : status.activeProvider}`
                      : "Add an API key to .env.local to enable AI-powered analysis"}
                  </p>
                </div>
              </div>
            )}

            {loading && (
              <div
                className="mt-4 flex items-center gap-3 px-4 py-3 rounded-lg"
                style={{
                  backgroundColor: "var(--color-surface-container-low)",
                  border: "1px solid #2d2d30",
                }}
              >
                <div className="w-4 h-4 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: "var(--color-primary)", borderTopColor: "transparent" }} />
                <span className="text-body-sm text-on-surface-variant">Checking provider status…</span>
              </div>
            )}

            {error && (
              <div
                className="mt-4 flex items-center gap-3 px-4 py-3 rounded-lg"
                style={{
                  backgroundColor: "rgba(239,68,68,0.06)",
                  border: "1px solid rgba(239,68,68,0.2)",
                }}
              >
                <span className="material-symbols-outlined text-[18px]" style={{ color: "#ef4444" }}>error</span>
                <span className="text-body-sm" style={{ color: "#ef4444" }}>{error}</span>
              </div>
            )}
          </div>

          {/* ── Section 1: AI Providers ── */}
          <div
            className="p-6 rounded-xl mb-8"
            style={{
              backgroundColor: "var(--color-surface-container-low)",
              border: "1px solid #2d2d30",
            }}
          >
            <SectionHeader
              icon="smart_toy"
              title="AI Providers"
              subtitle="VERDICT uses a priority chain: watsonx → Groq → OpenRouter → Deterministic fallback."
            />

            {loading ? (
              <div className="space-y-2">
                {[0, 1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="h-14 rounded-lg animate-pulse"
                    style={{ backgroundColor: "var(--color-surface-container)" }}
                  />
                ))}
              </div>
            ) : status ? (
              <div className="space-y-2">
                {status.providers.map((p) => (
                  <ProviderRow
                    key={p.name}
                    provider={p}
                    model={status.models[p.name]}
                    isActive={activeProvider === p.name}
                  />
                ))}
              </div>
            ) : null}
          </div>

          {/* ── Section 2: Environment Variables ── */}
          <div
            className="p-6 rounded-xl mb-8"
            style={{
              backgroundColor: "var(--color-surface-container-low)",
              border: "1px solid #2d2d30",
            }}
          >
            <SectionHeader
              icon="key"
              title="API Key Configuration"
              subtitle="Set these variables in your .env.local file. Never commit API keys to source control."
            />

            <div
              className="flex items-start gap-3 px-4 py-3 rounded-lg mb-5"
              style={{
                backgroundColor: "rgba(0,240,255,0.04)",
                border: "1px solid rgba(0,240,255,0.12)",
              }}
            >
              <span className="material-symbols-outlined text-[18px] flex-shrink-0 mt-0.5" style={{ color: "var(--color-primary)" }}>
                info
              </span>
              <div className="text-body-xs text-on-surface-variant leading-relaxed">
                <p>
                  Create a <code className="text-label-mono bg-surface-container-high px-1 rounded">.env.local</code> file at the project root (copy from{" "}
                  <code className="text-label-mono bg-surface-container-high px-1 rounded">.env.example</code>) and add your keys.
                  The server reads them at startup — restart the dev server after changes.
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-label-mono text-[11px] text-on-surface-variant uppercase tracking-wider mb-3">
                IBM watsonx (Primary — highest hackathon scoring weight)
              </p>
              <EnvVarRow
                name="WATSONX_API_KEY"
                description="IBM Cloud API key for watsonx.ai. Create one at cloud.ibm.com → Manage → Access → API keys."
                example="abc123xyz..."
              />
              <EnvVarRow
                name="WATSONX_PROJECT_ID"
                description="The watsonx.ai project ID. Found in your watsonx project settings at dataplatform.cloud.ibm.com."
                example="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
              />
              <EnvVarRow
                name="WATSONX_URL"
                description="Regional endpoint (optional). Defaults to us-south."
                example="https://us-south.ml.cloud.ibm.com"
              />

              <p className="text-label-mono text-[11px] text-on-surface-variant uppercase tracking-wider mt-5 mb-3">
                Groq (Free fallback — no credit card required)
              </p>
              <EnvVarRow
                name="GROQ_API_KEY"
                description="Groq Cloud API key. Free tier available at console.groq.com."
                example="gsk_..."
              />

              <p className="text-label-mono text-[11px] text-on-surface-variant uppercase tracking-wider mt-5 mb-3">
                OpenRouter (Free fallback — free model tier)
              </p>
              <EnvVarRow
                name="OPENROUTER_API_KEY"
                description="OpenRouter API key. Free model access at openrouter.ai."
                example="sk-or-v1-..."
              />

              <p className="text-label-mono text-[11px] text-on-surface-variant uppercase tracking-wider mt-5 mb-3">
                Provider override (optional)
              </p>
              <EnvVarRow
                name="AI_PROVIDER"
                description='Force a specific provider instead of auto-detection. Options: "watsonx", "groq", "openrouter", "fallback". Leave empty for auto.'
                example="watsonx"
              />
            </div>
          </div>

          {/* ── Section 3: Architecture info ── */}
          <div
            className="p-6 rounded-xl mb-8"
            style={{
              backgroundColor: "var(--color-surface-container-low)",
              border: "1px solid #2d2d30",
            }}
          >
            <SectionHeader
              icon="account_tree"
              title="Multi-Agent Architecture"
              subtitle="VERDICT uses four independent AI agents in an adversarial pipeline."
            />

            <div className="space-y-3">
              {[
                {
                  step: "01",
                  name: "Risk Intelligence",
                  color: "#ef4444",
                  description:
                    "Adversarial agent. Exclusively searches for bugs, security risks, regressions, and downstream consequences. Never sees the Safety agent's output.",
                },
                {
                  step: "02",
                  name: "Safety Validation",
                  color: "var(--color-primary)",
                  description:
                    "Adversarial agent. Exclusively identifies evidence the change is safe: test coverage, scope boundaries, compatibility signals. Never sees the Risk agent's output.",
                },
                {
                  step: "03",
                  name: "Validation Engine",
                  color: "#f59e0b",
                  description:
                    "Static analysis only. Produces EXECUTION_EVIDENCE, STATIC_ANALYSIS, INFERRED_RISK, or NOT_EXECUTABLE evidence. Never fabricates test results.",
                },
                {
                  step: "04",
                  name: "Decision Engine (Judge)",
                  color: "#8b5cf6",
                  description:
                    "Synthesizes all adversarial evidence. Issues APPROVED, APPROVED WITH CONDITIONS, or REQUIRES REVISION. Cannot override deterministic scoring thresholds.",
                },
              ].map((agent) => (
                <div
                  key={agent.step}
                  className="flex items-start gap-4 px-4 py-3 rounded-lg"
                  style={{
                    backgroundColor: "var(--color-surface-container)",
                    border: "1px solid #2d2d30",
                  }}
                >
                  <div
                    className="w-8 h-8 rounded flex items-center justify-center flex-shrink-0 text-[11px] font-bold font-mono"
                    style={{ backgroundColor: `${agent.color}18`, color: agent.color, border: `1px solid ${agent.color}30` }}
                  >
                    {agent.step}
                  </div>
                  <div>
                    <p className="text-body-sm font-medium text-on-surface">{agent.name}</p>
                    <p className="text-body-xs text-on-surface-variant mt-0.5 leading-relaxed">{agent.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── Section 4: Quick links ── */}
          <div
            className="p-6 rounded-xl"
            style={{
              backgroundColor: "var(--color-surface-container-low)",
              border: "1px solid #2d2d30",
            }}
          >
            <SectionHeader
              icon="open_in_new"
              title="Resources"
              subtitle="Documentation and provider sign-up links."
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                {
                  label: "IBM watsonx.ai",
                  url: "https://dataplatform.cloud.ibm.com/",
                  note: "Create a project & get credentials",
                  icon: "cloud",
                },
                {
                  label: "IBM Cloud API Keys",
                  url: "https://cloud.ibm.com/iam/apikeys",
                  note: "Generate your WATSONX_API_KEY",
                  icon: "key",
                },
                {
                  label: "Groq Console",
                  url: "https://console.groq.com/keys",
                  note: "Free tier — no credit card",
                  icon: "bolt",
                },
                {
                  label: "OpenRouter",
                  url: "https://openrouter.ai/keys",
                  note: "Free model access",
                  icon: "hub",
                },
              ].map((link) => (
                <a
                  key={link.url}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 px-4 py-3 rounded-lg transition-colors group"
                  style={{
                    backgroundColor: "var(--color-surface-container)",
                    border: "1px solid #2d2d30",
                    textDecoration: "none",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.borderColor = "rgba(0,240,255,0.3)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.borderColor = "#2d2d30";
                  }}
                >
                  <span
                    className="material-symbols-outlined text-[18px] flex-shrink-0"
                    style={{ color: "var(--color-primary)" }}
                  >
                    {link.icon}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-body-sm font-medium text-on-surface">{link.label}</p>
                    <p className="text-body-xs text-on-surface-variant">{link.note}</p>
                  </div>
                  <span className="material-symbols-outlined text-[14px] text-on-surface-variant opacity-40 group-hover:opacity-80 transition-opacity">
                    open_in_new
                  </span>
                </a>
              ))}
            </div>
          </div>

          {/* Bottom padding */}
          <div className="h-8" />
        </div>
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </AppShell>
  );
}
