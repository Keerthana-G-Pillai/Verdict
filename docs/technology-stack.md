# VERDICT — Technology Stack

> Every technology listed below is verified from `package.json` dependencies and actual usage in the source code.

---

## Core Stack

| Technology | Version | Role in VERDICT |
|---|---|---|
| **Next.js** | 16.3.3 | Full-stack framework — App Router for pages, server-side API routes for analysis and simulation endpoints |
| **React** | 19.2.8 | UI rendering — component-based frontend with server and client components |
| **TypeScript** | ^5 | Type safety across the entire codebase — all source files are `.ts` / `.tsx` |
| **Tailwind CSS** | ^4 | Styling — dark design system with custom utility classes, via `@tailwindcss/postcss` |

## State Management & Storage

| Technology | Version | Role in VERDICT |
|---|---|---|
| **Zustand** | 5.0.15 | Client-side state management — analysis results, simulation results, Engineering Memory, persisted to localStorage |
| **Supabase** | 2.112.4 | Authentication (email, OAuth) and PostgreSQL database with Row Level Security |
| **@supabase/ssr** | 0.12.5 | Server-side Supabase client for Next.js App Router integration |
| **localStorage** | Browser API | Persistence layer for Engineering Memory and analysis history (survives page refresh) |

## AI Providers

| Provider | Model | Role in VERDICT |
|---|---|---|
| **Groq** | `llama-3.1-8b-instant` | Primary active AI provider — powers the 4-agent adversarial pipeline (Risk, Safety, Judge agents) |
| **IBM watsonx** | `ibm/granite-3-3-8b-instruct` | Implemented provider (code exists in `watsonx-provider.ts`) — activates when `WATSONX_API_KEY` + `WATSONX_PROJECT_ID` are configured |
| **OpenRouter** | `meta-llama/llama-3.1-8b-instruct:free` | Automatic fallback when Groq is unavailable |
| **Deterministic Fallback** | Pattern-based engine | Always available — no API key required. Ensures VERDICT works without any AI provider |

## Development Tools

| Technology | Version | Role |
|---|---|---|
| **ESLint** | ^9 | Code linting with `eslint-config-next` |
| **PostCSS** | — | CSS processing pipeline for Tailwind CSS |
| **next-themes** | 0.4.6 | Theme management (dark mode support) |

## Infrastructure

| Technology | Role |
|---|---|
| **Vercel** | Deployment platform (configured via `vercel.json`) |
| **Supabase Cloud** | Authentication service and PostgreSQL database |
| **Groq API** | AI inference endpoint (`api.groq.com`) |

## Architecture Patterns

| Pattern | Implementation |
|---|---|
| **Adversarial multi-agent pipeline** | 4 agents (Risk, Safety, Validation, Judge) with parallel independent execution |
| **Provider auto-selection with fallback** | Provider Manager tries each provider in priority order, falls back to deterministic |
| **Deterministic verdict engine** | Scoring algorithm is source of truth — AI enhances rationale, never overrides thresholds |
| **Template-based conflict detection** | 13 semantic conflict templates with keyword-triggered matching across 10 engineering domains |
| **Client-side persistence** | Zustand stores with localStorage middleware for offline-capable data persistence |

---

## What Is NOT in the Stack

For transparency, these technologies are **not** used in VERDICT's runtime:

- **IBM watsonx Orchestrate** — not integrated
- **Docker / containers** — not used; deployed as a serverless Next.js application
- **External databases** beyond Supabase — no Redis, MongoDB, or other data stores in the application itself
- **CI/CD pipelines** — no GitHub Actions, Jenkins, or automated testing pipelines are configured
- **Code execution sandbox** — VERDICT does not execute submitted code; all analysis is static/semantic
