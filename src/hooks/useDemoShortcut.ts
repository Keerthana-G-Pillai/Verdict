"use client";
// ============================================================
// useDemoShortcut — K + P simultaneous keypress
// Only fires when:
//   1. The user is authenticated
//   2. Focus is NOT inside a text input/textarea/select/contenteditable
//   3. Demo mode is not already active
// ============================================================

import { useEffect, useRef } from "react";
import { useAuth } from "@/lib/auth/auth-context";
import { useDemoStore } from "@/store/demo-store";

function isTypingTarget(el: Element | null): boolean {
  if (!el) return false;
  const tag = (el as HTMLElement).tagName?.toLowerCase();
  if (tag === "input" || tag === "textarea" || tag === "select") return true;
  if ((el as HTMLElement).isContentEditable) return true;
  return false;
}

export function useDemoShortcut() {
  const { user } = useAuth();
  const { active, activate } = useDemoStore();
  // Track currently held keys
  const held = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!user || active) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (isTypingTarget(document.activeElement)) return;
      held.current.add(e.key.toLowerCase());
      if (held.current.has("k") && held.current.has("p")) {
        e.preventDefault();
        activate();
        held.current.clear();
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      held.current.delete(e.key.toLowerCase());
    };

    const onBlur = () => { held.current.clear(); };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("blur", onBlur);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("blur", onBlur);
    };
  }, [user, active, activate]);
}
