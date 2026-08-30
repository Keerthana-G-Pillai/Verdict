# VERDICT — Screen Recording Flow
## Silent Visual Demo · No Voiceover

**Target duration:** 3 – 4 minutes  
**Recording mode:** Silent screen capture — no microphone, no voiceover  
**Browser:** Full-screen, clean window, 100% zoom  
**URL base:** your live Vercel deployment URL (or `localhost:3000` if recording locally)

---

## PRE-RECORDING CHECKLIST

Complete every item before hitting Record.

### Setup
- [ ] Open a **fresh, private/incognito browser window** — no bookmarks bar, no extensions visible
- [ ] Set browser zoom to **100%** — use Ctrl+0 / Cmd+0 to reset
- [ ] Go **full-screen** (F11 on Windows, Ctrl+Cmd+F on Mac)
- [ ] Close all other tabs — only the VERDICT tab should be open
- [ ] Turn off browser notifications (Settings → Notifications → Block all)
- [ ] Close Slack, email, Teams — no notification popups during recording
- [ ] Turn off system sound (optional, no voiceover so less critical)

### Application state
- [ ] Start dev server (`npm run dev`) if recording locally — verify it loads cleanly
- [ ] Navigate to the root `/` and confirm the landing page loads
- [ ] **Sign in** to a Supabase account — Demo Mode requires authentication (K+P shortcut only fires when logged in)
  - Go to `/dashboard` → click "Sign in" in the sidebar → use your credentials
- [ ] After sign-in, navigate to `/dashboard` and confirm the sidebar shows your user avatar/initial
- [ ] Verify AI provider is working:
  - Navigate to `/settings`
  - Confirm Groq status shows connected / green, or run a test submission first and confirm the `AI-ENHANCED · GROQ` badge appears
- [ ] **Pre-run the three test analyses and the simulation** at least once before recording:
  - SQL injection test → save to Engineering Memory
  - Logger test → save to Engineering Memory  
  - JWT simulation → save to Engineering Memory
  - This ensures Engineering Memory is populated and the search in Scene 9 will return real results
- [ ] Confirm Engineering Memory at `/memory` shows at least 2–3 saved records
- [ ] Identify your Engineering Memory search term — use a word from actual saved CODE CONTENT:
  - If SQL injection was saved → use: **`parameterized`** (from the original query in the diff)
  - If JWT simulation was saved → use: **`redis`** (from the session refresh code)
  - If logger test was saved → use: **`logger.info`**
  - Pick whichever you confirmed returns a result
- [ ] **Do NOT expose `.env.local`** — keep file explorer and terminal closed or off-screen
- [ ] Position mouse at a neutral location away from important text before starting

### Content preparation (have these ready to paste — DO NOT type them live)
Pre-copy the inputs into a text file you can quickly paste from. Do not type during recording.

**SQL injection diff (Test A):**
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
**Description:** Simplifies the getUser query by inlining the id parameter directly into the SQL string instead of using a parameterized query, to reduce a step in the query builder.

**Logger diff (Test C):**
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
**Description:** Adds a properly imported logger and a generic informational log line after fetching the user, for request tracing. Does not log the raw id and does not change query logic, response shape, or existing behavior.

---

## RECORDING FLOW — SCENE BY SCENE

---

### SCENE 1 — Landing Page
**Route:** `/`  
**Duration:** 4–5 seconds  
**Actions:**
1. The browser is already on `/` — let the page load completely
2. Wait for all animations to complete (the hero text fades in with staggered delays)
3. Move the mouse slowly to the center of the screen, away from any text
4. Pause — let the full hero section be visible: the `VERDICT V2.0 LIVE` badge, the headline `"Know the consequences before you make the change."`, and the two CTA buttons (`Start Analyzing →` and `Merge Simulation`)

**What should be visible:**
- Full-screen dark background with diagonal teal grid lines
- Pulsing cyan dot + "VERDICT V2.0 LIVE" badge
- Main headline with `change.` glowing in cyan
- Two call-to-action buttons
- Subtle scroll indicator at the bottom

**Scroll:** No  
**Emphasis:** The glowing headline and the live badge

---

### SCENE 2 — Landing Page — Scroll to Pipeline
**Route:** `/` (continued)  
**Duration:** 5–6 seconds  
**Actions:**
1. Slowly scroll down approximately one screen height
2. Pause when the **"The Change Pipeline"** section is fully visible
3. Let the pipeline nodes animate into view (they have a reveal-on-scroll effect)
4. Slowly scroll a little further to reveal the **"Analyze what a change touches."** and **"Simulate"** bento cards
5. Let the "Running..." simulation animation be visible briefly

**What should be visible:**
- Pipeline flow diagram: PROPOSED → ANALYZE → CHALLENGE → SIMULATE → VERDICT logo node
- The animated flowing line segments between nodes
- "Detect whether changes safely coexist." capability card at the bottom

**Scroll:** Slow downward scroll  
**Emphasis:** The pipeline flow and the "Simulate" card with the "Running..." animation

---

### SCENE 3 — Dashboard
**Route:** `/dashboard`  
**Duration:** 4–5 seconds  
**Actions:**
1. Click **Dashboard** in the left sidebar (or navigate directly to `/dashboard`)
2. Let the page load
3. Move the mouse smoothly over the sidebar to show the navigation structure
4. Pause briefly — the sidebar shows: Dashboard, Analyses, Simulations, Engineering Memory, Settings

**What should be visible:**
- VERDICT logo + "Change Intelligence" subtitle in sidebar
- "New Analysis" CTA button at top of sidebar
- Five navigation items: Dashboard, Analyses, Simulations, Engineering Memory, Settings
- Main panel header: "Engineering Intelligence"
- If analyses have been run: metric cards (Analyses Run, Requires Attention, Approval Rate) and the Recent Analyses table with real results
- If no prior analyses: the empty state with "Analyze a Change" and "Merge Simulation" buttons

**Scroll:** No  
**Emphasis:** Sidebar navigation structure and the dashboard overview

---

### SCENE 4 — New Analysis Input
**Route:** `/analyze`  
**Duration:** 5–6 seconds  
**Actions:**
1. Click **"New Analysis"** button at the top of the sidebar
2. Let the `/analyze` page load
3. Pause — show the form header: "What are you changing?"
4. Show the **Change Type selector** at the top: Code, Diff, PR, Decision tabs
5. Click **"Diff"** type to select it — confirm it highlights

**What should be visible:**
- Header: "What are you changing?"
- Sub-caption: "Submit a proposed change. VERDICT will analyze risks, validate safety, and issue an evidence-based decision."
- Change Type row with four options: Code, Diff, PR, Decision
- Title, Language, Repository/Service Context, File/Path Context, Content, Additional Context fields
- "Run VERDICT →" submit button with cyan glow

**Scroll:** No (form is visible above the fold)  
**Emphasis:** The clean form structure and the four change type options

---

### SCENE 5 — SQL Injection Analysis (Test A)
**Route:** `/analyze` → auto-navigates to `/analyze/[id]`  
**Duration:** ~45–60 seconds total (including wait for result)  
**Actions:**

**Filling the form (10–15 seconds):**
1. The **Diff** type should already be selected from Scene 4
2. Paste the SQL injection diff into the **Content** textarea (pre-copied — see pre-recording checklist)
3. Paste the description into the **Additional Context** field
4. Move the mouse to the **"Run VERDICT →"** button — pause 1 second
5. Click **"Run VERDICT →"**

**Analysis loading (10–15 seconds):**
6. The page navigates to `/analyze/[id]`
7. The pipeline stages animate through: Understanding Context → Running Risk Intelligence + Safety Validation (parallel) → Validation Engine → Decision Engine
8. Let the pipeline run fully — do not rush or click away
9. The live event feed on the right shows streaming analysis events

**Result viewing (20–25 seconds):**
10. When the result appears, pause immediately — keep the mouse still
11. The **VerdictCard** appears at the top showing:
    - `REQUIRES REVISION` label in red-pink
    - Risk score: **88** in red-pink with **HIGH RISK** label
    - **1 Critical** badge
    - Rationale text
12. In the top-right corner, confirm the **`AI-ENHANCED · GROQ`** badge is visible — pause here
13. Scroll down slowly to show the **Finding Cards** — the critical finding should be visible
14. Pause on the critical finding card showing the SQL injection vulnerability

**What should be visible:**
- Pipeline stage visualisation with progress indicators
- Final VerdictCard: REQUIRES REVISION · 88 · HIGH RISK · 1 Critical
- AI-ENHANCED · GROQ badge (top right, cyan/teal color)
- Critical finding card describing the SQL injection

**Scroll:** Yes — slow scroll after result appears  
**Emphasis:** The REQUIRES REVISION verdict card, the 88 risk score, the 1 Critical badge, and the AI-ENHANCED · GROQ badge  
**Pause duration:** 4–5 seconds on the verdict card before scrolling

---

### SCENE 6 — Logger Analysis (Test C — Low Risk Contrast)
**Route:** `/analyze` → `/analyze/[id]`  
**Duration:** ~45–60 seconds total  
**Actions:**

**Navigate and fill (10–15 seconds):**
1. Click **"New Analysis"** in the sidebar
2. Select **"Diff"** change type
3. Paste the logger diff content into the **Content** textarea
4. Paste the logger description into the **Additional Context** field
5. Click **"Run VERDICT →"**

**Wait for result (10–15 seconds):**
6. Let the pipeline run fully

**View result (20–25 seconds):**
7. When the result appears, pause immediately
8. The VerdictCard shows:
    - `APPROVED WITH CONDITIONS` label in amber/orange
    - Risk score: **56** in amber with **MEDIUM RISK** label
    - **0 Critical** (no critical badge shown)
9. In the top-right, confirm **`AI-ENHANCED · GROQ`** badge is visible
10. Pause on the VerdictCard — let the contrast with Scene 5 be apparent
11. Optionally scroll down briefly to show zero critical findings in the metrics grid

**What should be visible:**
- VerdictCard: APPROVED WITH CONDITIONS · 56 · MEDIUM RISK
- No critical findings badge
- AI-ENHANCED · GROQ badge

**Scroll:** Optional minimal scroll to show metrics  
**Emphasis:** The APPROVED WITH CONDITIONS verdict — the contrast with the SQL injection result  
**Pause duration:** 4 seconds on the verdict card

---

### SCENE 7 — Navigate to Simulations
**Route:** `/simulations`  
**Duration:** 4–5 seconds  
**Actions:**
1. Click **"Simulations"** in the sidebar
2. Let the page load
3. Pause — show the full header: "Can these changes safely coexist?"
4. Point the mouse slowly across the two-panel input layout (Change A panel and Change B panel)
5. Show the submit button at the bottom: "Run Merge Simulation →"

**What should be visible:**
- Header: "Can these changes safely coexist?"
- Sub-caption: "Compare two independent changes before they collide. VERDICT detects semantic conflicts that Git cannot."
- Change A panel (blue/cyan accent) and Change B panel (green accent)
- "Run Merge Simulation →" button at the bottom

**Scroll:** No  
**Emphasis:** The two-panel layout and the product tagline

---

### SCENE 8 — JWT Merge Simulation
**Route:** `/simulations` → `/simulations/[id]`  
**Duration:** ~60–75 seconds total (the most important scene)  
**Actions:**

**⚠️ IMPORTANT:** This simulation uses the built-in demo scenario. Demo Mode must be active.

**Activate Demo Mode (before recording this scene — or do it live):**
- Ensure you are signed in
- Click somewhere on the page that is **not** a text field (click the sidebar or main heading area)
- Press **K and P simultaneously** — a toast notification appears: "DEMO MODE ACTIVATED — Judge-ready scenarios are now available on the Analyze page"
- The `DemoSimScenarioSelector` panel appears on `/simulations` when Demo Mode is active

**If activating live during recording:**
1. Click the main area (not a text field) on the `/simulations` page
2. Press K+P simultaneously
3. Wait for the "Demo Mode Activated" toast (appears bottom-right, fades after 4 seconds)
4. The **Demo Simulation Scenario** panel appears above the input panels

**Load the scenario (10 seconds):**
5. In the **Demo Simulation Scenario** panel, click the first scenario: **"JWT Migration vs. Refresh Token Extension"**
   - Change A subtitle: "Migrate session auth to JWT access tokens"
   - Change B subtitle: "Extend session refresh window from 24h to 7 days"
6. The card highlights with a cyan border
7. A "Load both panels" button appears at the bottom of the panel
8. Click **"Load both panels"**
9. Both input panels are now filled — Change A (cyan) contains the JWT migration PR text, Change B (green) contains the Redis session refresh code
10. Pause 2 seconds — let the judge see the loaded content

**Submit (5 seconds):**
11. Move the mouse to **"Run Merge Simulation →"** button
12. Pause 1 second
13. Click it

**Wait for simulation (10–15 seconds):**
14. The page navigates to `/simulations/[id]`
15. The pipeline runs — stages animate through domain detection, conflict analysis, integration checks
16. Let it complete fully

**View result (30+ seconds — this is the keystone scene):**
17. When the result appears, DO NOT scroll immediately — pause and let it register
18. The **IntegrationVerdictCard** appears with:
    - `CONFLICT DETECTED` label in red-pink
    - Integration Risk Score: **100** in red with **CRITICAL RISK** label
    - Confidence: **93%**
    - Conflict count badges: Critical, Semantic
19. Below the scores, the signature callout box appears:
    - **"Git sees no conflict."** (white)
    - **"VERDICT found one."** (red-pink bold)
    - "These changes merge cleanly at the file level. VERDICT detected N semantic conflicts — incompatible behavioral assumptions that only manifest at runtime."
20. **PAUSE HERE — 8 to 10 seconds** — this is the competition's most powerful moment
21. In the top-right, confirm **`AI-ENHANCED · GROQ`** badge is visible — it should be here
22. Scroll down slowly past the IntegrationVerdictCard
23. Click the **"Conflicts"** tab
24. Pause on the semantic conflict cards — the "Authentication Mechanism Incompatibility" conflict should be the first visible card
25. Pause 4–5 seconds on the conflicts list

**What should be visible:**
- IntegrationVerdictCard: CONFLICT DETECTED · 100 · CRITICAL RISK · 93%
- The "Git sees no conflict. VERDICT found one." callout box
- AI-ENHANCED · GROQ badge
- Semantic conflict cards describing the incompatible behavioral assumptions

**Scroll:** Slow downward after pausing on verdict, then tab to Conflicts  
**Emphasis:** The CONFLICT DETECTED verdict, the 100/93% scores, and especially "Git sees no conflict. VERDICT found one."  
**Pause duration:** **8–10 seconds** on the verdict card (longer than all other scenes)

---

### SCENE 9 — Engineering Memory Search
**Route:** `/memory`  
**Duration:** 15–20 seconds  
**Actions:**
1. Click **"Engineering Memory"** in the sidebar
2. Let the page load — saved records should be visible (you populated these in the pre-recording checklist)
3. Pause 2 seconds — show the Memory Insights panel at the top (Approval Rate, Avg Risk Score, Top Domains, Verdict Breakdown) if records are present
4. Move the mouse to the **search bar** (placeholder: "Search memory…")
5. Click the search bar
6. Type your pre-confirmed search term slowly and deliberately (e.g., **`redis`** or **`parameterized`**)
7. Matching records appear in real time as you type
8. Pause 3 seconds on the results — the matching record(s) should show their verdict badge and risk score
9. If results show, move the mouse gently over a result row to trigger the hover state

**What should be visible:**
- Engineering Memory header: "Engineering Memory"
- Memory Insights panel with real statistics (if records exist)
- The search bar
- Search results appearing as you type
- Each result card showing: title, verdict badge (color-coded), risk score

**Note:** The search searches across: title, verdictRationale, changeType, input.content, input.description, input.projectContext, input.fileContext, context.summary, context.detectedDomain, finding titles/descriptions. A word from the code content (e.g., `redis`, `parameterized`) will match against `input.content`.

**Scroll:** No (results are visible without scrolling if < 4 records)  
**Emphasis:** The search interaction and the instant filtered results  
**Pause duration:** 3 seconds on results

---

### SCENE 10 — Final — Analyses History
**Route:** `/analyses`  
**Duration:** 8–10 seconds  
**Actions:**
1. Click **"Analyses"** in the sidebar
2. Let the page load
3. The full list of completed analyses is shown — each row displays: change type icon, risk badge, verdict badge, risk score, title, and rationale snippet
4. Move the mouse slowly over a row with a high-risk result to show the hover state
5. Pause — let the judge see the full list of analyses with varied verdicts and scores
6. Slowly scroll down if there are more than 3 results

**What should be visible:**
- "Change Analyses" header
- Each analysis row: colored verdict badge (Revision, Conditions), risk score number, change type badge
- Diverse risk levels across the list (e.g., 88 for SQL injection, 56 for logger)
- "IN MEMORY" badge visible on items saved to Engineering Memory

**Scroll:** Slow scroll if needed  
**Emphasis:** The breadth of analysis types and the varied verdict outcomes — this communicates that VERDICT handles diverse real-world changes

---

### SCENE 11 — Final Frame — Dashboard
**Route:** `/dashboard`  
**Duration:** 5–6 seconds  
**Actions:**
1. Click **"Dashboard"** in the sidebar
2. Let the page load — now the dashboard should show **real activity** from the analyses just run
3. The metric cards show: Analyses Run (number), Requires Attention (risk count), Approval Rate (%)
4. The Activity Timeline on the left shows recent analysis events
5. The Recent Analyses table on the right shows the analyses with their risk levels and status
6. Move the mouse slowly across the metric cards
7. Pause — hold this frame as the final shot

**What should be visible:**
- "Engineering Intelligence" header
- Three metric cards with real numbers populated from the demo runs
- Activity Timeline showing recent events
- Recent Analyses table with verdict status indicators
- The VERDICT sidebar with "Change Intelligence" subtitle

**Scroll:** No  
**Emphasis:** The populated, data-rich dashboard — communicates that VERDICT builds an ongoing picture of engineering activity  
**Pause duration:** 5–6 seconds — this is the final frame, hold it

---

## TIMING SUMMARY

| Scene | Route | Target Duration |
|---|---|---|
| 1 — Landing hero | `/` | 4–5s |
| 2 — Landing scroll | `/` | 5–6s |
| 3 — Dashboard | `/dashboard` | 4–5s |
| 4 — New Analysis form | `/analyze` | 5–6s |
| 5 — SQL injection (high risk) | `/analyze` → result | 45–60s |
| 6 — Logger (low risk) | `/analyze` → result | 45–60s |
| 7 — Simulations input | `/simulations` | 4–5s |
| 8 — JWT merge simulation | `/simulations` → result | 60–75s |
| 9 — Engineering Memory search | `/memory` | 15–20s |
| 10 — Analyses history | `/analyses` | 8–10s |
| 11 — Final dashboard | `/dashboard` | 5–6s |
| **TOTAL** | | **~3:20 – 4:00** |

---

## MOUSE MOVEMENT RULES

- Move the mouse **slowly and deliberately** — never jerk or wave
- When pausing on an important result, **park the mouse at a corner** away from the text you want readable
- When highlighting a UI element, move to it and **stop** — don't circle or hover/unhover repeatedly
- Between scenes, slide the mouse to the sidebar in a smooth arc before clicking
- Never move the mouse while text is being read — let the judge read first, then move
- When waiting for analysis results, keep the mouse near the pipeline stages panel so the running animation is the visual focus

---

## WHAT TO AVOID

- Do NOT open DevTools, terminal, or any file manager during recording
- Do NOT show the browser address bar typing in detail — navigate by clicking links/sidebar only
- Do NOT show `.env.local` or any file with API keys
- Do NOT pause on the Settings page long enough to show any key values
- Do NOT manually edit any numbers or results visible on screen
- Do NOT navigate to `/settings` during the recording (it shows provider configuration fields)
- Do NOT expose the authentication email in the sidebar if it contains personal information — consider using a demo account with a generic email like `demo@verdict.app`

---

## POST-RECORDING CHECKLIST

- [ ] Watch the full recording back before uploading
- [ ] Confirm: no API keys, `.env.local` contents, or personal secrets are visible at any point
- [ ] Confirm: the "Git sees no conflict. VERDICT found one." callout is clearly readable in Scene 8
- [ ] Confirm: the AI-ENHANCED · GROQ badge is visible in at least one result scene
- [ ] Confirm: the Engineering Memory search returns a real result in Scene 9
- [ ] Confirm: the total recording duration is between 3 and 4 minutes
- [ ] Upload to a public platform (YouTube unlisted, Vimeo, or Google Drive with Anyone-can-view link)
- [ ] Test the link in a private/incognito window — confirm it plays without login
- [ ] Paste the verified public URL into the competition submission form's "Video demonstration" field
