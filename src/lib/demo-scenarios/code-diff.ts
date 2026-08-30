// ============================================================
// Demo Scenario — Code Diff: Database Column Migration
// Realistic unified diff — user_profiles table column rename
// with partial backward-compatibility concerns.
// ============================================================

import type { DemoScenario } from "./types";

export const dbMigrationScenario: DemoScenario = {
  id: "db-column-migration",
  changeType: "diff",
  title: "Database Column Migration",
  description: "Renames a heavily-used database column and updates the ORM model with partial backward compatibility.",
  previewBullets: [
    "Schema migration safety and rollback path",
    "Consumer compatibility across services",
    "ORM model / raw query consistency",
    "Zero-downtime deployment feasibility",
    "Index coverage after rename",
  ],
  inputTitle: "Rename user_profiles.full_name → display_name (schema + model)",
  language: "TypeScript",
  projectContext: "user-service",
  fileContext: "prisma/schema.prisma, src/models/user-profile.ts, src/services/profile-service.ts, migrations/20240318_rename_full_name.sql",
  additionalContext:
    "This rename aligns the database schema with the API contract. The old column name `full_name` leaks into public endpoints. We are keeping a database-level alias view for the 30-day migration window to support legacy consumers, but the Prisma model and all new queries must use `display_name` from this commit forward.",
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
   bio         String?
   timezone    String   @default("UTC")
   createdAt   DateTime @default(now()) @map("created_at")
   updatedAt   DateTime @updatedAt @map("updated_at")

   @@map("user_profiles")
   @@index([userId])
 }

diff --git a/src/models/user-profile.ts b/src/models/user-profile.ts
index 7d21a33..a8c92f0 100644
--- a/src/models/user-profile.ts
+++ b/src/models/user-profile.ts
@@ -1,11 +1,12 @@
 export interface UserProfile {
   id: string;
   userId: string;
-  fullName: string;
+  displayName: string;
   avatarUrl: string | null;
   bio: string | null;
   timezone: string;
   createdAt: Date;
   updatedAt: Date;
+  /** @deprecated Use displayName. Kept for 30-day migration window. */
+  fullName?: string;
 }

diff --git a/src/services/profile-service.ts b/src/services/profile-service.ts
index 2f4d891..3a71e4c 100644
--- a/src/services/profile-service.ts
+++ b/src/services/profile-service.ts
@@ -12,7 +12,7 @@ export async function updateDisplayName(
   userId: string,
   name: string
 ): Promise<UserProfile> {
-  return prisma.userProfile.update({
+  const result = await prisma.userProfile.update({
     where: { userId },
-    data: { fullName: name },
+    data: { displayName: name },
   });
+  return result;
 }

 export async function getProfile(userId: string): Promise<UserProfile | null> {
   return prisma.userProfile.findUnique({ where: { userId } });
 }

+// Legacy adapter: maps displayName → fullName for consumers
+// that read the old field during the migration window.
+export function withLegacyCompat(profile: UserProfile): UserProfile {
+  return { ...profile, fullName: profile.displayName };
+}

diff --git a/migrations/20240318_rename_full_name.sql b/migrations/20240318_rename_full_name.sql
new file mode 100644
index 0000000..f1c8a3d
--- /dev/null
+++ b/migrations/20240318_rename_full_name.sql
@@ -0,0 +1,14 @@
+-- Migration: rename full_name → display_name in user_profiles
+-- This migration is designed for zero-downtime deployment.
+-- Step 1: Add new column and copy data
+ALTER TABLE user_profiles ADD COLUMN display_name VARCHAR(255);
+UPDATE user_profiles SET display_name = full_name;
+ALTER TABLE user_profiles ALTER COLUMN display_name SET NOT NULL;
+
+-- Step 2: Create index on new column matching existing index
+CREATE INDEX CONCURRENTLY idx_user_profiles_display_name ON user_profiles(display_name);
+
+-- Step 3: Create compatibility view (not dropping old column in this migration)
+-- The full_name column will be removed in migration 20240418_drop_full_name.sql
+-- after 30-day consumer migration window closes.
`,
};
