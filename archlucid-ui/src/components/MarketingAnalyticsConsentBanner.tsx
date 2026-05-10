"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  MARKETING_ANALYTICS_CONSENT_STORAGE_KEY,
  type MarketingAnalyticsConsentValue,
} from "@/lib/marketing-analytics-consent";

type ConsentUiState = "unknown" | MarketingAnalyticsConsentValue;

function readStoredConsent(): ConsentUiState {
  if (typeof window === "undefined")
    return "unknown";

  const raw = window.localStorage.getItem(MARKETING_ANALYTICS_CONSENT_STORAGE_KEY)?.trim();

  if (raw === "granted" || raw === "denied")
    return raw;

  return "unknown";
}

/**
 * Optional analytics consent for public marketing routes only. Does not run when Clarity project id is unset.
 */
export function MarketingAnalyticsConsentBanner(props: { clarityProjectId: string }) {
  const [consent, setConsent] = useState<ConsentUiState>("unknown");

  useEffect(() => {
    setConsent(readStoredConsent());
  }, []);

  const persist = useCallback((value: MarketingAnalyticsConsentValue) => {
    window.localStorage.setItem(MARKETING_ANALYTICS_CONSENT_STORAGE_KEY, value);
    setConsent(value);
    window.dispatchEvent(new Event("archlucid-marketing-consent-changed"));
  }, []);

  if (props.clarityProjectId.length === 0 || consent !== "unknown")
    return null;

  return (
    <div
      role="region"
      aria-label="Optional site analytics"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-neutral-200 bg-white/95 px-4 py-3 shadow-lg backdrop-blur dark:border-neutral-800 dark:bg-neutral-950/95">
      <div className="mx-auto flex max-w-5xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="m-0 text-sm text-neutral-700 dark:text-neutral-300">
          We offer optional, privacy-oriented analytics on public pages to improve discoverability. Accepting loads
          Microsoft Clarity on marketing pages only (not the signed-in product). See our{" "}
          <Link className="text-blue-700 underline underline-offset-2 dark:text-blue-300" href="/privacy">
            Privacy Policy
          </Link>
          .
        </p>
        <div className="flex shrink-0 gap-2">
          <Button type="button" size="sm" variant="outline" onClick={() => persist("denied")}>
            Decline
          </Button>
          <Button type="button" size="sm" onClick={() => persist("granted")}>
            Accept
          </Button>
        </div>
      </div>
    </div>
  );
}
