// ============================================================
// VERDICT Demo Scenarios — Simulation Pairs
// Two realistic merge simulation scenarios.
// Inputs only — the real semantic conflict engine runs.
// ============================================================

import type { DemoSimulationScenario } from "./types";

export const jwtSessionSimulation: DemoSimulationScenario = {
  id: "jwt-session-conflict",
  title: "JWT Migration vs. Refresh Token Extension",
  description: "Two concurrent auth changes: one migrates to JWT, the other extends existing session refresh logic.",
  changeA: {
    title: "Migrate session auth to JWT access tokens",
    changeType: "pr",
    content: `## feat(auth): replace Redis session store with JWT access tokens

Migration from server-side sessions to stateless JWT authentication.

- Access tokens: RS256 signed, 15-min TTL, verified locally by middleware
- Refresh tokens: opaque, stored in refresh_tokens DB table, 7-day TTL, rotated on use
- Middleware updated: req.session removed; req.user populated from decoded JWT
- Login endpoint now returns { accessToken, refreshToken } instead of setting session cookie
- POST /auth/logout deletes refresh token row; access token expires naturally at TTL
- Existing Redis sessions remain valid during 7-day migration window`,
    description: "Horizontal scaling initiative — eliminates Redis session bottleneck",
  },
  changeB: {
    title: "Extend session refresh window from 24h to 7 days",
    changeType: "code",
    content: `// src/auth/session-refresh.ts
// Extending refresh window from 24 hours to 7 days
// to reduce friction for mobile clients on intermittent networks.

import { redis } from "../redis";
import { generateSessionToken } from "./tokens";

const SESSION_TTL_SECONDS = 7 * 24 * 60 * 60; // 7 days (was: 86400)
const REFRESH_WINDOW_SECONDS = 6 * 24 * 60 * 60; // Refresh valid in last 6 days of TTL

export async function refreshSession(currentToken: string): Promise<{
  token: string;
  expiresAt: Date;
}> {
  const sessionData = await redis.get(\`session:\${currentToken}\`);
  if (!sessionData) throw new Error("Session not found or expired");

  const session = JSON.parse(sessionData);
  const ageSeconds = Math.floor((Date.now() - session.createdAt) / 1000);

  if (ageSeconds < SESSION_TTL_SECONDS - REFRESH_WINDOW_SECONDS) {
    // Not in refresh window yet — return existing session unchanged
    return { token: currentToken, expiresAt: new Date(session.createdAt + SESSION_TTL_SECONDS * 1000) };
  }

  // Issue new session token
  const newToken = generateSessionToken();
  const newSession = { ...session, createdAt: Date.now() };

  await redis.pipeline()
    .set(\`session:\${newToken}\`, JSON.stringify(newSession), "EX", SESSION_TTL_SECONDS)
    .del(\`session:\${currentToken}\`)
    .exec();

  return {
    token: newToken,
    expiresAt: new Date(Date.now() + SESSION_TTL_SECONDS * 1000),
  };
}`,
    description: "Mobile UX improvement — reduce forced re-login on intermittent connections",
  },
};

export const dbRenameSimulation: DemoSimulationScenario = {
  id: "db-rename-conflict",
  title: "Column Rename vs. Legacy Writer",
  description: "A database column rename migration collides with a service still writing to the old column name.",
  changeA: {
    title: "Rename user_profiles.full_name → display_name",
    changeType: "diff",
    content: `diff --git a/prisma/schema.prisma b/prisma/schema.prisma
index 3c8f1a2..d9e4b71 100644
--- a/prisma/schema.prisma
+++ b/prisma/schema.prisma
@@ -18,7 +18,7 @@ model UserProfile {
   id          String   @id @default(cuid())
   userId      String   @unique @map("user_id")
-  fullName    String   @map("full_name")
+  displayName String   @map("display_name")
   avatarUrl   String?  @map("avatar_url")
   createdAt   DateTime @default(now()) @map("created_at")
   @@map("user_profiles")
 }

diff --git a/migrations/20240318_rename_full_name.sql b/migrations/20240318_rename_full_name.sql
new file mode 100644
--- /dev/null
+++ b/migrations/20240318_rename_full_name.sql
@@ -0,0 +1,6 @@
+ALTER TABLE user_profiles ADD COLUMN display_name VARCHAR(255);
+UPDATE user_profiles SET display_name = full_name;
+ALTER TABLE user_profiles ALTER COLUMN display_name SET NOT NULL;
+CREATE INDEX CONCURRENTLY idx_user_profiles_display_name ON user_profiles(display_name);
+-- full_name column dropped in follow-up migration after 30-day window`,
    description: "Schema alignment: full_name leaks internal naming into the public API",
  },
  changeB: {
    title: "Notification service: write user display name on event",
    changeType: "code",
    content: `// notification-service/src/handlers/user-events.ts
// Listens to user.profile_updated events and caches display
// name in the notification preferences store for personalization.

import { prisma } from "../db";
import { eventBus } from "../events";
import { logger } from "../logger";

eventBus.on("user.profile_updated", async (event: {
  userId: string;
  updatedFields: string[];
}) => {
  try {
    // Fetch fresh profile to get updated name for notification templates
    const profile = await prisma.$queryRaw<{ full_name: string }[]>\`
      SELECT full_name FROM user_profiles WHERE user_id = \${event.userId}
    \`;

    if (!profile.length) {
      logger.warn({ userId: event.userId }, "Profile not found for notification update");
      return;
    }

    await prisma.notificationPreference.upsert({
      where: { userId: event.userId },
      update: { cachedDisplayName: profile[0].full_name },
      create: {
        userId: event.userId,
        cachedDisplayName: profile[0].full_name,
        emailEnabled: true,
        pushEnabled: false,
      },
    });

    logger.info({ userId: event.userId }, "Notification preference updated");
  } catch (err) {
    logger.error({ userId: event.userId, err }, "Failed to update notification preference");
  }
});`,
    description: "Adds personalized display name to notification templates",
  },
};
