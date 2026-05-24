"use client";

import { useEffect, useRef } from "react";

import { useRouter } from "next/navigation";

const IDLE_MS = 15 * 60 * 1000;
const SESSION_STORAGE_KEY = "archlucid.session.clearedAt";

/** Clears operator session after 15 minutes of inactivity (enterprise idle timeout). */
export function SessionIdleTimeoutGuard() {
  const router = useRouter();
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    const resetTimer = () => {
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current);
      }

      timerRef.current = window.setTimeout(() => {
        sessionStorage.setItem(SESSION_STORAGE_KEY, new Date().toISOString());
        router.push("/login?reason=idle-timeout");
        router.refresh();
      }, IDLE_MS);
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
