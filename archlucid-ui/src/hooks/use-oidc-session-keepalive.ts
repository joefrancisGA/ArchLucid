"use client";

import { useEffect } from "react";

import {
  SESSION_IDLE_FOCUS_HEARTBEAT_MS,
  writeSharedSessionLastActivityAt,
} from "@/lib/auth/session-idle-timeout";
import { clearOidcSession, ensureAccessTokenFresh } from "@/lib/oidc/session";
import { pulseBffSessionActivity } from "@/lib/oidc/bff-session-sync";

async function pulseBffActivityOrClearSession(): Promise<void> {
  const result = await pulseBffSessionActivity();

  if (result === "unauthorized") {
    clearOidcSession();
  }
}

/** Keeps OIDC session fresh during long read-only or mutating operator flows (presenter, print, finalize, export). */
export function useOidcSessionKeepalive(enabled: boolean): void {
  useEffect(() => {
    if (!enabled || typeof window === "undefined") {
      return;
    }

    writeSharedSessionLastActivityAt();
    void ensureAccessTokenFresh();
    void pulseBffActivityOrClearSession();

    const heartbeatId = window.setInterval(() => {
      writeSharedSessionLastActivityAt();
      void ensureAccessTokenFresh();
      void pulseBffActivityOrClearSession();
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
  await pulseBffActivityOrClearSession();
}
