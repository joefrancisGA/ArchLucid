"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
  SESSION_IDLE_FOCUS_HEARTBEAT_MS,
  SESSION_TOKEN_EXPIRY_WARNING_MS,
  writeSharedSessionLastActivityAt,
} from "@/lib/auth/session-idle-timeout";
import { readPresenterModeFromWindowLocation } from "@/lib/review-detail-workspace-tabs";
import { isJwtAuthMode } from "@/lib/oidc/config";
import { ensureAccessTokenFresh, getAccessTokenExpiresAtMs } from "@/lib/oidc/session";
import { pulseBffSessionActivity } from "@/lib/oidc/bff-session-sync";

function isMeetingSafeSessionSurface(pathname: string): boolean {
  if (pathname.includes("/print")) {
    return true;
  }

  return readPresenterModeFromWindowLocation();
}

/** Warns before OIDC access-token expiry so long read sessions can refresh without a hard logout. */
export function OidcTokenExpiryWarningGuard() {
  const pathname = usePathname() ?? "";
  const meetingSafe = isMeetingSafeSessionSurface(pathname);
  const [warningVisible, setWarningVisible] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState(
    Math.ceil(SESSION_TOKEN_EXPIRY_WARNING_MS / 1000),
  );
  const warnedRef = useRef(false);

  useEffect(() => {
    if (!meetingSafe || typeof window === "undefined") {
      return;
    }

    writeSharedSessionLastActivityAt();
    void pulseBffSessionActivity();

    const heartbeatId = window.setInterval(() => {
      writeSharedSessionLastActivityAt();
      void ensureAccessTokenFresh();
      void pulseBffSessionActivity();
    }, SESSION_IDLE_FOCUS_HEARTBEAT_MS);

    return () => {
      window.clearInterval(heartbeatId);
    };
  }, [meetingSafe]);

  useEffect(() => {
    if (typeof window === "undefined" || !isJwtAuthMode()) {
      return;
    }

    const intervalId = window.setInterval(() => {
      const expiresAtMs = getAccessTokenExpiresAtMs();

      if (expiresAtMs <= 0) {
        return;
      }

      const remainingMs = expiresAtMs - Date.now();

      if (remainingMs <= 0) {
        setWarningVisible(false);
        warnedRef.current = false;

        return;
      }

      if (meetingSafe && remainingMs <= SESSION_TOKEN_EXPIRY_WARNING_MS * 2) {
        void ensureAccessTokenFresh();
      }

      if (remainingMs <= SESSION_TOKEN_EXPIRY_WARNING_MS) {
        setWarningVisible(true);
        setSecondsRemaining(Math.max(1, Math.ceil(remainingMs / 1000)));
        warnedRef.current = true;

        return;
      }

      if (warnedRef.current) {
        setWarningVisible(false);
        warnedRef.current = false;
      }
    }, 1000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [meetingSafe]);

  if (!warningVisible) {
    return null;
  }

  return (
    <div
      role="alertdialog"
      aria-live="assertive"
      aria-labelledby="session-token-expiry-warning-title"
      className="fixed inset-x-4 bottom-24 z-[100] mx-auto max-w-lg rounded-lg border border-al-border bg-al-surface-raised p-4 shadow-lg"
      data-testid="session-token-expiry-warning"
    >
      <p id="session-token-expiry-warning-title" className="m-0 font-medium text-al-text-primary">
        Your sign-in expires soon
      </p>
      <p className="mt-2 text-sm text-al-text-secondary">
        Refresh your session to keep working. Expires in about {secondsRemaining} seconds.
      </p>
      <div className="mt-3">
        <Button
          type="button"
          size="sm"
          data-testid="session-token-expiry-warning-refresh"
          onClick={() => {
            void ensureAccessTokenFresh().then(() => {
              setWarningVisible(false);
              warnedRef.current = false;
            });
          }}
        >
          Stay signed in
        </Button>
      </div>
    </div>
  );
}
