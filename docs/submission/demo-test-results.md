# VERDICT — Demo Test Results

> Verified results from VERDICT demo scenarios.
> All verdicts, scores, and findings documented below were observed from actual application runs.

---

## Test A — SQL Injection Vulnerability

### Input

**Change Type:** Diff

**Content:**
```diff
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

### Verified Result

| Field | Value |
|---|---|
| **Verdict** | REQUIRES REVISION |
| **Risk Score** | 88 / 100 |
| **Risk Level** | HIGH RISK |
| **Critical Findings** | 1 |
| **AI Provider** | Groq (`llama-3.1-8b-instant`) |

### Verified Behavior

VERDICT correctly identified that the change replaces a parameterized query (`?` placeholder with bound parameter) with direct string interpolation of `req.query.id` into a raw SQL string. The critical finding flags this as a SQL injection vulnerability — despite the commit description framing it as a "simplification." The change is syntactically valid JavaScript. No linter would flag it.

---

## Test B — API Contract / Input Validation

### Input

**Change Type:** Diff

**Content:**
```diff
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

**Description:** Adds input validation to reject missing or non-numeric id before querying, to prevent malformed requests reaching the database.

### Result Status

> ⚠️ **Live verification required.** This scenario is available as a demo analysis. The specific verdict and score should be confirmed by running the analysis live. The expected behavior is that VERDICT identifies the API contract change — requests that previously reached the database with a missing or non-numeric id will now receive a 400 response, potentially breaking existing clients that send such requests.

---

## Test C — Safe Logger Addition

### Input

**Change Type:** Diff

**Content:**
```diff
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

### Verified Result

| Field | Value |
|---|---|
| **Verdict** | APPROVED WITH CONDITIONS |
| **Risk Score** | 56 / 100 |
| **Risk Level** | MEDIUM RISK |
| **Critical Findings** | 0 |
| **AI Provider** | Groq (`llama-3.1-8b-instant`) |

### Verified Behavior

VERDICT recognized that the logger is properly imported, the log message is generic ("Fetched user by id" — the raw `id` value is not logged), and the change does not alter query logic, response behavior, or existing code paths. The medium risk score and "Approved with Conditions" verdict reflect standard caution for production code changes rather than any detected security or behavioral issue.

**Key contrast with Test A:** Both changes modify the same route file. Test A (SQL injection) received `REQUIRES REVISION` at 88/100. Test C (safe logger) received `APPROVED WITH CONDITIONS` at 56/100 with zero critical findings. VERDICT understood the semantic difference.

---

## Merge Simulation — JWT Migration vs. Session Refresh Extension

### Input

**Scenario:** JWT Migration vs. Refresh Token Extension (built-in demo scenario)

**Change A — Migrate session auth to JWT access tokens:**
- Migrates from Redis server-side sessions to stateless JWT authentication
- Access tokens: RS256 signed, 15-min TTL, verified locally by middleware
- Refresh tokens: opaque, stored in `refresh_tokens` DB table, 7-day TTL
- Removes `req.session`; login endpoint returns `{ accessToken, refreshToken }`
- Redis sessions remain valid during a 7-day migration window

**Change B — Extend session refresh window from 24h to 7 days:**
- Extends Redis session TTL from `86400` (24h) to `604800` (7 days)
- Adds a 6-day refresh window for mobile clients on intermittent networks
- Calls `redis.get()`, `redis.pipeline().set().del().exec()` to rotate session tokens
- Depends entirely on the Redis session infrastructure

### Verified Result

| Field | Value |
|---|---|
| **Verdict** | CONFLICT DETECTED |
| **Integration Risk Score** | 100 / 100 |
| **Risk Level** | CRITICAL RISK |
| **Confidence** | 93% |
| **Conflicts Found** | Multiple semantic conflicts |
| **AI Provider** | Groq (`llama-3.1-8b-instant`) |

### Verified Behavior

Git would merge these changes cleanly — they modify different files with no overlapping lines. VERDICT detected the semantic conflict:

> **"Git sees no conflict. VERDICT found one."**

The core conflict: Change A removes the Redis session infrastructure. Change B extends the lifetime of that same Redis session infrastructure. After the JWT migration, the session refresh logic in Change B has nothing to operate on — `redis.get('session:...')` returns null because no new sessions are being created.

**Consequence:** Users experience silent authentication failures. The refresh flow attempts to rotate sessions in a Redis store that is no longer being populated. Users are logged out and cannot re-authenticate through the refresh path.

The semantic conflict engine matched the "Authentication Mechanism Incompatibility" template — both changes touch the authentication domain with conflicting assumptions about whether sessions or JWT tokens are the active authentication mechanism.

---

## Analysis Contrast Summary

| Test | Verdict | Risk Score | Critical | Key Insight |
|---|---|---|---|---|
| A — SQL Injection | REQUIRES REVISION | 88 | 1 | Security regression hidden in "simplification" |
| B — API Contract | *Live verification needed* | — | — | Behavioral change hidden in "validation" |
| C — Safe Logger | APPROVED WITH CONDITIONS | 56 | 0 | Genuinely low-risk, properly scoped change |
| Simulation — JWT | CONFLICT DETECTED | 100 | Multiple | Semantic conflict invisible to Git |

These results demonstrate VERDICT's core value: reasoning about **what changes actually do**, not just whether they are syntactically valid.
