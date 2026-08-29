# VERDICT — AI-Powered Change Intelligence Platform

> **"What happens if we make this change?"**

VERDICT is a production-quality AI platform that analyzes proposed engineering changes, detects hidden risks and semantic conflicts, and issues evidence-based verdicts.

---

## 🏆 Hackathon Product

Built for IBM's hackathon. VERDICT uses IBM Granite (via watsonx.ai) as its primary AI engine, with Groq and OpenRouter as free-tier fallbacks.

---

## Core Product Flow

```
SUBMIT CHANGE
      ↓
UNDERSTAND CONTEXT
      ↓
RISK INTELLIGENCE ──┐  ← runs independently
                    ├─► (parallel, adversarial)
SAFETY VALIDATION ──┘  ← runs independently
      ↓
VALIDATION ENGINE  ← static analysis, no fabricated results
      ↓
DECISION ENGINE    ← deterministic scoring + AI explanation
      ↓
ISSUE VERDICT      ← APPROVED / CONDITIONS / REVISION / REJECTED
      ↓
ENGINEERING MEMORY ← builds organizational knowledge
```

---

## 🤖 4-Agent Architecture

VERDICT uses an adversarial multi-agent pipeline inspired by legal proceedings:

| Agent | Role | Parallel? |
|---|---|---|
| **Risk Intelligence** | Argues the strongest case AGAINST the change | ✅ runs in parallel |
| **Safety Validation** | Argues the strongest case FOR the change | ✅ runs in parallel |
| **Validation Engine** | Static analysis (no fabricated execution) | Sequential |
| **Decision Engine** | Synthesizes evidence, explains verdict | Sequential |

**Key insight:** Risk and Safety agents run with completely **independent contexts** — neither sees the other's output before forming its findings. This produces genuinely adversarial, unanchored assessments.

The **deterministic verdict engine** (scoring algorithm) is always the source of truth for pass/fail thresholds. The AI Judge enhances the rationale — it never overrides safety scores.

---

## ✨ Signature Feature: Merge Simulation

> "Git sees no conflict. VERDICT found one."

VERDICT's merge simulation detects **semantic conflicts** — behavioral incompatibilities that Git cannot detect.

**Example:** Developer A migrates from JWT to session-based auth. Developer B extends JWT refresh token lifetime. Git says "no conflict." VERDICT says: "These changes fundamentally conflict — one removes the authentication mechanism the other depends on."

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn

### Setup

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env.local

# Fill in your API keys in .env.local
# (see .env.example for documentation)

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Production Build

```bash
npm run build
npm start
```

---

## 🔑 AI Provider Configuration

VERDICT supports multiple AI providers with automatic fallback:

| Priority | Provider | How to get |
|---|---|---|
| 1st | **IBM watsonx (Granite)** | [IBM Cloud](https://cloud.ibm.com/) — free lite plan |
| 2nd | **Groq** | [console.groq.com](https://console.groq.com) — free, no credit card |
| 3rd | **OpenRouter** | [openrouter.ai](https://openrouter.ai) — free models available |
| Always | **Deterministic fallback** | No key needed — always works |

See [`.env.example`](.env.example) for all configuration options.

**Security:** All API keys are server-side only. No `NEXT_PUBLIC_` vars. No keys in git.

---

## 📁 Project Structure

```
src/
├── app/
│   ├── page.tsx                    # Landing page
│   ├── dashboard/page.tsx          # Live engineering dashboard
│   ├── analyze/                    # Change analysis
│   │   ├── page.tsx               # Input form + demo scenarios
│   │   └── [id]/page.tsx          # Live pipeline + results
│   ├── simulations/               # Merge simulation
│   │   ├── page.tsx               # Two-panel input
│   │   └── [id]/page.tsx          # Conflict detection + strategy
│   ├── analyses/page.tsx           # Analysis history
│   ├── memory/page.tsx             # Engineering memory
│   ├── settings/page.tsx           # AI provider status + key configuration
│   └── api/
│       ├── analyze/route.ts        # 4-agent analysis endpoint
│       ├── simulate/route.ts       # Merge simulation endpoint
│       └── status/route.ts         # Provider health check endpoint
│
├── lib/
│   ├── ai/
│   │   ├── agents/                 # 4-agent pipeline
│   │   │   ├── orchestrator.ts    # Parallel execution coordinator
│   │   │   ├── risk-agent.ts      # Risk Intelligence (adversarial)
│   │   │   ├── safety-agent.ts    # Safety Validation (adversarial)
│   │   │   ├── judge-agent.ts     # Decision Engine synthesis
│   │   │   └── validation-engine.ts # Static analysis (no fabrication)
│   │   ├── watsonx-provider.ts    # IBM Granite provider
│   │   ├── groq-provider.ts       # Groq free-tier provider
│   │   ├── openrouter-provider.ts # OpenRouter free provider
│   │   └── provider-manager.ts    # Auto-selection + fallback
│   ├── analysis/                   # Deterministic analysis engine
│   ├── simulation/                 # Semantic conflict engine
│   └── demo-scenarios.ts          # Hackathon demo data
│
└── components/
    ├── analysis/                   # Analysis pipeline components
    ├── simulation/                 # Merge simulation components
    ├── dashboard/                  # Dashboard widgets
    ├── layout/                     # AppShell, AppSidebar
    └── ui/                         # Primitive components
```

---

## 🎯 Demo Scenarios

VERDICT includes built-in demo scenarios for immediate hackathon demos:

**Change Analysis:**
- 💳 Payment retry increase (risk: duplicate charges)
- 🔐 JWT → session auth migration
- 🗄️ Database column rename
- 🔌 API response field rename

**Merge Simulation (Signature Demo):**
- ⚡ **Auth Migration Conflict** — "Git sees no conflict. VERDICT found one."
- 💳 Payment retry + transaction processor conflict
- ✅ Safe merge — genuinely unrelated changes

---

## 🏗️ Architecture Highlights

- **Framework:** Next.js 16 + React 19 + TypeScript
- **Styling:** Tailwind CSS v4 with Stitch-designed dark UI system
- **State:** Zustand + localStorage persistence (survives page refresh)
- **AI:** 4-agent adversarial pipeline (IBM Granite → Groq → OpenRouter → deterministic)
- **Analysis:** Pattern-based deterministic engine (works without any API key)
- **Conflict detection:** 13 semantic conflict templates across 10 engineering domains
- **Memory:** Full Engineering Memory with search, filter, persistence

---

## 🔒 Evidence Levels

VERDICT is transparent about the quality of its evidence:

| Level | Meaning |
|---|---|
| `EXECUTION_EVIDENCE` | Real code was executed (future capability) |
| `STATIC_ANALYSIS` | Pattern-based code structure analysis |
| `INFERRED_RISK` | Probabilistic inference from patterns |
| `NOT_EXECUTABLE` | Decision/config change — cannot execute |

VERDICT **never fabricates execution results**. If execution is unavailable, it says so clearly.

---

## License

MIT
