"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { mergeRegistrationScopeForProxy } from "@/lib/proxy-fetch-registration-scope";
import type { TenantTrialStatusPayload } from "@/types/tenant-trial-status";

type TrialNextAction = {
  readonly label: string;
  readonly href: string;
};

function resolveTrialNextAction(payload: TenantTrialStatusPayload | null): TrialNextAction {
  if (payload?.trialSampleRunId !== null && payload?.trialSampleRunId !== undefined && payload.trialSampleRunId.trim().length > 0) {
    return {
      label: "Explore sample review",
      href: `/reviews/${encodeURIComponent(payload.trialSampleRunId.trim())}`,
    };
  }

  if (payload?.status === "Active") {
    return { label: "Commit your first review", href: "/reviews?projectId=default" };
  }

  if (payload?.status === "Expired" || payload?.status === "ReadOnly" || payload?.status === "ExportOnly") {
    return { label: "Convert to paid", href: "/pricing#pricing-quote-request" };
  }

  return { label: "Open onboarding checklist", href: "/onboarding?source=registration" };
}

/** Persistent trial strip with days remaining and a single primary next action (all operator routes). */
export function PersistentTrialStatusStrip() {
  const pathname = usePathname();
  const [payload, setPayload] = useState<TenantTrialStatusPayload | null>(null);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch(
        "/api/proxy/v1/tenant/trial-status",
        mergeRegistrationScopeForProxy({ headers: { Accept: "application/json" } }),
      );

      if (!res.ok) {
        setPayload(null);

        return;
      }

      setPayload((await res.json()) as TenantTrialStatusPayload);
    } catch {
      setPayload(null);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh, pathname]);

  if (payload === null || payload.status === "None" || payload.status === "Converted") {
    return null;
  }

  const nextAction = resolveTrialNextAction(payload);
  const days = payload.daysRemaining;
  const daysLabel =
    typeof days === "number" ? `${days} day${days === 1 ? "" : "s"} left on trial` : "Trial workspace";

  return (
    <div
      className="mb-3 flex flex-wrap items-center justify-between gap-3 rounded-md border border-amber-500/30 bg-amber-50/70 px-3 py-2 text-sm dark:border-amber-800/40 dark:bg-amber-950/30"
      role="region"
      aria-label="Trial status"
      data-testid="persistent-trial-status-strip"
    >
      <div className="min-w-0">
        <span className="font-semibold text-amber-950 dark:text-amber-100">Trial workspace</span>
        <span className="mx-2 text-amber-800 dark:text-amber-200">·</span>
        <span className="text-amber-900 dark:text-amber-100">{daysLabel}</span>
      </div>
      <Button asChild type="button" size="sm" className="bg-teal-800 text-white hover:bg-teal-900 dark:bg-teal-700">
        <Link href={nextAction.href}>{nextAction.label}</Link>
      </Button>
    </div>
  );
}
