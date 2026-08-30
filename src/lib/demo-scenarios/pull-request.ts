// ============================================================
// Demo Scenario — Pull Request: JWT Authentication Migration
// Realistic PR description with implementation context.
// ============================================================

import type { DemoScenario } from "./types";

export const jwtMigrationScenario: DemoScenario = {
  id: "jwt-auth-migration",
  changeType: "pr",
  title: "JWT Authentication Migration",
  description: "Migrate session-based authentication to stateless JWT access tokens with refresh token rotation.",
  previewBullets: [
    "Token expiry and session invalidation behavior",
    "Refresh token rotation and replay attack surface",
    "Backward compatibility with existing active sessions",
    "Logout and forced sign-out propagation",
    "Security implications of stateless token verification",
  ],
  inputTitle: "feat(auth): migrate session auth to JWT with refresh token rotation",
  projectContext: "auth-service",
  fileContext: "src/auth/session.ts, src/auth/jwt.ts, src/middleware/auth.ts, src/routes/auth.ts",
  additionalContext:
    "Motivation: horizontal scaling of the API tier requires stateless authentication. The current server-side session store (Redis) is a bottleneck at 40k concurrent users. This PR introduces JWT access tokens (15 min TTL) with rotating refresh tokens (7 day TTL). Existing sessions remain valid for 7 days after this deployment, after which they expire naturally.",
  content: `## PR Summary

**feat(auth): migrate session auth to JWT with refresh token rotation**

Closes #1847 — Stateless authentication for horizontal API scaling

---

### Background

The current authentication system stores session state in Redis. At peak load (40k+ concurrent users), the Redis session store becomes a write bottleneck: P99 session validation latency has reached 340ms. Horizontal scaling of the API tier is blocked because every new API instance requires session store access.

This PR migrates to stateless JWT-based authentication, eliminating the per-request Redis lookup for token validation.

---

### What changed

**New token model:**
- Access token: signed JWT, 15-minute TTL, verified locally (no Redis read)
- Refresh token: opaque 64-byte random token, stored in \`refresh_tokens\` table, 7-day TTL, rotated on every use

**Auth flow:**
1. \`POST /auth/login\` returns \`{ accessToken, refreshToken }\`
2. Client stores refresh token in \`httpOnly\` cookie; access token in memory
3. On access token expiry, client calls \`POST /auth/refresh\`
4. Refresh returns new access token + new refresh token (old one immediately invalidated)
5. \`POST /auth/logout\` deletes the refresh token from DB; access token expires naturally

**Middleware changes:**
- \`authenticate()\` middleware now verifies JWT signature locally
- Removed \`req.session\` — request context now uses \`req.user\` (decoded JWT payload)
- Session middleware removed from the Express stack

**Backward compatibility:**
- Existing Redis sessions remain valid for 7 days (natural expiry)
- The login endpoint accepts both old and new clients during transition
- Legacy \`/auth/verify-session\` endpoint kept alive for 30 days, returning 401 after that

---

### Changed files

\`\`\`
src/auth/jwt.ts              — NEW: sign/verify access tokens, RS256 key pair
src/auth/refresh-token.ts    — NEW: issue/rotate/revoke refresh tokens
src/auth/session.ts          — MODIFIED: kept for backward compat, no new sessions issued
src/middleware/auth.ts       — MODIFIED: JWT verification replaces session lookup
src/routes/auth.ts           — MODIFIED: login/refresh/logout handlers
src/routes/legacy-session.ts — NEW: 30-day shim for /auth/verify-session
db/migrations/20240401_refresh_tokens.sql — NEW: refresh_tokens table
\`\`\`

---

### Security considerations

- RS256 (asymmetric): private key never leaves auth-service; public key distributed to API instances
- Refresh token rotation: each refresh invalidates the previous token; concurrent refresh attempts are detected
- No sensitive data in JWT payload: only \`sub\` (user ID), \`iat\`, \`exp\`, \`jti\`
- Refresh tokens are hashed (SHA-256) at rest in the database

---

### Deployment plan

1. Deploy auth-service with this PR (new token issuance begins)
2. Allow existing sessions to expire naturally (≤7 days)
3. After 7 days: remove legacy session middleware
4. After 30 days: decommission \`/auth/verify-session\` shim
5. After 30 days: drain Redis session store

---

### Testing

- Unit: JWT sign/verify, refresh token rotation, replay detection
- Integration: full login → refresh → logout flow
- Load: 10k concurrent token verifications with no Redis — P99 < 5ms (vs 340ms baseline)
`,
};
