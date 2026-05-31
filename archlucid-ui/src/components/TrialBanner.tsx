"use client";

import { X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { AUTH_MODE } from "@/lib/auth-config";
import { isJwtAuthMode } from "@/lib/oidc/config";
import { isLikelySignedIn } from "@/lib/oidc/session";
import { mergeRegistrationScopeForProxy } from "@/lib/proxy-fetch-registration-scope";
import {
  formatTrialExportOnlyPurgeHeadline,
  TRIAL_EXPORT_ONLY_SUPPORTING_LINE,
} from "@/lib/trial-export-only-banner-copy";
import { isTrialBannerSnoozed, snoozeTrialBanner24h } from "@/lib/trial-banner-dismiss";
import { showError, showSuccess } from "@/lib/toast";
import type { TenantTrialStatusPayload } from "@/types/tenant-trial-status";

function shouldShowTrialStrip(status: string | undefined): boolean {
  if (!status || status === "None" || status === "Converted") {
    return false;
  }

  return (
    status === "Active" ||
    status === "Expired" ||
    status === "ReadOnly" ||
    status === "ExportOnly"
  );
}

function isExportOnlyStatus(status: string | undefined): boolean {
  return status === "ExportOnly";
}

type TrialExportOnlyBannerProps = {
  daysRemaining: number | null | undefined;
};

function TrialExportOnlyBanner({ daysRemaining }: TrialExportOnlyBannerProps) {
  return (
    <div
      role="alert"
      aria-label="Trial export-only — data purge warning"
      data-testid="trial-export-only-banner"
      className="rounded-md border border-rose-600/40 bg-al-surface-raised px-3 py-2 text-sm text-al-text-primary dark:border-rose-700/50 mb-4 p-3 text-sm shadow-sm"
    >
      <p className="m-0 font-semibold">{formatTrialExportOnlyPurgeHeadline(daysRemaining)}</p>
      <p className="m-0 mt-1 text-xs text-red-900 dark:text-red-200">{TRIAL_EXPORT_ONLY_SUPPORTING_LINE}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <Button
          asChild
          type="button"
          size="sm"
          className="bg-red-800 text-white hover:bg-red-900 dark:bg-red-700 dark:hover:bg-red-600"
        >
          <Link href="/reviews">Export review packages</Link>
        </Button>
        <Button asChild type="button" size="sm" variant="outline" className="border-red-300 dark:border-red-600">
          <Link href="/audit">Export audit log</Link>
        </Button>
        <Button asChild type="button" size="sm" variant="outline" className="border-red-300 dark:border-red-600">
          <Link href="/pricing#pricing-quote-request">Talk to us about retention</Link>
        </Button>
      </div>
    </div>
  );
}

/** Sticky trial callout in the operator shell; dismiss hides non–export-only states for 24h. */
export function TrialBanner() {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);
  const [payload, setPayload] = useState<TenantTrialStatusPayload | null>(null);
  const [hydrated, setHydrated] = useState(false);

  const refresh = useCallback(async () => {
    if (AUTH_MODE !== "development-bypass" && isJwtAuthMode() && !isLikelySignedIn()) {
      setVisible(false);
      setPayload(null);

      return;
    }

    try {
      const res = await fetch(
        "/api/proxy/v1/tenant/trial-status",
        mergeRegistrationScopeForProxy({ headers: { Accept: "application/json" } }),
      );

      if (!res.ok) {
        setVisible(false);
        setPayload(null);

        return;
      }

      const json = (await res.json()) as TenantTrialStatusPayload;
      setPayload(json);

      if (isExportOnlyStatus(json.status)) {
        setVisible(true);

        return;
      }

      if (isTrialBannerSnoozed()) {
        setVisible(false);

        return;
      }

      const days = json.daysRemaining;

      if (json.status === "Active" && typeof days === "number" && days >= 0 && days <= 7) {
        setVisible(false);

        return;
      }

      setVisible(shouldShowTrialStrip(json.status));
    } catch {
      setVisible(false);
      setPayload(null);
    }
  }, []);

  useEffect(() => {
    setHydrated(true);
    void refresh();
  }, [refresh]);

  const onConvert = async () => {
    try {
      const res = await fetch(
        "/api/proxy/v1/tenant/billing/checkout",
        mergeRegistrationScopeForProxy({ method: "POST", headers: { Accept: "application/json" } }),
      );

      const json = (await res.json().catch(() => null)) as { status?: string } | null;

      if (!res.ok) {
        showError("Billing", `Checkout request failed (${res.status}).`);

        return;
      }

      if (json?.status === "not_configured") {
        showSuccess("Billing: checkout will open here once billing is connected for your tenant.");

        return;
      }

      showSuccess("Billing: request accepted.");
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Request failed.";
      showError("Billing", message);
    }
  };

  if (!hydrated || !payload) {
    return null;
  }

  if (isExportOnlyStatus(payload.status)) {
    return <TrialExportOnlyBanner daysRemaining={payload.daysRemaining} />;
  }

  if (!visible || pathname !== "/") {
    return null;
  }

  const days = payload.daysRemaining;
  const daysLabel =
    typeof days === "number" ? `${days} day${days === 1 ? "" : "s"} remaining on trial` : "Trial status updated";

  return (
    <div
      role="region"
      aria-label="Trial subscription"
      className="rounded-md border border-amber-600/40 bg-al-surface-raised px-3 py-2 text-sm text-al-text-primary dark:border-amber-700/50 mb-4 flex flex-wrap items-start justify-between gap-3 p-3 text-sm"
    >
      <div>
        <strong className="font-semibold">Trial workspace</strong>
        <span className="mx-2 text-amber-800 dark:text-amber-200">·</span>
        <span>{daysLabel}</span>
        <div className="mt-2 flex flex-wrap gap-2">
          <Button asChild type="button" size="sm" className="bg-teal-800 text-white hover:bg-teal-900 dark:bg-teal-700 dark:hover:bg-teal-600">
            <Link href="/pricing#pricing-quote-request">Request quote</Link>
          </Button>
          <Button type="button" size="sm" variant="outline" onClick={onConvert}>
            Convert to paid
          </Button>
          <Button asChild type="button" size="sm" variant="outline">
            <Link href="/onboarding?source=registration">Trial checklist</Link>
          </Button>
        </div>
      </div>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-8 w-8 shrink-0 text-amber-900 hover:bg-amber-100 dark:text-amber-100 dark:hover:bg-amber-900/60"
        aria-label="Dismiss trial banner for 24 hours"
        onClick={() => {
          snoozeTrialBanner24h();
          setVisible(false);
        }}
      >
        <X className="h-4 w-4" aria-hidden />
      </Button>
    </div>
  );
}
