"use client";

import { X } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { AUTH_MODE } from "@/lib/auth-config";
import { isJwtAuthMode } from "@/lib/oidc/config";
import { isLikelySignedIn } from "@/lib/oidc/session";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import { mergeRegistrationScopeForProxy } from "@/lib/proxy-fetch-registration-scope";

/** Session-only: dismiss hides the banner until the browser tab/session ends. */
const SESSION_DISMISS_KEY = "archlucid_trial_expiry_banner_dismissed_session";

const URGENT_TRIAL_DAYS_MAX = 7;

type TrialStatusPayload = {
  status?: string;
  daysRemaining?: number | null;
};

/**
 * When the tenant trial has **7 or fewer days left**, shows a compact strip on **every** operator page
 * (not only home). Uses `GET /v1/tenant/trial-status` — same source as {@link TrialBanner}.
 */
export function TrialExpiryBanner() {
  const [hydrated, setHydrated] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [payload, setPayload] = useState<TrialStatusPayload | null>(null);

  const refresh = useCallback(async () => {
    if (AUTH_MODE !== "development-bypass" && isJwtAuthMode() && !isLikelySignedIn()) {
      setPayload(null);

      return;
    }

    try {
      const res = await fetch(
        "/api/proxy/v1/tenant/trial-status",
        mergeRegistrationScopeForProxy({ headers: { Accept: "application/json" } }),
      );

      if (!res.ok) {
        setPayload(null);

        return;
      }

      const json = (await res.json()) as TrialStatusPayload;
      setPayload(json);
    } catch {
      setPayload(null);
    }
  }, []);

  useEffect(() => {
    setHydrated(true);

    try {
      if (typeof window !== "undefined" && window.sessionStorage.getItem(SESSION_DISMISS_KEY) === "1") {
        setDismissed(true);
      }
    } catch {
      setDismissed(false);
    }

    void refresh();
  }, [refresh]);

  if (!hydrated || dismissed) {
    return null;
  }

  if (isBuyerPolishedOperatorShellEnv()) {
    return null;
  }

  if (!payload || payload.status !== "Active") {
    return null;
  }

  const days = payload.daysRemaining;

  if (typeof days !== "number" || days > URGENT_TRIAL_DAYS_MAX || days < 0) {
    return null;
  }

  return (
    <div
      role="region"
      aria-label="Trial ending soon"
      data-testid="trial-expiry-banner"
      className="mb-4 flex flex-wrap items-start justify-between gap-3 rounded-md border border-amber-600/40 bg-al-surface-raised px-3 py-2 text-sm text-al-text-primary dark:border-amber-700/50 p-3 text-sm shadow-sm"
    >
      <div className="min-w-0">
        <p className="m-0 font-semibold">
          {days === 0 ? "Your trial ends today" : `${days} day${days === 1 ? "" : "s"} left on your trial`}
        </p>
        <p className="mt-1 text-xs text-amber-900 dark:text-amber-200">
          Upgrade or talk to us before access changes.
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          <Button asChild type="button" size="sm" className="bg-teal-800 text-white hover:bg-teal-900 dark:bg-teal-700">
            <Link href="/pricing#pricing-quote-request">Talk to us</Link>
          </Button>
        </div>
      </div>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-8 w-8 shrink-0 text-amber-900 hover:bg-amber-100 dark:text-amber-100 dark:hover:bg-amber-900/60"
        aria-label="Dismiss trial countdown for this session"
        onClick={() => {
          setDismissed(true);

          try {
            window.sessionStorage.setItem(SESSION_DISMISS_KEY, "1");
          } catch {
            /* private mode */
          }
        }}
      >
        <X className="h-4 w-4" aria-hidden />
      </Button>
    </div>
  );
}
