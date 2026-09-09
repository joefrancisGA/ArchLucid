"use client";

import { useEffect, useRef, useState } from "react";

import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { useWorkspaceMode } from "@/components/WorkspaceModeProvider";
import {
  readSharedSessionLastActivityAtMs,
  remainingSessionIdleMs,
  resolveSessionIdleTimeoutMs,
  SESSION_CLEARED_AT_STORAGE_KEY,
  SESSION_IDLE_BROADCAST_CHANNEL,
  SESSION_IDLE_FOCUS_HEARTBEAT_MS,
  SESSION_IDLE_WARNING_MS,
  writeSharedSessionLastActivityAt,
} from "@/lib/auth/session-idle-timeout";
import { buildSessionExpiredHref } from "@/lib/navigation/auth-sign-in-href";
import { persistIdleDeskRestoreBeforeSessionClear } from "@/lib/auth/idle-desk-restore";
import { clearOperatorScopeStorage } from "@/lib/operator/operator-scope-storage";
import { clearOidcSession } from "@/lib/oidc/session";
import { OidcTokenExpiryWarningGuard } from "@/components/OidcTokenExpiryWarningGuard";

function clearSessionAndRedirect(router: ReturnType<typeof useRouter>): void {
  sessionStorage.setItem(SESSION_CLEARED_AT_STORAGE_KEY, new Date().toISOString());
  const returnPath = window.location.pathname + window.location.search;

  persistIdleDeskRestoreBeforeSessionClear(returnPath);
  clearOidcSession();
  clearOperatorScopeStorage();

  router.push(buildSessionExpiredHref(returnPath));
  router.refresh();
}

/** Clears operator session after inactivity with cross-tab activity sharing and a 2-minute warning. */
export function SessionIdleTimeoutGuard() {
  const router = useRouter();
  const { isWorkingMode, mounted: workspaceMounted } = useWorkspaceMode();
  const timerRef = useRef<number | null>(null);
  const idleTimeoutMs = workspaceMounted && isWorkingMode
    ? resolveSessionIdleTimeoutMs(true)
    : resolveSessionIdleTimeoutMs(false);
  const [warningVisible, setWarningVisible] = useState(false);
  const [warningSecondsRemaining, setWarningSecondsRemaining] = useState(
    Math.ceil(SESSION_IDLE_WARNING_MS / 1000),
  );

  useEffect(() => {
    let broadcastChannel: BroadcastChannel | null = null;

    if (typeof BroadcastChannel !== "undefined") {
      broadcastChannel = new BroadcastChannel(SESSION_IDLE_BROADCAST_CHANNEL);
    }

    const scheduleFromSharedActivity = () => {
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current);
      }

      const lastActivityAtMs = readSharedSessionLastActivityAtMs();
      const remainingMs = remainingSessionIdleMs(lastActivityAtMs, undefined, idleTimeoutMs);

      if (remainingMs <= 0) {
        clearSessionAndRedirect(router);

        return;
      }

      const warningLeadMs = Math.max(0, remainingMs - SESSION_IDLE_WARNING_MS);

      timerRef.current = window.setTimeout(() => {
        setWarningVisible(true);
        setWarningSecondsRemaining(Math.ceil(SESSION_IDLE_WARNING_MS / 1000));

        timerRef.current = window.setTimeout(() => {
          clearSessionAndRedirect(router);
        }, SESSION_IDLE_WARNING_MS);
      }, warningLeadMs);
    };

    const recordActivity = () => {
      writeSharedSessionLastActivityAt();
      setWarningVisible(false);
      broadcastChannel?.postMessage({ type: "activity" });
      scheduleFromSharedActivity();
    };

    const events: Array<keyof WindowEventMap> = ["mousemove", "mousedown", "keydown", "touchstart", "scroll"];

    for (const eventName of events) {
      window.addEventListener(eventName, recordActivity, { passive: true });
    }

    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        recordActivity();
      }
    };

    document.addEventListener("visibilitychange", onVisibilityChange);

    const focusHeartbeatId = window.setInterval(() => {
      if (document.visibilityState === "visible" && document.hasFocus()) {
        recordActivity();
      }
    }, SESSION_IDLE_FOCUS_HEARTBEAT_MS);

    broadcastChannel?.addEventListener("message", () => {
      scheduleFromSharedActivity();
    });

    writeSharedSessionLastActivityAt();
    scheduleFromSharedActivity();

    return () => {
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current);
      }

      for (const eventName of events) {
        window.removeEventListener(eventName, recordActivity);
      }

      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.clearInterval(focusHeartbeatId);

      broadcastChannel?.close();
    };
  }, [idleTimeoutMs, router]);

  useEffect(() => {
    if (!warningVisible) {
      return;
    }

    const intervalId = window.setInterval(() => {
      const remainingMs = remainingSessionIdleMs(readSharedSessionLastActivityAtMs(), undefined, idleTimeoutMs);

      setWarningSecondsRemaining(Math.max(1, Math.ceil(remainingMs / 1000)));
    }, 1000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [idleTimeoutMs, warningVisible]);

  return (
    <>
      <OidcTokenExpiryWarningGuard />
      {warningVisible ? (
        <div
          role="alertdialog"
          aria-live="assertive"
          aria-labelledby="session-idle-warning-title"
          className="fixed inset-x-4 bottom-4 z-[100] mx-auto max-w-lg rounded-lg border border-al-border bg-al-surface-raised p-4 shadow-lg"
          data-testid="session-idle-warning"
        >
          <p id="session-idle-warning-title" className="m-0 font-medium text-al-text-primary">
            Your session will end soon
          </p>
          <p className="mt-2 text-sm text-al-text-secondary">
            You have been inactive. Move your mouse, press a key, or extend your session for projector or reading
            work. Session ends in about {warningSecondsRemaining} seconds.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              data-testid="session-idle-warning-stay-signed-in"
              onClick={() => {
                writeSharedSessionLastActivityAt();
                setWarningVisible(false);
              }}
            >
              Stay signed in
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              data-testid="session-idle-warning-extend-meeting"
              onClick={() => {
                const meetingExtensionMs = 45 * 60 * 1000;
                writeSharedSessionLastActivityAt(Date.now() - idleTimeoutMs + meetingExtensionMs);
                setWarningVisible(false);

                if (timerRef.current !== null) {
                  window.clearTimeout(timerRef.current);
                }

                const warningLeadMs = Math.max(0, meetingExtensionMs - SESSION_IDLE_WARNING_MS);

                timerRef.current = window.setTimeout(() => {
                  setWarningVisible(true);
                  setWarningSecondsRemaining(Math.ceil(SESSION_IDLE_WARNING_MS / 1000));

                  timerRef.current = window.setTimeout(() => {
                    clearSessionAndRedirect(router);
                  }, SESSION_IDLE_WARNING_MS);
                }, warningLeadMs);
              }}
            >
              Extend for meeting
            </Button>
          </div>
        </div>
      ) : null}
    </>
  );
}
