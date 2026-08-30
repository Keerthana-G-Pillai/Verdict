# VERDICT — Competition Submission Package

> **"Git sees no conflict. VERDICT found one."**

---

## A. COMPETITION VIDEO SCRIPT — 13 STEPS

**Target duration:** 3–5 minutes  
**Tone:** Real product demonstration — natural, confident, engaging

---

### STEP 1 — Hook / Problem
**Duration:** ~20 seconds  
**Screen:** Show a clean Git merge output that reads "Merge successful — no conflicts."

**Presenter says:**
> "Every engineering team relies on Git to catch merge conflicts. And Git is good at what it does — it finds textual conflicts, line-by-line, characters on a page. But what about changes that look syntactically clean, pass linting, merge without a single conflict marker — and still break your system? That's the problem VERDICT was built to solve."

**Key UI element:** A plain terminal output showing a clean merge. Let it sink in.

---

### STEP 2 — Introduce the Product
**Duration:** ~20 seconds  
**Screen:** Navigate to the VERDICT landing page (`/`)

**Presenter says:**
> "VERDICT is an AI-powered change intelligence platform. You submit an engineering change — a diff, a pull request, a code snippet — and VERDICT runs a four-agent adversarial pipeline to issue an evidence-based verdict: Approved, Approved with Conditions, or Requires Revision. It doesn't just check syntax. It reasons about what your change actually does."

**Key UI element:** The hero headline and product tagline on the landing page.

---

### STEP 3 — Main Dashboard / Simulations Interface
**Duration:** ~20 seconds  
**Screen:** Navigate to `/analyze` — the change analysis input form

**Presenter says:**
> "The workflow starts here. You paste your change — a unified diff, pull request text, or raw code — add a short description, and submit. VERDICT handles the rest: understanding context, running a parallel adversarial risk-vs-safety evaluation, validating the findings deterministically, and producing a final verdict with evidence."

**Key UI element:** The three change type options (Diff, Code, PR), the input fields, and the built-in demo scenario selector.

---

### STEP 4 — Security-Risk Simulation
**Duration:** ~35 seconds  
**Screen:** Submit the SQL injection test manually, or select the matching demo scenario

Use this exact input:

**Diff:**
```
--- a/src/routes/users.js
+++ b/src/routes/users.js
@@ -12,7 +12,7 @@ router.get('/user', async (req, res) => {
-  const query = 'SELECT * FROM users WHERE id = ?';
-  const result = await db.query(query, [req.query.id]);
+  const query = `SELECT * FROM users WHERE id = ${req.query.id}`;
+  const result = await db.query(query);
   res.json(result.rows[0]);
 });
```

**Description:**
> "Simplifies the getUser query by inlining the id parameter directly into the SQL string instead of using a parameterized query, to reduce a step in the query builder."

**Presenter says:**
> "Let's start with a security risk. This diff removes a parameterized query and replaces it with direct string interpolation — a classic SQL injection vulnerability. Watch what VERDICT does."

*[Wait for result to appear]*

> "VERDICT returns: **Requires Revision — Risk Score 88, High Risk — 1 Critical Finding.** The description says 'simplifies the query' — but VERDICT caught the injection vulnerability regardless. No linter would flag this. The change is syntactically valid JavaScript. VERDICT reasoned about what it means to inline `req.query.id` into a raw SQL string."

**Key UI element:** The verdict card showing REQUIRES REVISION, the 88 risk score badge, and the critical finding card.

---

### STEP 5 — Explain the AI Analysis
**Duration:** ~25 seconds  
**Screen:** Scroll through the analysis result page — pipeline stages, finding cards, evidence panel

**Presenter says:**
> "Under the hood, four agents ran in parallel. A Risk Intelligence agent argued the strongest case against this change. A Safety Validation agent argued for it. These two run with completely independent contexts — neither sees the other's output before forming its findings. Then a Validation Engine runs deterministic static analysis — no fabricated results. Finally a Decision Engine synthesises everything into a single evidence-based verdict."

**Key UI element:** The pipeline stage visualisation, and the AI-ENHANCED · GROQ badge in the top right of the results page.

---

### STEP 6 — API Contract / Behavioral Change Scenario
**Duration:** ~30 seconds  
**Screen:** Navigate to `/analyze`, submit Test B

Use this exact input:

**Diff:**
```
--- a/src/routes/users.js
+++ b/src/routes/users.js
@@ -20,6 +20,9 @@ router.get('/user', async (req, res) => {
+  if (!req.query.id || isNaN(req.query.id)) {
+    return res.status(400).json({ error: 'Invalid id' });
+  }
   const query = 'SELECT * FROM users WHERE id = ?';
   const result = await db.query(query, [req.query.id]);
   res.json(result.rows[0]);
 });
```

**Description:**
> "Adds input validation to reject missing or non-numeric id before querying, to prevent malformed requests reaching the database."

**Presenter says:**
> "Now something subtler. This change adds input validation — which sounds safe. But VERDICT asks a harder question: does this change alter the existing API contract? Requests that previously reached the database with a missing or non-numeric id will now receive a 400 response instead. Existing clients that send such requests are silently broken. This is a behavioral change hiding inside a 'safety improvement.'"

*[Show the actual verdict returned — do not state a specific score or verdict in advance, show the live result]*

**Key UI element:** The verdict card and the finding that flags the API contract implication.

---

### STEP 7 — Low-Risk Change Simulation
**Duration:** ~25 seconds  
**Screen:** Navigate to `/analyze`, submit Test C

Use this exact input:

**Diff:**
```
--- a/src/routes/users.js
+++ b/src/routes/users.js
@@ -1,5 +1,6 @@
 const express = require('express');
 const router = express.Router();
+const logger = require('../utils/logger');
 const db = require('../db');

@@ -18,6 +19,7 @@ router.get('/user', async (req, res) => {
   const query = 'SELECT * FROM users WHERE id = ?';
   const result = await db.query(query, [req.query.id]);
+  logger.info('Fetched user by id');
   res.json(result.rows[0]);
 });
```

**Description:**
> "Adds a properly imported logger and a generic informational log line after fetching the user, for request tracing. Does not log the raw id and does not change query logic, response shape, or existing behavior."

**Presenter says:**
> "Now the same route file — this time with a proper logger addition. VERDICT returns: **Approved with Conditions — Risk Score 56, Medium Risk — 0 Critical Findings.** The logger is properly imported. The log message is generic — the raw `id` is not logged. Query logic and response behavior are unchanged. VERDICT understood the semantic difference."

**Key UI element:** The verdict card showing APPROVED WITH CONDITIONS, risk score 56, zero critical findings.

---

### STEP 8 — Why This Is Different from Linting
**Duration:** ~20 seconds  
**Screen:** Split focus between the three results you've just shown

**Presenter says:**
> "ESLint would not flag any of these three changes — all three are syntactically valid. A linter checks rules. VERDICT reasons about behavior. It asks: what does this change actually do? Does it alter an API contract? Does it introduce a security regression? Does it make an assumption that another concurrent change violates? That's semantic analysis — and it's what VERDICT was built for."

**Key UI element:** The three verdict outcomes side by side conceptually — Revision, Conditions, Conditions.

---

### STEP 9 — Merge Simulation
**Duration:** ~45 seconds  
**Screen:** Navigate to `/simulations`

**Presenter says:**
> "Now the most powerful feature: Merge Simulation. Submit two changes that are being developed concurrently — the way teams actually work. VERDICT simulates what happens when they meet."

*[Load the JWT Migration vs Session Refresh scenario — the built-in demo scenario or manually]*

**Change A:** JWT migration (migrates from Redis sessions to JWT access tokens)  
**Change B:** Session refresh window extension (extends Redis session TTL from 24h to 7 days)

> "Change A migrates authentication from Redis sessions to JWT tokens. Change B extends the session refresh window to seven days. Git merges these cleanly — no conflict markers, no overlapping lines. Submit."

*[Wait for result]*

> "VERDICT returns: **Conflict Detected — Risk Score 100, Critical Risk — Confidence 93% — 3 Semantic Conflicts.**"

> "Git sees no conflict. VERDICT found one."

> "Change B extends the lifetime of the Redis session infrastructure that Change A just removed. After the migration, the session refresh logic has nothing to operate on. Users will be silently logged out and unable to re-authenticate through the refresh flow. A textually clean merge that would break production authentication for every user."

**Key UI element:** The CONFLICT DETECTED verdict card, the 100 risk score, the 93% confidence, and the three individual conflict cards with their assumptions and consequences.

---

### STEP 10 — AI-Enhanced Analysis
**Duration:** ~15 seconds  
**Screen:** Point to the AI-ENHANCED · GROQ badge visible on the simulation result page

**Presenter says:**
> "You can see the AI provider indicator here: AI-ENHANCED · GROQ. VERDICT uses Groq's Llama model to reason about the behavioral implications of changes — adding language-level understanding on top of the deterministic conflict engine. The scoring and verdict thresholds are always deterministic; AI enhances the rationale and reasoning, never the safety scores."

**Key UI element:** The `AI-ENHANCED · GROQ` badge in the top right corner of the results page.

---

### STEP 11 — Engineering Memory
**Duration:** ~30 seconds  
**Screen:** Navigate to `/memory`

**Presenter says:**
> "Every analysis you save becomes part of Engineering Memory — a searchable knowledge base of your team's change decisions. It's not just a history log. You can search across the actual code content, the diffs, the descriptions, and the findings."

*[Type a search term from the actual code content of a saved analysis — for example, searching for `redis` if the JWT simulation has been saved, or `parameterized` if the SQL injection analysis has been saved]*

> "Watch — I'm searching for a word from the actual code content of a previously saved analysis. VERDICT finds the relevant record immediately. Over time, Engineering Memory lets teams ask: have we ever reviewed a change like this? What did we decide? What were the conditions? That's institutional knowledge you can actually use."

**Key UI element:** The search bar, the filtered results showing a matching record, and the verdict/risk score displayed for that record.

**NOTE FOR RECORDING:** Before recording, run at least one of the three test scenarios and save it to Engineering Memory. Then search for a word that appears in the diff or code content — for example:
- SQL injection test saved → search: `parameterized`
- JWT simulation saved → search: `redis` or `refreshSession`
- Logger test saved → search: `logger.info`

---

### STEP 12 — Technology / Architecture
**Duration:** ~25 seconds  
**Screen:** Navigate to `/settings` to show the provider status panel (or show a brief architecture slide)

**Presenter says:**
> "VERDICT is built on Next.js 16 with React 19 and TypeScript, using Tailwind CSS for the dark UI system. State is managed with Zustand and persisted to localStorage. The AI pipeline supports Groq, OpenRouter, and IBM watsonx as providers — with a fully deterministic fallback that ensures the app always works without any API key."

> "This project was built using IBM Bob as the AI-assisted development environment throughout the build process. IBM Bob was used for code generation, architecture decisions, debugging, and iterating on the product — it was central to the development workflow, not just a peripheral tool."

> "Groq is the currently active AI provider — watsonx credentials are not configured in this submission. The deterministic VERDICT engine means every feature works regardless of AI availability."

**Key UI element:** The Settings page showing provider status, or the AI-ENHANCED · GROQ badge.

---

### STEP 13 — Closing / Differentiator
**Duration:** ~25 seconds  
**Screen:** Return to the landing page or the dashboard

**Presenter says:**
> "Every team that uses Git has a gap. Git is excellent at preventing textual merge conflicts. But it cannot detect semantic conflicts — authentication systems removing infrastructure that another change depends on. It cannot flag security regressions hidden in 'simplification' commits. It cannot identify API contract breaks disguised as 'validation improvements.'"

> "VERDICT closes that gap. It brings AI-enhanced semantic reasoning to the code review process — catching the risks that pass lint, pass tests, and merge cleanly, but still break production."

> "That's VERDICT. Thanks for watching."

**Key UI element:** The landing page with the tagline: *"Git sees no conflict. VERDICT found one."*

---

---

## B. WRITTEN SUBMISSION STATEMENTS

### 1. Problem Statement
*(~200 words — can be pasted directly into the submission form)*

Modern software teams rely on Git for change management, but Git only detects **textual conflicts** — lines that overlap on the same file. It cannot detect **semantic conflicts**: behavioral incompatibilities between changes that are syntactically valid, lint cleanly, merge without conflict markers, and still break production.

A developer migrates authentication from Redis sessions to JWT tokens. A second developer extends the Redis session refresh window. Git merges both changes cleanly. No tests catch it. The authentication refresh flow silently stops working for every user.

This happens constantly across engineering teams. A SQL injection vulnerability is introduced in a "simplification" commit. An API contract change is hidden inside a "validation improvement." Two concurrent changes make incompatible assumptions about shared state — and neither developer knows.

Existing tools — linters, static analysis, code review bots — check **rules**, not **meaning**. They validate syntax, not behavior. They find known bad patterns, not novel semantic incompatibilities between two otherwise-valid changes.

There is no standard tool that reasons about **what a change actually does** in the context of a running system, and whether two changes can safely coexist.

---

### 2. Solution Statement
*(~280 words — can be pasted directly into the submission form)*

VERDICT is an AI-powered change intelligence platform that analyzes engineering changes for semantic risk, security regressions, and behavioral conflicts that Git and conventional tooling cannot detect.

**Core analysis pipeline:**
Submit a change — a unified diff, pull request text, or code snippet — and VERDICT runs a four-agent adversarial pipeline. A Risk Intelligence agent argues the strongest case against the change. A Safety Validation agent argues for it. Both run with completely independent contexts, producing genuinely adversarial assessments. A Validation Engine runs deterministic static analysis. A Decision Engine synthesizes the evidence into a final verdict: Approved, Approved with Conditions, or Requires Revision.

**Merge Simulation — the signature feature:**
Submit two concurrent changes and VERDICT simulates what happens when they meet. It detects semantic conflicts across 13 behavioral templates covering authentication, database contracts, API compatibility, payment processing, async ordering, caching, and configuration. When Git says "merge successful," VERDICT may say "these changes fundamentally conflict."

**Engineering Memory:**
Every saved analysis becomes part of a searchable organizational knowledge base — searchable by code content, change type, verdict, domain, and risk score. Teams accumulate institutional knowledge about what kinds of changes require caution.

**Key properties:**
- Deterministic scoring — verdict thresholds are never AI-generated or arbitrary
- Transparent evidence levels — the system distinguishes between static analysis, inferred risk, and execution evidence
- Works without any API key — a fully deterministic fallback ensures the product always functions
- No fabricated results — VERDICT never invents execution outcomes it did not observe

VERDICT is production-quality: built with Next.js 16, React 19, TypeScript, Tailwind CSS, Zustand, and Supabase for authentication and persistence.

---

### 3. IBM Bob / Technology Usage Statement
*(for the "How did you use IBM Bob" field)*

IBM Bob was used as the primary AI-assisted development environment throughout the entire build of VERDICT. This was not peripheral usage — IBM Bob was central to the development workflow from day one.

**Specific uses of IBM Bob:**
- **Architecture design:** Multi-agent pipeline architecture (Risk Agent, Safety Agent, Validation Engine, Decision Engine) was designed through iterative conversation with IBM Bob, including the decision to run risk and safety agents with independent contexts to prevent anchoring.
- **Code generation:** Core modules including the semantic conflict engine, verdict engine scoring algorithm, provider manager auto-selection logic, and the deterministic analysis pipeline were generated and iterated with IBM Bob.
- **Debugging:** All significant bugs encountered during development — including provider fallback logic, Zustand persistence, and Next.js 16 App Router patterns — were diagnosed and resolved in collaboration with IBM Bob.
- **UI system:** The dark design system, component architecture (VerdictCard, ConflictCard, EvidenceFeed, AnalysisPipeline), and Tailwind CSS configuration were built with IBM Bob's assistance.
- **Documentation:** README, DEPLOYMENT.md, and this submission package were authored with IBM Bob.

**IBM Bob as runtime component:**
IBM Bob is not a runtime component of the deployed VERDICT application. It was the development tool used to build VERDICT.

**AI providers in the runtime application:**
- **Groq** (active): `llama-3.1-8b-instant` via Groq free tier — currently the working AI provider
- **OpenRouter** (fallback): `meta-llama/llama-3.1-8b-instruct:free` — configured as automatic fallback
- **IBM watsonx (Granite):** Provider code exists (`src/lib/ai/watsonx-provider.ts`) but watsonx credentials (`WATSONX_API_KEY`, `WATSONX_PROJECT_ID`) are not configured in this submission. The provider manager is set to prefer Groq. watsonx is not actively used.
- **Deterministic fallback:** Always available — no API key required

---

### 4. Key Differentiator Statement

VERDICT's differentiator is **semantic conflict detection** — the ability to identify behavioral incompatibilities between engineering changes that are invisible to Git, linters, and conventional static analysis tools.

The four-agent adversarial pipeline — modeled on legal adversarial reasoning — produces genuinely independent risk and safety assessments before synthesizing a deterministic verdict. The scoring algorithm is always the source of truth; AI reasoning enhances explanation quality but never overrides safety thresholds.

The Merge Simulation feature detects cross-change semantic conflicts across 13 behavioral templates covering authentication, database schema contracts, API compatibility, payment processing, async ordering, caching, and configuration — the real categories where concurrent engineering changes cause production incidents.

Engineering Memory converts individual analysis results into searchable organizational knowledge — allowing teams to recall and learn from previous risk decisions, not just execute new ones.

VERDICT operates honestly: it clearly labels analysis as static or inferred, never claims execution evidence it does not have, and provides a fully functional deterministic mode that requires no AI API key. This transparency is itself a differentiator in a space where AI tools frequently overstate their confidence.

---

---

## C. KNOWN LIMITATIONS

The following are accurate descriptions of VERDICT's current scope. They are not defects — they define the boundaries of what this version of the product does and where it will grow.

| Limitation | Description | Future Opportunity |
|---|---|---|
| **Static analysis only** | VERDICT performs pattern-based semantic analysis. It does not execute code in a sandbox or runtime environment. | Sandboxed execution evidence would allow `EXECUTION_EVIDENCE` level findings. |
| **No folder/repo upload** | Input is currently a diff, code snippet, or PR text. Full repository context is not uploaded or indexed. | Full repo indexing would enable cross-file dependency tracing. |
| **watsonx not configured** | IBM watsonx / Granite provider code exists but `WATSONX_API_KEY` and `WATSONX_PROJECT_ID` are not set. Groq is the active AI provider. | watsonx would be the primary provider once credentials are configured. |
| **Groq free tier rate limits** | The working AI provider (Groq) is on the free tier and may hit rate limits under heavy concurrent load. | Production deployment would use a paid tier or watsonx as primary. |
| **Memory is client-side** | Engineering Memory is persisted in the browser's localStorage. It is not synchronized across devices or users without a Supabase login. | Supabase sync is already partially implemented; full cloud sync requires a logged-in session. |
| **Conflict templates are deterministic** | The semantic conflict engine uses 13 behavioral templates. Novel conflict patterns outside these templates may not be detected deterministically (though AI reasoning may still flag them). | Expanding the template bank and adding vector-similarity matching are planned. |
| **No CI/CD integration** | VERDICT is currently a standalone web application, not a Git hook, GitHub Action, or CI pipeline plugin. | A CLI tool and GitHub Action are natural next steps. |

---

---

## D. VIDEO RECORDING CHECKLIST

### Before Recording

- [ ] Run the dev server: `npm run dev` — verify it starts cleanly on `http://localhost:3000`
- [ ] Open the correct application URL (localhost or production Vercel URL)
- [ ] Verify `.env.local` contains `AI_PROVIDER=groq` and a valid `GROQ_API_KEY`
- [ ] Confirm the AI provider is working: go to `/settings` and check provider status
- [ ] Verify the `AI-ENHANCED · GROQ` badge appears on a test analysis result
- [ ] Prepare all three test inputs (copy them from Section A above, Steps 4, 6, 7)
- [ ] Prepare the JWT Migration merge simulation inputs (Section A, Step 9) or load the built-in scenario
- [ ] Run at least one analysis and save it to Engineering Memory before recording Step 11
- [ ] Identify the search term you will use for Engineering Memory — it must be a word from the actual code content (not just the title), e.g., `parameterized`, `redis`, `logger.info`
- [ ] **Hide `.env.local` from your desktop/file explorer** — never show API keys on screen
- [ ] Set browser zoom to a clean readable level (100% or 110%)
- [ ] Close unnecessary browser tabs — use a clean window
- [ ] Close notifications, Slack, email, and system alerts
- [ ] Consider dark mode system setting to match the application's dark UI
- [ ] Test screen recording software and audio before the final take

### During Recording

- [ ] Follow the 13 steps in order
- [ ] Never open `.env.local`, terminal with visible API keys, or any file showing secrets
- [ ] Show real outputs only — do not pause and manually edit scores or results
- [ ] Wait for analysis results to fully appear before speaking about them
- [ ] For Step 6, show the actual verdict returned — do not claim a specific score in advance
- [ ] Speak the tagline clearly on camera: *"Git sees no conflict. VERDICT found one."*
- [ ] Keep each step within its approximate duration to hit the 3–5 minute target

### After Recording

- [ ] Watch the recording back before uploading — verify no secrets are visible
- [ ] Upload the video to a publicly accessible platform (YouTube, Vimeo, Google Drive with public link)
- [ ] Verify the video link opens without requiring a login
- [ ] Paste the public URL into the "Video demonstration" field in the submission form
- [ ] Verify the uploaded video is the correct, final take
