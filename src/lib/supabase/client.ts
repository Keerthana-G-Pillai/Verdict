// ============================================================
// VERDICT — Supabase Browser Client
// Use this in client components ("use client").
// Gracefully handles missing Supabase configuration.
// ============================================================

import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "./database.types";

export const SUPABASE_CONFIGURED =
  !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
  !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
  process.env.NEXT_PUBLIC_SUPABASE_URL !== "" &&
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY !== "";

export function createClient() {
  if (!SUPABASE_CONFIGURED) {
    // Return a stub client that throws on use — caught by auth context
    throw new Error("Supabase not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.");
  }
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
