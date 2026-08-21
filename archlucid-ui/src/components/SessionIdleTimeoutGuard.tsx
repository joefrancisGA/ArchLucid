"use client";

import { useEffect, useRef } from "react";

import { useRouter } from "next/navigation";

import {
  SESSION_CLEARED_AT_STORAGE_KEY,
  SESSION_IDLE_TIMEOUT_MS,
} from "@/lib/auth/session-idle-timeout";
import { buildSessionExpiredHref } from "@/lib/navigation/auth-sign-in-href";
import { clearOperatorScopeStorage } from "@/lib/operator/operator-scope-storage";
import { clearOidcSession } from "@/lib/oidc/session";

/** Clears operator session after 30 minutes of inactivity (enterprise idle timeout). */
export function SessionIdleTimeoutGuard() {
  const router = useRouter();
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    const resetTimer = () => {
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current);
      }

      timerRef.current = window.setTimeout(() => {
        sessionStorage.setItem(SESSION_CLEARED_AT_STORAGE_KEY, new Date().toISOString());
        clearOidcSession();
        clearOperatorScopeStorage();

        const returnPath = window.location.pathname + window.location.search;

        router.push(buildSessionExpiredHref(returnPath));
        router.refresh();
      }, SESSION_IDLE_TIMEOUT_MS);
    };

    const events: Array<keyof WindowEventMap> = ["mousemove", "mousedown", "keydown", "touchstart", "scroll"];

    for (const eventName of events) {
      window.addEventListener(eventName, resetTimer, { passive: true });
    }

    resetTimer();

    return () => {
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current);
      }

      for (const eventName of events) {
        window.removeEventListener(eventName, resetTimer);
      }
    };
  }, [router]);

  return null;
}
