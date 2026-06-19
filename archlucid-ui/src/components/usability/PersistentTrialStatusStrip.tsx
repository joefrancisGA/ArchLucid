"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { fetchTenantTrialStatusCached } from "@/lib/tenant-trial-status-client";
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
      setPayload(await fetchTenantTrialStatusCached());
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

  if (pathname === "/") {
    return null;
  }

  const nextAction = resolveTrialNextAction(payload);
  const days = payload.daysRemaining;
  const daysLabel =
    typeof days === "number" ? `${days} day${days === 1 ? "" : "s"} left on trial` : "Trial workspace";

  return (
    <div
      className="mb-3 flex flex-wrap items-center justify-between gap-3 rounded-md border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
      role="region"
      aria-label="Trial status"
      data-testid="persistent-trial-status-strip"
    >
      <div className="min-w-0 flex items-center gap-2">
        <span className="rounded border border-neutral-300 bg-white px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-neutral-600 dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-300">
          Trial
        </span>
        <span className="text-neutral-700 dark:text-neutral-300">{daysLabel}</span>
      </div>
      <Button asChild type="button" size="sm" variant="outline" className="h-7 text-xs">
        <Link href={nextAction.href}>{nextAction.label}</Link>
      </Button>
    </div>
  );
}
