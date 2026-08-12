"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { DismissControl } from "@/components/usability/DismissControl";
import { useTenantTrialStatusQuery } from "@/hooks/use-tenant-trial-status-query";
import { GOVERNANCE_AUDIT_PATH } from "@/lib/governance/governance-route-paths";
import { mergeRegistrationScopeForProxy } from "@/lib/proxy-fetch-registration-scope";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  formatTrialExportOnlyPurgeHeadline,
  TRIAL_EXPORT_ONLY_SUPPORTING_LINE,
} from "@/lib/trial-export-only-banner-copy";
import { isTrialBannerSnoozed, snoozeTrialBanner24h } from "@/lib/trial-banner-dismiss";
import { showError, showSuccess } from "@/lib/toast";

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
      className={cn(
        "mb-4 rounded-md border border-rose-600/40 bg-al-surface-raised p-3 text-al-text-primary shadow-sm dark:border-rose-700/50",
        OPERATOR_TYPOGRAPHY.body,
      )}
    >
      <p className="m-0 font-semibold">{formatTrialExportOnlyPurgeHeadline(daysRemaining)}</p>
      <p className={cn("m-0 mt-1 text-red-900 dark:text-red-200", OPERATOR_TYPOGRAPHY.helper)}>{TRIAL_EXPORT_ONLY_SUPPORTING_LINE}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <Button
          asChild
          type="button"
          size="sm"
          variant="destructive"
        >
          <Link href="/architecture/reviews">Export reviews</Link>
        </Button>
        <Button asChild type="button" size="sm" variant="outline" className="border-red-300 dark:border-red-600">
          <Link href={GOVERNANCE_AUDIT_PATH}>Export audit trail</Link>
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
  const { data: payload, isFetched } = useTenantTrialStatusQuery();
  const [dismissed, setDismissed] = useState(false);

  const showHomeStrip = useMemo(() => {
    if (payload === null || payload === undefined) {
      return false;
    }

    if (isExportOnlyStatus(payload.status)) {
      return false;
    }

    if (isTrialBannerSnoozed() || dismissed) {
      return false;
    }

    const days = payload.daysRemaining;

    if (payload.status === "Active" && typeof days === "number" && days >= 0 && days <= 7) {
      return false;
    }

    return shouldShowTrialStrip(payload.status);
  }, [dismissed, payload]);

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

  if (!isFetched || payload === null || payload === undefined) {
    return null;
  }

  if (isExportOnlyStatus(payload.status)) {
    return <TrialExportOnlyBanner daysRemaining={payload.daysRemaining} />;
  }

  if (!showHomeStrip || pathname !== "/") {
    return null;
  }

  const days = payload.daysRemaining;
  const daysLabel =
    typeof days === "number" ? `${days} day${days === 1 ? "" : "s"} remaining on trial` : "Trial status updated";

  return (
    <div
      role="region"
      aria-label="Trial subscription"
      className={cn(
        "mb-4 flex flex-wrap items-start justify-between gap-3 rounded-md border border-amber-600/40 bg-al-surface-raised p-3 text-al-text-primary dark:border-amber-700/50",
        OPERATOR_TYPOGRAPHY.body,
      )}
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
            <Link href="/architecture/first-review-guide?source=registration">Trial checklist</Link>
          </Button>
        </div>
      </div>
      <DismissControl
        iconOnly
        ariaLabel="Dismiss trial banner for 24 hours"
        className="text-amber-900 hover:bg-amber-100 dark:text-amber-100 dark:hover:bg-amber-900/60"
        onDismiss={() => {
          snoozeTrialBanner24h();
          setDismissed(true);
        }}
      />
    </div>
  );
}
