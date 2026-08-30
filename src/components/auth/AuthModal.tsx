// ============================================================
// VERDICT — Auth Modal
// Integrated sign-in / sign-up modal matching the VERDICT
// design system. Clean, properly spaced, no layout breaks.
// ============================================================

"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useAuth } from "@/lib/auth/auth-context";

type Mode = "signin" | "signup";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultMode?: Mode;
  onSuccess?: () => void;
  promptMessage?: string;
}

function validateEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validatePassword(password: string) {
  if (password.length < 8) return "Password must be at least 8 characters";
  return null;
}

export default function AuthModal({ isOpen, onClose, defaultMode = "signin", onSuccess, promptMessage }: AuthModalProps) {
  const { signIn, signUp, supabaseConfigured } = useAuth();
  const [mode, setMode] = useState<Mode>(defaultMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => { setMode(defaultMode); }, [defaultMode]);

  useEffect(() => {
    if (!isOpen) {
      setEmail(""); setPassword(""); setDisplayName("");
      setError(""); setSuccess(""); setLoading(false);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!validateEmail(email)) { setError("Please enter a valid email address."); return; }
    const pwErr = validatePassword(password);
    if (pwErr) { setError(pwErr); return; }

    setLoading(true);

    if (mode === "signup") {
      const { error: signUpError } = await signUp(email, password, displayName.trim() || undefined);
      if (signUpError) { setError(signUpError); setLoading(false); return; }
      setSuccess("Account created! You're now signed in.");
      setTimeout(() => { onSuccess ? onSuccess() : onClose(); }, 1200);
    } else {
      const { error: signInError } = await signIn(email, password);
      if (signInError) {
        setError(signInError.includes("Invalid login") ? "Invalid email or password." : signInError);
        setLoading(false);
        return;
      }
      onSuccess ? onSuccess() : onClose();
    }

    setLoading(false);
  }, [mode, email, password, displayName, signIn, signUp, onClose, onSuccess]);

  if (!isOpen) return null;

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.75)", backdropFilter: "blur(6px)" }}
      onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
    >
      <div
        className="w-full relative"
        style={{
          maxWidth: "420px",
          backgroundColor: "#16161a",
          border: "1px solid #2a2a2e",
          borderRadius: "16px",
          boxShadow: "0 0 0 1px rgba(0,240,255,0.06), 0 24px 64px rgba(0,0,0,0.6)",
        }}
      >
        {/* Top bar — logo + close */}
        <div
          className="flex items-center justify-between px-6 py-4"
          style={{ borderBottom: "1px solid #1e1e22" }}
        >
          <div className="flex items-center gap-2.5">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
              style={{
                background: "rgba(0,240,255,0.1)",
                border: "1px solid rgba(0,240,255,0.2)",
              }}
            >
              <svg width="15" height="15" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                <path d="M4 3L10 14L16 3" stroke="#00f0ff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M7.5 3L10 8L12.5 3" stroke="#00f0ff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                <circle cx="10" cy="16.5" r="1.5" fill="#00f0ff" />
              </svg>
            </div>
            <span className="font-bold text-on-surface" style={{ fontSize: "14px", letterSpacing: "-0.01em" }}>VERDICT</span>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-all"
            aria-label="Close"
          >
            <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>close</span>
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-6">
          {/* Supabase not configured */}
          {!supabaseConfigured && (
            <div
              className="flex items-start gap-3 px-4 py-3 rounded-lg mb-5"
              style={{ backgroundColor: "rgba(255,185,95,0.06)", border: "1px solid rgba(255,185,95,0.2)" }}
            >
              <span className="material-symbols-outlined text-[15px] shrink-0 mt-0.5" style={{ color: "#ffb95f" }}>warning</span>
              <div>
                <p className="text-body-sm font-medium" style={{ color: "#ffb95f" }}>Authentication not configured</p>
                <p className="text-on-surface-variant mt-1" style={{ fontSize: "12px", lineHeight: "1.5" }}>
                  Add <code style={{ fontFamily: "monospace", background: "#1e1e22", padding: "1px 5px", borderRadius: "3px", fontSize: "11px" }}>NEXT_PUBLIC_SUPABASE_URL</code>{" "}
                  and <code style={{ fontFamily: "monospace", background: "#1e1e22", padding: "1px 5px", borderRadius: "3px", fontSize: "11px" }}>NEXT_PUBLIC_SUPABASE_ANON_KEY</code>{" "}
                  to <code style={{ fontFamily: "monospace", background: "#1e1e22", padding: "1px 5px", borderRadius: "3px", fontSize: "11px" }}>.env.local</code>
                </p>
              </div>
            </div>
          )}

          {/* Prompt message */}
          {promptMessage && !success && (
            <div
              className="flex items-start gap-3 px-4 py-3 rounded-lg mb-5"
              style={{ backgroundColor: "rgba(0,240,255,0.05)", border: "1px solid rgba(0,240,255,0.12)" }}
            >
              <span className="material-symbols-outlined text-[15px] shrink-0 mt-0.5" style={{ color: "#00f0ff" }}>info</span>
              <p style={{ fontSize: "13px", color: "#b9cacb", lineHeight: "1.5" }}>{promptMessage}</p>
            </div>
          )}

          {/* Success state */}
          {success ? (
            <div className="flex flex-col items-center text-center py-8">
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center mb-4"
                style={{ backgroundColor: "rgba(111,251,190,0.1)", border: "1px solid rgba(111,251,190,0.25)" }}
              >
                <span className="material-symbols-outlined text-[28px]" style={{ color: "#6ffbbe" }}>check</span>
              </div>
              <p className="font-semibold text-on-surface" style={{ fontSize: "16px" }}>{success}</p>
              <p className="text-on-surface-variant mt-1" style={{ fontSize: "13px" }}>Redirecting…</p>
            </div>
          ) : (
            <>
              {/* Heading */}
              <h2 className="text-on-surface font-bold mb-1" style={{ fontSize: "22px", letterSpacing: "-0.02em" }}>
                {mode === "signin" ? "Sign in" : "Create account"}
              </h2>
              <p className="text-on-surface-variant mb-6" style={{ fontSize: "14px" }}>
                {mode === "signin"
                  ? "Access your engineering intelligence."
                  : "Start building your engineering memory."}
              </p>

              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                {mode === "signup" && (
                  <div>
                    <label className="block mb-1.5" style={{ fontSize: "11px", fontFamily: "var(--font-mono)", textTransform: "uppercase", letterSpacing: "0.06em", color: "#849495" }}>
                      Display Name <span style={{ textTransform: "none", letterSpacing: "normal", opacity: 0.6 }}>— optional</span>
                    </label>
                    <input
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="e.g. Alex Kim"
                      className="input-base w-full"
                      style={{ padding: "10px 14px", fontSize: "14px" }}
                      autoComplete="name"
                    />
                  </div>
                )}

                <div>
                  <label className="block mb-1.5" style={{ fontSize: "11px", fontFamily: "var(--font-mono)", textTransform: "uppercase", letterSpacing: "0.06em", color: "#849495" }}>
                    Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setError(""); }}
                    placeholder="you@company.com"
                    className="input-base w-full"
                    style={{ padding: "10px 14px", fontSize: "14px" }}
                    required
                    autoComplete="email"
                    autoFocus
                  />
                </div>

                <div>
                  <label className="block mb-1.5" style={{ fontSize: "11px", fontFamily: "var(--font-mono)", textTransform: "uppercase", letterSpacing: "0.06em", color: "#849495" }}>
                    Password
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setError(""); }}
                    placeholder={mode === "signup" ? "Min. 8 characters" : "••••••••"}
                    className="input-base w-full"
                    style={{ padding: "10px 14px", fontSize: "14px" }}
                    required
                    autoComplete={mode === "signup" ? "new-password" : "current-password"}
                  />
                </div>

                {error && (
                  <div
                    className="flex items-center gap-2 px-3 py-2.5 rounded-lg"
                    style={{ backgroundColor: "rgba(255,180,171,0.07)", border: "1px solid rgba(255,180,171,0.18)" }}
                  >
                    <span className="material-symbols-outlined shrink-0" style={{ fontSize: "15px", color: "#ffb4ab" }}>error</span>
                    <p style={{ fontSize: "13px", color: "#ffb4ab" }}>{error}</p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 bg-primary-container text-on-primary-fixed-variant font-semibold rounded-lg hover:bg-primary-fixed-dim transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
                  style={{ padding: "11px 16px", fontSize: "14px", boxShadow: "0 0 16px rgba(0,240,255,0.2)", marginTop: "2px" }}
                >
                  {loading ? (
                    <><span className="material-symbols-outlined animate-spin" style={{ fontSize: "16px" }}>progress_activity</span>
                    {mode === "signin" ? "Signing in…" : "Creating account…"}</>
                  ) : (
                    mode === "signin" ? "Sign in →" : "Create account →"
                  )}
                </button>
              </form>

              {/* Mode switcher */}
              <p className="text-center mt-5" style={{ fontSize: "13px", color: "#849495" }}>
                {mode === "signin" ? "Don't have an account?" : "Already have an account?"}{" "}
                <button
                  onClick={() => { setMode(mode === "signin" ? "signup" : "signin"); setError(""); }}
                  style={{ color: "#00f0ff", fontWeight: 500 }}
                  className="hover:underline"
                >
                  {mode === "signin" ? "Sign up" : "Sign in"}
                </button>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
