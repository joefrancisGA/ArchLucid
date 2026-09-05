"use client";

import { useEffect } from "react";

import {
  SESSION_IDLE_FOCUS_HEARTBEAT_MS,
  writeSharedSessionLastActivityAt,
} from "@/lib/auth/session-idle-timeout";
import { ensureAccessTokenFresh } from "@/lib/oidc/session";

/** Keeps OIDC session fresh during long read-only or mutating operator flows (presenter, print, finalize, export). */
export function useOidcSessionKeepalive(enabled: boolean): void {
  useEffect(() => {
    if (!enabled || typeof window === "undefined") {
      return;
    }

    writeSharedSessionLastActivityAt();
    void ensureAccessTokenFresh();

    const heartbeatId = window.setInterval(() => {
      writeSharedSessionLastActivityAt();
      void ensureAccessTokenFresh();
    }, SESSION_IDLE_FOCUS_HEARTBEAT_MS);

    return () => {
      window.clearInterval(heartbeatId);
    };
  }, [enabled]);
}

/** One-shot keepalive before a long mutation or download starts. */
export async function pulseOidcSessionKeepalive(): Promise<void> {
  if (typeof window === "undefined") {
    return;
  }

  writeSharedSessionLastActivityAt();
  await ensureAccessTokenFresh();
}
