# VERDICT — Competition Submission Statements

> Copy-paste-ready content for the competition submission form.
> Each section is self-contained and labeled for the corresponding form field.

---

## Problem Statement

Modern software teams rely on Git for change management, but Git only detects **textual conflicts** — lines that overlap in the same file. It cannot detect **semantic conflicts**: behavioral incompatibilities between changes that are syntactically valid, pass linting, merge without a single conflict marker, and still break production.

A developer migrates authentication from Redis sessions to JWT tokens. A second developer extends the Redis session refresh window from 24 hours to 7 days. Git merges both changes cleanly — no conflict markers, no overlapping lines. No linter flags it. The authentication refresh flow silently stops working for every user.

This happens constantly across engineering teams:

- A SQL injection vulnerability is introduced in a "simplification" commit that inlines user input into a raw query string
- An API contract change is hidden inside a "validation improvement" that alters response behavior for existing clients
- Two concurrent changes make incompatible assumptions about shared infrastructure — and neither developer knows

Existing tools — linters, static analysis, code review bots — check **rules**, not **meaning**. They validate syntax, not behavior. They find known bad patterns, not novel semantic incompatibilities between two otherwise-valid changes.

There is no standard tool that reasons about **what a change actually does** and whether two concurrent changes can safely coexist.

---

## Solution Statement

VERDICT is an AI-powered change intelligence platform that analyzes engineering changes for semantic risk, security regressions, and behavioral conflicts that Git and conventional tooling cannot detect.

**Core analysis pipeline:**
Submit a change — a unified diff, pull request text, code snippet, or engineering decision — and VERDICT runs a four-agent adversarial pipeline. A Risk Intelligence agent argues the strongest case against the change. A Safety Validation agent argues for it. Both run in parallel with completely independent contexts — neither sees the other's output before forming its findings. A Validation Engine runs deterministic static analysis. A Decision Engine synthesizes all evidence into a final verdict: Approved, Approved with Conditions, or Requires Revision.

**Merge Simulation — the signature feature:**
Submit two concurrent changes and VERDICT simulates what happens when they meet. The semantic conflict engine detects behavioral incompatibilities across 13 conflict templates covering authentication, database contracts, API compatibility, payment processing, async ordering, caching, and configuration. When Git says "merge successful," VERDICT may say "these changes fundamentally conflict."

**Engineering Memory:**
Every saved analysis becomes part of a searchable organizational knowledge base — searchable by code content, change type, verdict, domain, and risk score. Teams accumulate institutional knowledge about what kinds of changes require caution.

**Key properties:**
- Deterministic scoring — verdict thresholds are algorithm-driven, never AI-generated
- Transparent evidence levels — the system distinguishes static analysis, inferred risk, and execution evidence
- Works without any API key — a fully deterministic fallback ensures the product always functions
- No fabricated results — VERDICT never invents execution outcomes it did not observe

---

## Technology / IBM Bob Usage Statement

### Technology Stack

VERDICT is built with Next.js 16, React 19, and TypeScript. The UI uses Tailwind CSS v4 with a custom dark design system. State management uses Zustand with localStorage persistence. Authentication and database are powered by Supabase with Row Level Security.

### AI Provider Architecture

The runtime application supports multiple AI providers with automatic fallback:

| Priority | Provider | Model | Status |
|---|---|---|---|
| 1st | **Groq** | `llama-3.1-8b-instant` | ✅ Active — working AI provider |
| 2nd | **IBM watsonx** | `ibm/granite-3-3-8b-instruct` | Provider code implemented, credentials not configured |
| 3rd | **OpenRouter** | `meta-llama/llama-3.1-8b-instruct:free` | Configured as automatic fallback |
| Always | **Deterministic fallback** | Pattern-based engine | Always available — no API key required |

### IBM Bob Usage

IBM Bob was used as the primary AI-assisted development environment throughout the entire build of VERDICT. This was not peripheral usage — IBM Bob was central to the development workflow.

**Specific uses:**
- **Architecture design:** The multi-agent adversarial pipeline (Risk Agent, Safety Agent, Validation Engine, Decision Engine) was designed through iterative conversation with IBM Bob, including the decision to run risk and safety agents with independent contexts to prevent anchoring bias
- **Code generation:** Core modules including the semantic conflict engine (13 conflict templates), verdict engine scoring algorithm, provider manager auto-selection logic, and the deterministic analysis pipeline were generated and iterated with IBM Bob
- **Debugging:** Provider fallback logic, Zustand persistence, Next.js 16 App Router patterns, and Groq API integration were diagnosed and resolved in collaboration with IBM Bob
- **UI system:** The dark design system, component architecture (VerdictCard, ConflictCard, pipeline visualization), and responsive layout were built with IBM Bob's assistance
- **Documentation:** README, deployment guide, and submission materials were authored with IBM Bob

**Important clarification:** IBM Bob is not a runtime component of the deployed VERDICT application. It was the AI development assistant used to build VERDICT. The runtime AI reasoning is provided by Groq (active) with watsonx provider code implemented for future activation.

---

## Key Differentiator

VERDICT's core differentiator is **semantic conflict detection** — identifying behavioral incompatibilities between engineering changes that are invisible to Git, linters, and conventional static analysis.

> **"Git sees no conflict. VERDICT found one."**

This tagline is demonstrated live in the product. The JWT Migration vs. Session Refresh simulation produces a `CONFLICT DETECTED` verdict with critical risk — for two changes that Git merges cleanly with zero conflict markers.

**What makes this different:**

- **Adversarial multi-agent pipeline** — Risk and Safety agents run with completely independent contexts, producing genuinely unanchored assessments before a Judge synthesizes the verdict
- **Semantic conflict detection across 13 behavioral templates** — covering authentication, database schema, API contracts, payment processing, async ordering, caching, and configuration
- **Deterministic safety** — the scoring algorithm is always the source of truth for verdicts; AI enhances rationale but never overrides safety thresholds
- **Engineering Memory** — converts individual analysis results into searchable organizational knowledge, allowing teams to learn from previous risk decisions
- **Honest evidence labeling** — VERDICT clearly distinguishes between static analysis, inferred risk, and execution evidence. It never fabricates execution results it did not observe

VERDICT operates in the gap between what Git can detect and what actually breaks production.
