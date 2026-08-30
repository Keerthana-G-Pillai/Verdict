import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Documentation — VERDICT Change Intelligence Platform",
  description: "Learn how VERDICT analyzes engineering changes, detects semantic conflicts, and issues evidence-based verdicts.",
};

// ── Section anchor helper ─────────────────────────────────────
function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="mb-16">
      <h2 className="text-headline-lg font-bold text-on-surface mb-4 flex items-center gap-3">
        <span
          className="w-1 h-7 rounded-full"
          style={{ backgroundColor: "#00f0ff" }}
          aria-hidden="true"
        />
        {title}
      </h2>
      <div className="space-y-4 text-body-md text-on-surface-variant leading-relaxed">
        {children}
      </div>
    </section>
  );
}

function SubSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-6">
      <h3 className="text-body-lg font-semibold text-on-surface mb-2">{title}</h3>
      <div className="space-y-2 text-body-md text-on-surface-variant leading-relaxed">
        {children}
      </div>
    </div>
  );
}

function Callout({ icon, color, children }: { icon: string; color: string; children: React.ReactNode }) {
  return (
    <div
      className="flex gap-3 px-4 py-3 rounded-lg my-4"
      style={{ backgroundColor: `${color}0d`, border: `1px solid ${color}25` }}
    >
      <span className="material-symbols-outlined shrink-0 mt-0.5" style={{ color, fontSize: "18px" }}>{icon}</span>
      <div className="text-body-md" style={{ color: "#c5c8cc" }}>{children}</div>
    </div>
  );
}

// ── Table of Contents ─────────────────────────────────────────
const TOC = [
  { id: "what-is-verdict",    label: "What is VERDICT?" },
  { id: "how-it-works",       label: "How Change Analysis Works" },
  { id: "evidence-types",     label: "Evidence Types" },
  { id: "risk-intelligence",  label: "Risk Intelligence Agent" },
  { id: "safety-validation",  label: "Safety Validation Agent" },
  { id: "decision-engine",    label: "Decision Engine" },
  { id: "merge-simulation",   label: "Merge Simulation" },
  { id: "semantic-conflicts", label: "Semantic Conflict Detection" },
  { id: "engineering-memory", label: "Engineering Memory" },
  { id: "ai-accuracy",        label: "AI Accuracy & Anti-Hallucination" },
  { id: "limitations",        label: "Known Limitations" },
  { id: "privacy",            label: "Privacy & Data Handling" },
];

// ── Page ──────────────────────────────────────────────────────

export default function DocsPage() {
  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: "var(--color-background)" }}
    >
      {/* Top nav */}
      <nav
        className="fixed top-0 left-0 w-full z-50 border-b border-outline-variant flex items-center justify-between h-16 px-6"
        style={{ backgroundColor: "rgba(19,19,20,0.9)", backdropFilter: "blur(12px)" }}
      >
        <Link href="/" className="flex items-center gap-2">
          <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <path d="M4 3L10 14L16 3" stroke="#00f0ff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M7.5 3L10 8L12.5 3" stroke="#00f0ff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="10" cy="16.5" r="1.5" fill="#00f0ff" />
          </svg>
          <span className="font-bold text-on-surface" style={{ fontSize: "15px" }}>VERDICT</span>
          <span className="text-on-surface-variant mx-2">/</span>
          <span className="text-on-surface-variant text-body-md">Documentation</span>
        </Link>
        <div className="flex items-center gap-4">
          <Link href="/analyze" className="px-4 py-1.5 bg-primary-container text-on-primary-container text-label-mono font-semibold rounded hover:opacity-90 transition-opacity">
            Try VERDICT →
          </Link>
        </div>
      </nav>

      {/* Layout */}
      <div className="pt-16 flex max-w-7xl mx-auto">
        {/* Left TOC sidebar */}
        <aside
          className="hidden lg:block w-64 shrink-0 sticky top-16 self-start h-[calc(100vh-4rem)] overflow-y-auto px-6 py-8"
          style={{ borderRight: "1px solid #2d2d30" }}
        >
          <p className="text-label-mono text-on-surface-variant uppercase tracking-wider mb-4" style={{ fontSize: "10px" }}>
            On this page
          </p>
          <nav className="space-y-1">
            {TOC.map((item) => (
              <a
                key={item.id}
                href={`#${item.id}`}
                className="block text-body-sm text-on-surface-variant hover:text-on-surface py-1 transition-colors"
              >
                {item.label}
              </a>
            ))}
          </nav>
        </aside>

        {/* Main content */}
        <main className="flex-1 max-w-3xl px-8 py-12">
          {/* Hero */}
          <div className="mb-16">
            <div
              className="inline-flex items-center gap-2 px-3 py-1 mb-6 rounded-full border text-label-mono text-on-surface-variant"
              style={{ borderColor: "rgba(0,240,255,0.2)", backgroundColor: "rgba(0,240,255,0.05)", fontSize: "11px" }}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-primary-container animate-pulse" />
              VERDICT v2.0 Documentation
            </div>
            <h1 className="text-display-lg font-bold text-on-surface tracking-tight mb-4">
              Change Intelligence Platform
            </h1>
            <p className="text-body-lg text-on-surface-variant max-w-2xl">
              VERDICT uses a multi-agent AI pipeline to statically analyze, semantically validate,
              and issue evidence-based verdicts on engineering changes before they reach production.
            </p>
          </div>

          {/* ── WHAT IS VERDICT ── */}
          <Section id="what-is-verdict" title="What is VERDICT?">
            <p>
              VERDICT is a change intelligence platform that helps engineering teams understand
              the real consequences of a code change, database migration, architectural decision,
              or any other engineering modification <em>before</em> it is deployed.
            </p>
            <p>
              Unlike static analysis tools that only scan syntax, VERDICT uses a four-agent AI
              architecture to argue both sides of a change — identifying risks while simultaneously
              looking for safety evidence — then synthesizes both perspectives into a final verdict.
            </p>
            <Callout icon="gavel" color="#00f0ff">
              VERDICT&apos;s deterministic scoring engine is always the source of truth for risk scores
              and verdict thresholds. The AI agents enhance and explain — they do not override
              the scoring logic.
            </Callout>
          </Section>

          {/* ── HOW ANALYSIS WORKS ── */}
          <Section id="how-it-works" title="How Change Analysis Works">
            <p>
              When you submit a change, VERDICT runs a five-stage pipeline:
            </p>
            <ol className="space-y-3 mt-4 list-none">
              {[
                { n: "01", label: "Understand Context", desc: "Detects change type, programming language, domain (authentication, payments, database, etc.), and blast radius. Identifies dependencies and affected areas." },
                { n: "02", label: "Risk Intelligence", desc: "An adversarial AI agent argues the strongest possible case against the change. Every risk must be grounded in the actual submitted content — speculation is explicitly prohibited." },
                { n: "03", label: "Safety Validation", desc: "An independent AI agent argues for why the change is safe. Looks for safeguards, test coverage, narrow scope, backward compatibility, and rollback capability." },
                { n: "04", label: "Simulation", desc: "Deterministic static analysis checks for known risk patterns — idempotency, retry safety, authentication flows, database operations, and more." },
                { n: "05", label: "Decision Engine", desc: "Synthesizes all agent outputs. Deterministic scoring computes a 0–100 risk score. The AI judge explains the verdict in plain language." },
              ].map((step) => (
                <li key={step.n} className="flex gap-4 px-4 py-4 rounded-lg" style={{ backgroundColor: "var(--color-surface-container-low)", border: "1px solid #2d2d30" }}>
                  <span className="text-label-mono font-bold shrink-0 mt-0.5" style={{ color: "#00f0ff", fontSize: "12px" }}>{step.n}</span>
                  <div>
                    <div className="text-body-md font-semibold text-on-surface mb-1">{step.label}</div>
                    <div className="text-body-sm text-on-surface-variant">{step.desc}</div>
                  </div>
                </li>
              ))}
            </ol>
          </Section>

          {/* ── EVIDENCE TYPES ── */}
          <Section id="evidence-types" title="Evidence Types">
            <p>
              Every finding in VERDICT is classified by its evidence type, which determines how
              confident you should be in the claim:
            </p>
            <div className="space-y-3 mt-4">
              {[
                { type: "DIRECT INPUT EVIDENCE", color: "#00f0ff", desc: "Directly observed in the submitted change content. The highest reliability evidence type." },
                { type: "STATIC ANALYSIS", color: "#6ffbbe", desc: "Pattern matching against known risk signatures in the change. Deterministic, no AI inference." },
                { type: "AI REASONING", color: "#ffb95f", desc: "AI agent inference from the change content. Grounded in submitted material, but involves interpretation." },
                { type: "INFERRED RISK", color: "#ffb4ab", desc: "Potential risk based on patterns associated with similar changes. May not apply to this specific case." },
              ].map((ev) => (
                <div key={ev.type} className="flex gap-3 px-4 py-3 rounded-lg" style={{ backgroundColor: "var(--color-surface-container-low)", border: "1px solid #2d2d30" }}>
                  <span
                    className="text-label-mono font-bold shrink-0 text-right"
                    style={{ color: ev.color, fontSize: "10px", minWidth: "140px", paddingTop: "2px" }}
                  >
                    {ev.type}
                  </span>
                  <p className="text-body-sm text-on-surface-variant">{ev.desc}</p>
                </div>
              ))}
            </div>
          </Section>

          {/* ── RISK INTELLIGENCE ── */}
          <Section id="risk-intelligence" title="Risk Intelligence Agent">
            <p>
              The Risk Intelligence agent runs independently from Safety Validation — it never sees
              the other agent&apos;s output before producing its findings.
            </p>
            <SubSection title="What it looks for">
              <ul className="list-disc pl-5 space-y-1 text-on-surface-variant">
                <li>Security vulnerabilities (injection, credential exposure, broken authentication)</li>
                <li>Race conditions and non-atomic operations</li>
                <li>Missing idempotency on retry-able operations</li>
                <li>Breaking changes to public contracts or downstream callers</li>
                <li>Performance regressions (N+1 queries, blocking async, unbounded loops)</li>
                <li>Data loss scenarios (no backup, no rollback, destructive migrations)</li>
                <li>Hardcoded secrets or environment-specific assumptions</li>
              </ul>
            </SubSection>
            <Callout icon="shield" color="#ffb95f">
              The Risk agent is constrained to flag only risks concretely evidenced by the submitted
              content. Speculative risks and trivial changes are explicitly filtered out.
            </Callout>
          </Section>

          {/* ── SAFETY VALIDATION ── */}
          <Section id="safety-validation" title="Safety Validation Agent">
            <p>
              The Safety Validation agent runs in parallel with Risk Intelligence and argues the
              opposite case — why the change <em>is</em> safe to deploy.
            </p>
            <SubSection title="What it looks for">
              <ul className="list-disc pl-5 space-y-1 text-on-surface-variant">
                <li>Existing test coverage for changed code paths</li>
                <li>Narrow scope and limited blast radius</li>
                <li>Defensive patterns already present (guards, circuit breakers, error handling)</li>
                <li>Framework or library safeguards that mitigate apparent risks</li>
                <li>Rollback capability or feature flag protection</li>
                <li>Backward compatibility preservation</li>
                <li>Idempotency or safe retry semantics</li>
              </ul>
            </SubSection>
          </Section>

          {/* ── DECISION ENGINE ── */}
          <Section id="decision-engine" title="Decision Engine">
            <p>
              The Decision Engine (Judge) synthesizes outputs from Risk Intelligence, Safety Validation,
              and the deterministic Validation Engine to produce a final verdict.
            </p>
            <SubSection title="Verdict outcomes">
              <div className="space-y-2">
                {[
                  { label: "APPROVED", color: "#6ffbbe", desc: "Low risk score, no critical or high-severity findings. Change can proceed through normal deployment gates." },
                  { label: "APPROVED WITH CONDITIONS", color: "#ffb95f", desc: "Medium risk or high-severity findings present. Change can proceed after satisfying listed conditions." },
                  { label: "REQUIRES REVISION", color: "#ffb4ab", desc: "Critical findings or high risk score. The change needs meaningful rework before it can be deployed safely." },
                  { label: "REJECTED", color: "#ff6b6b", desc: "Unacceptable risk profile. The proposed approach should be reconsidered entirely." },
                ].map((v) => (
                  <div key={v.label} className="flex gap-3 items-start px-3 py-2 rounded" style={{ backgroundColor: "var(--color-surface-container-low)", border: "1px solid #2d2d30" }}>
                    <span className="text-label-mono font-bold shrink-0" style={{ color: v.color, fontSize: "10px", minWidth: "160px", paddingTop: "2px" }}>{v.label}</span>
                    <span className="text-body-sm text-on-surface-variant">{v.desc}</span>
                  </div>
                ))}
              </div>
            </SubSection>
            <SubSection title="Risk scoring">
              <p>
                Risk scores are computed deterministically from finding severity weights:
                Critical = 40 pts, High = 20 pts, Medium = 8 pts, Low = 3 pts.
                Scores are capped at 100 with diminishing returns. The AI judge never overrides
                the computed score — it explains the verdict in human-readable language.
              </p>
            </SubSection>
          </Section>

          {/* ── MERGE SIMULATION ── */}
          <Section id="merge-simulation" title="Merge Simulation">
            <p>
              Merge Simulation detects conflicts between two independent changes that Git cannot
              catch — behavioral incompatibilities that only become apparent at runtime.
            </p>
            <p>
              You submit Change A and Change B independently. VERDICT runs a six-stage simulation
              pipeline: Compare → Overlap Detection → Semantic Analysis → Simulate Integration →
              Validate Coexistence → Integration Verdict.
            </p>
            <Callout icon="science" color="#6ffbbe">
              The canonical demo for Merge Simulation is the Authentication Conflict scenario:
              Change A migrates from JWT to sessions, while Change B extends JWT refresh logic.
              These changes pass a simple Git merge but will cause immediate auth failures in production.
            </Callout>
          </Section>

          {/* ── SEMANTIC CONFLICTS ── */}
          <Section id="semantic-conflicts" title="Semantic Conflict Detection">
            <p>
              Semantic conflicts are incompatibilities that exist at the behavioral level rather
              than the textual level. They cannot be found by diffing files.
            </p>
            <SubSection title="Conflict types detected">
              <ul className="list-disc pl-5 space-y-1 text-on-surface-variant">
                <li><strong className="text-on-surface">Semantic conflicts</strong> — one change assumes something that another invalidates</li>
                <li><strong className="text-on-surface">Contract conflicts</strong> — API signatures, response shapes, or protocol assumptions diverge</li>
                <li><strong className="text-on-surface">State conflicts</strong> — shared state is accessed with incompatible assumptions</li>
                <li><strong className="text-on-surface">Ordering conflicts</strong> — changes assume a different execution or deployment order</li>
                <li><strong className="text-on-surface">Configuration conflicts</strong> — environment variables or feature flags are set incompatibly</li>
              </ul>
            </SubSection>
          </Section>

          {/* ── ENGINEERING MEMORY ── */}
          <Section id="engineering-memory" title="Engineering Memory">
            <p>
              Engineering Memory is your persistent knowledge base of past analyses and simulations.
              After any analysis completes, click &ldquo;Save to Engineering Memory&rdquo; to preserve it.
            </p>
            <p>
              Saved records are searchable and filterable by verdict, risk score, domain, and date.
              Memory Insights surfaces aggregate patterns: approval rate, average risk score, top domains,
              and verdict breakdown across all saved records.
            </p>
            <Callout icon="storage" color="#00f0ff">
              Data is stored in your browser&apos;s localStorage. It persists across sessions on the same
              browser but does not sync across devices. The last 20 analyses and simulations are
              automatically retained even without explicit saving.
            </Callout>
          </Section>

          {/* ── AI ACCURACY ── */}
          <Section id="ai-accuracy" title="AI Accuracy &amp; Anti-Hallucination">
            <p>
              VERDICT implements strict anti-hallucination rules at the prompt level for every agent.
              Each agent is explicitly prohibited from:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-on-surface-variant mt-3">
              <li>Inventing files, services, or dependencies not present in the submitted change</li>
              <li>Inventing test results or execution outcomes</li>
              <li>Inventing production incidents or historical context</li>
              <li>Claiming certainty where the evidence only supports probability</li>
            </ul>
            <SubSection title="Calibrated language">
              <p>
                When VERDICT cannot verify something from the provided input, it says
                &ldquo;Not verifiable from the provided context&rdquo; rather than inventing an answer.
                Risk claims use calibrated language: &ldquo;Potential risk&rdquo;, &ldquo;Likely incompatibility&rdquo;,
                &ldquo;Detected directly&rdquo;, &ldquo;Unable to verify without additional context&rdquo;.
              </p>
            </SubSection>
            <SubSection title="Fallback behavior">
              <p>
                If all AI providers are unavailable, VERDICT automatically falls back to its
                deterministic analysis engine. You will always receive a verdict — the
                &ldquo;RULE-BASED ANALYSIS&rdquo; badge indicates the deterministic path was used.
              </p>
            </SubSection>
          </Section>

          {/* ── LIMITATIONS ── */}
          <Section id="limitations" title="Known Limitations">
            <ul className="list-disc pl-5 space-y-2 text-on-surface-variant">
              <li>
                <strong className="text-on-surface">No code execution.</strong> VERDICT does not run your code. All analysis is static — it cannot detect runtime-only issues that require execution to surface.
              </li>
              <li>
                <strong className="text-on-surface">Context is limited to submitted input.</strong> VERDICT does not have access to your repository, test suite, or production environment. Richer context inputs produce more accurate results.
              </li>
              <li>
                <strong className="text-on-surface">AI responses are non-deterministic.</strong> The same input may produce slightly different AI findings across runs. The deterministic scoring engine is consistent; the AI explanations may vary.
              </li>
              <li>
                <strong className="text-on-surface">Data is browser-local.</strong> Engineering Memory does not sync across devices or users. There is no team sharing or collaboration in the current version.
              </li>
              <li>
                <strong className="text-on-surface">Large inputs are truncated.</strong> Change content is truncated at 3,000 characters per agent call to fit model context windows.
              </li>
            </ul>
          </Section>

          {/* ── PRIVACY ── */}
          <Section id="privacy" title="Privacy &amp; Data Handling">
            <p>
              VERDICT processes your submitted change content by sending it to AI providers
              (Groq, IBM watsonx, or OpenRouter) for analysis. The following data handling
              practices apply:
            </p>
            <ul className="list-disc pl-5 space-y-2 text-on-surface-variant mt-3">
              <li>Submitted change content is sent to third-party AI APIs for processing. Do not submit code containing production secrets, credentials, or sensitive personal data.</li>
              <li>Analysis results are stored locally in your browser&apos;s localStorage. No server-side database stores your analyses.</li>
              <li>No user authentication is required. There are no user accounts or server-side user data.</li>
              <li>API keys are stored only in server-side environment variables and are never exposed to the browser.</li>
            </ul>
            <Callout icon="privacy_tip" color="#6ffbbe">
              VERDICT is a hackathon project. For production use, review the data handling
              policies of your chosen AI provider before submitting sensitive code.
            </Callout>
          </Section>
        </main>
      </div>
    </div>
  );
}
