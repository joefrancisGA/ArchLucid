"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { DismissControl } from "@/components/usability/DismissControl";
import { useTenantTrialStatusQuery } from "@/hooks/use-tenant-trial-status-query";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

/** Session-only: dismiss hides the banner until the browser tab/session ends. */
const SESSION_DISMISS_KEY = "archlucid_trial_expiry_banner_dismissed_session";

const URGENT_TRIAL_DAYS_MAX = 7;

/**
 * When the tenant trial has **7 or fewer days left**, shows a compact strip on **every** operator page
 * (not only home). Uses `GET /v1/tenant/trial-status` — same source as {@link TrialBanner}.
 */
export function TrialExpiryBanner() {
  const { data: payload, isFetched } = useTenantTrialStatusQuery();
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    try {
      if (typeof window !== "undefined" && window.sessionStorage.getItem(SESSION_DISMISS_KEY) === "1") {
        setDismissed(true);
      }
    } catch {
      setDismissed(false);
    }
  }, []);

  if (!isFetched || dismissed) {
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
      className={cn(
        "mb-4 flex flex-wrap items-start justify-between gap-3 rounded-md border border-amber-600/40 bg-al-surface-raised p-3 text-al-text-primary shadow-sm dark:border-amber-700/50",
        OPERATOR_TYPOGRAPHY.body,
      )}
    >
      <div className="min-w-0">
        <p className="m-0 font-semibold">
          {days === 0 ? "Your trial ends today" : `${days} day${days === 1 ? "" : "s"} left on your trial`}
        </p>
        <p className={cn("mt-1 text-amber-900 dark:text-amber-200", OPERATOR_TYPOGRAPHY.helper)}>
          Upgrade or talk to us before access changes.
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          <Button asChild type="button" size="sm" className="bg-teal-800 text-white hover:bg-teal-900 dark:bg-teal-700">
            <Link href="/pricing#pricing-quote-request">Talk to us</Link>
          </Button>
        </div>
      </div>
      <DismissControl
        iconOnly
        ariaLabel="Dismiss trial countdown for this session"
        className="text-amber-900 hover:bg-amber-100 dark:text-amber-100 dark:hover:bg-amber-900/60"
        onDismiss={() => {
          setDismissed(true);

          try {
            window.sessionStorage.setItem(SESSION_DISMISS_KEY, "1");
          } catch {
            /* private mode */
          }
        }}
      />
    </div>
  );
}
