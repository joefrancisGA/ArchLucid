"use client";

import { useEffect } from "react";

import { useOperatorShellStatusConcernFetchEnabled } from "@/components/shell/OperatorShellStatusQueryGate";
import { useTenantTrialStatusQuery } from "@/hooks/use-tenant-trial-status-query";

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
 *
 * Trial status is read through the shared query, which already skips the fetch when no session token is
 * present, so this component holds only the redirect decision.
 */
export function TrialWelcomeRunDeepLink() {
  const concernFetchEnabled = useOperatorShellStatusConcernFetchEnabled();
  const { data: trialStatus } = useTenantTrialStatusQuery({ enabled: concernFetchEnabled });
  const welcomeRunId = trialStatus?.trialWelcomeRunId?.trim() ?? "";

  useEffect(() => {
    if (welcomeRunId === "") {
      return;
    }

    const alreadyRedirected = window.sessionStorage.getItem(SESSION_KEY);

    // Same welcome id (returning home) or explicit e2e suppress — never start a competing navigation.
    if (
      alreadyRedirected === welcomeRunId ||
      alreadyRedirected === TRIAL_WELCOME_HOME_REDIRECT_SUPPRESS_VALUE
    ) {
      return;
    }

    window.sessionStorage.setItem(SESSION_KEY, welcomeRunId);
    // Full navigation: hard commit, no App Router action-queue contention with sidebar Links.
    window.location.replace(`/architecture/reviews/${encodeURIComponent(welcomeRunId)}`);
  }, [welcomeRunId]);

  return null;
}
