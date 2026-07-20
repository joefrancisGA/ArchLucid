"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { AUTH_MODE } from "@/lib/auth-config";
import { isJwtAuthMode } from "@/lib/oidc/config";
import { isLikelySignedIn } from "@/lib/oidc/session";
import { mergeRegistrationScopeForProxy } from "@/lib/proxy-fetch-registration-scope";

/** Session guard: after SaaS trial pre-seed, first visit to operator home lands on the welcome run detail. */
const SESSION_KEY = "archlucid_trial_welcome_home_redirect_v1";

/** e2e / automation: when set, home never auto-deep-links (avoids competing App Router transitions). */
export const TRIAL_WELCOME_HOME_REDIRECT_SUPPRESS_VALUE = "__suppress__";

type TrialStatusPayload = {
  trialWelcomeRunId?: string | null;
};

/**
 * One-time redirect from operator home (`/`) to `/reviews/{trialWelcomeRunId}` when the API exposes a pre-seeded
 * welcome run (self-service trial). Uses sessionStorage so returning to home does not loop.
 */
export function TrialWelcomeRunDeepLink() {
  const router = useRouter();

  useEffect(() => {
    if (AUTH_MODE !== "development-bypass" && isJwtAuthMode() && !isLikelySignedIn()) {
      return;
    }

    let cancelled = false;

    void (async () => {
      try {
        if (typeof window === "undefined") {
          return;
        }

        const res = await fetch(
          "/api/proxy/v1/tenant/trial-status",
          mergeRegistrationScopeForProxy({ headers: { Accept: "application/json" } }),
        );

        if (!res.ok || cancelled) {
          return;
        }

        const json = (await res.json()) as TrialStatusPayload;
        const welcomeId = json.trialWelcomeRunId?.trim() ?? "";

        if (!welcomeId) {
          return;
        }

        const already = window.sessionStorage.getItem(SESSION_KEY);

        // Same welcome id (returning home) or explicit e2e suppress — never start a competing transition.
        if (
          already === welcomeId ||
          already === TRIAL_WELCOME_HOME_REDIRECT_SUPPRESS_VALUE
        ) {
          return;
        }

        window.sessionStorage.setItem(SESSION_KEY, welcomeId);
        router.replace(`/reviews/${encodeURIComponent(welcomeId)}`);
      } catch {
        /* ignore */
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [router]);

  return null;
}
