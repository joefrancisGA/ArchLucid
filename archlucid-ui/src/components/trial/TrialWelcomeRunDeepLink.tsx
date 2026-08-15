"use client";

import { useEffect } from "react";

import { useOperatorShellStatusConcernFetchEnabled } from "@/components/shell/OperatorShellStatusQueryGate";
import { AUTH_MODE } from "@/lib/auth-config";
import { isJwtAuthMode } from "@/lib/oidc/config";
import { isLikelySignedIn } from "@/lib/oidc/session";
import { fetchTenantTrialStatusCached } from "@/lib/tenant-trial-status-client";

/** Session guard: after SaaS trial pre-seed, first visit to operator home lands on the welcome run detail. */
const SESSION_KEY = "archlucid_trial_welcome_home_redirect_v1";

/** e2e / automation: when set, home never auto-deep-links (avoids competing App Router transitions). */
export const TRIAL_WELCOME_HOME_REDIRECT_SUPPRESS_VALUE = "__suppress__";

/**
 * One-time redirect from operator home (`/`) to `/architecture/reviews/{trialWelcomeRunId}` when the API exposes a pre-seeded
 * welcome run (self-service trial). Uses sessionStorage so returning to home does not loop.
 *
 * Uses `window.location.replace` (not App Router `router.replace`) so this deep-link cannot leave an
 * in-flight soft transition that wedges later Link navigations from Overview (Next 16.2 / loading.tsx stall).
 */
export function TrialWelcomeRunDeepLink() {
  const concernFetchEnabled = useOperatorShellStatusConcernFetchEnabled();

  useEffect(() => {
    if (!concernFetchEnabled) {
      return;
    }

    if (AUTH_MODE !== "development-bypass" && isJwtAuthMode() && !isLikelySignedIn()) {
      return;
    }

    let canceled = false;

    void (async () => {
      try {
        if (typeof window === "undefined") {
          return;
        }

        const payload = await fetchTenantTrialStatusCached();

        if (canceled) {
          return;
        }

        const welcomeId = payload?.trialWelcomeRunId?.trim() ?? "";

        if (!welcomeId) {
          return;
        }

        const already = window.sessionStorage.getItem(SESSION_KEY);

        // Same welcome id (returning home) or explicit e2e suppress — never start a competing navigation.
        if (
          already === welcomeId ||
          already === TRIAL_WELCOME_HOME_REDIRECT_SUPPRESS_VALUE
        ) {
          return;
        }

        window.sessionStorage.setItem(SESSION_KEY, welcomeId);
        // Full navigation: hard commit, no App Router action-queue contention with sidebar Links.
        window.location.replace(`/architecture/reviews/${encodeURIComponent(welcomeId)}`);
      } catch {
        /* ignore */
      }
    })();

    return () => {
      canceled = true;
    };
  }, [concernFetchEnabled]);

  return null;
}
