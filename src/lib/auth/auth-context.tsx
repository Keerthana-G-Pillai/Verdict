// ============================================================
// VERDICT — Auth Context
// Provides session state to the entire app.
// Works with Supabase SSR — session is hydrated server-side,
// then kept live via onAuthStateChange on the client.
//
// GRACEFUL DEGRADATION: When Supabase is not configured
// (NEXT_PUBLIC_SUPABASE_URL is empty), the app runs in
// guest-only mode — all analysis features work, saving to
// cloud is disabled with a clear message.
// ============================================================

"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { SUPABASE_CONFIGURED } from "@/lib/supabase/client";

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  loading: boolean;
  supabaseConfigured: boolean;
  signUp: (email: string, password: string, displayName?: string) => Promise<{ error: string | null }>;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  session: null,
  user: null,
  loading: false,
  supabaseConfigured: false,
  signUp: async () => ({ error: "Authentication not configured" }),
  signIn: async () => ({ error: "Authentication not configured" }),
  signOut: async () => {},
});

export function AuthProvider({ children, initialSession }: { children: React.ReactNode; initialSession?: Session | null }) {
  const [session, setSession] = useState<Session | null>(initialSession ?? null);
  const [loading, setLoading] = useState(SUPABASE_CONFIGURED && !initialSession);

  useEffect(() => {
    if (!SUPABASE_CONFIGURED) return;

    // Dynamically import to avoid crashing when unconfigured
    import("@/lib/supabase/client").then(({ createClient }) => {
      try {
        const supabase = createClient();

        if (!initialSession) {
          supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            setLoading(false);
          });
        }

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
          setSession(session);
          setLoading(false);
        });

        return () => subscription.unsubscribe();
      } catch {
        setLoading(false);
      }
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const signUp = useCallback(async (email: string, password: string, displayName?: string) => {
    if (!SUPABASE_CONFIGURED) return { error: "Authentication is not configured for this deployment." };
    try {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { display_name: displayName || email.split("@")[0] },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      return { error: error?.message ?? null };
    } catch (e) {
      return { error: e instanceof Error ? e.message : "Sign up failed" };
    }
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    if (!SUPABASE_CONFIGURED) return { error: "Authentication is not configured for this deployment." };
    try {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      return { error: error?.message ?? null };
    } catch (e) {
      return { error: e instanceof Error ? e.message : "Sign in failed" };
    }
  }, []);

  const signOut = useCallback(async () => {
    if (!SUPABASE_CONFIGURED) return;
    try {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      await supabase.auth.signOut();
      setSession(null);
    } catch { /* ignore */ }
  }, []);

  return (
    <AuthContext.Provider value={{
      session,
      user: session?.user ?? null,
      loading,
      supabaseConfigured: SUPABASE_CONFIGURED,
      signUp,
      signIn,
      signOut,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
