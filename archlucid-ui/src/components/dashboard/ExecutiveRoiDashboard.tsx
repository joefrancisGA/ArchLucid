"use client";
import { cn } from "@/lib/utils";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

import { useEffect, useState } from "react";

import { ApiV1Routes } from "@/lib/api-v1-routes";
import { useSponsorRoiAggregatesQuery } from "@/hooks/use-roi-dashboard-queries";

type SponsorRoiAggregates = {
  timeSavedHours: number;
  decisionsAutomated: number;
  complianceRisksMitigated: number;
};

const ROI_PATH = `/api/proxy/${ApiV1Routes.analyticsRoi}`;

function formatTimeSavedHours(hours: number): string {
  if (!Number.isFinite(hours) || hours <= 0) {
    return " — ";
  }

  const rounded = hours >= 10 ? Math.round(hours) : Math.round(hours * 10) / 10;

  return `${rounded} hrs`;
}

function formatCount(value: number): string {
  if (!Number.isFinite(value) || value < 0) {
    return " — ";
  }

  return new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 }).format(value);
}

/** @deprecated Demo/legacy only — production `/dashboard` uses `SponsorRoiDashboardLiveKpiCards` (TB-062). */
/** Sponsor ROI tiles backed by `GET /v1/analytics/roi` (mocked on the API until persistence is defined). */
export function SponsorRoiDashboard() {
  const { data, error: queryError } = useSponsorRoiAggregatesQuery();
  const error = queryError instanceof Error ? queryError.message : queryError ? "Failed to load ROI metrics." : null;

  if (error) {
    return (
      <section
        aria-labelledby="exec-roi-dashboard-heading"
        className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900"
      >
        <h2 id="exec-roi-dashboard-heading" className={cn("font-semibold text-neutral-900 dark:text-neutral-100", OPERATOR_TYPOGRAPHY.cardTitle)}>
          Sponsor ROI
        </h2>
        <p className={cn("mt-2 text-red-600 dark:text-red-400", OPERATOR_TYPOGRAPHY.helper)} role="alert">
          {error}
        </p>
      </section>
    );
  }

  if (data === null || data === undefined) {
    return (
      <section
        aria-labelledby="exec-roi-dashboard-heading"
        className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900"
      >
        <h2 id="exec-roi-dashboard-heading" className={cn("font-semibold text-neutral-900 dark:text-neutral-100", OPERATOR_TYPOGRAPHY.cardTitle)}>
          Sponsor ROI
        </h2>
        <p className={cn("mt-2 text-neutral-500 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>Loading…</p>
      </section>
    );
  }

  const roiData = data;

  return (
    <section
      aria-labelledby="exec-roi-dashboard-heading"
      className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900"
    >
      <h2 id="exec-roi-dashboard-heading" className={cn("font-semibold text-neutral-900 dark:text-neutral-100", OPERATOR_TYPOGRAPHY.cardTitle)}>
        Sponsor ROI
      </h2>
      <p className={cn("mt-1 text-neutral-500 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
        Aggregated impact from <span className="font-mono">GET /v1/analytics/roi</span>.
      </p>
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <div className="rounded-md border border-neutral-100 bg-neutral-50/80 p-3 dark:border-neutral-800 dark:bg-neutral-950/40">
          <div className={cn("font-medium text-neutral-500 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>Time saved</div>
          <div className="mt-1 text-lg font-semibold tabular-nums text-neutral-900 dark:text-neutral-100">
            {formatTimeSavedHours(roiData.timeSavedHours)}
          </div>
        </div>
        <div className="rounded-md border border-neutral-100 bg-neutral-50/80 p-3 dark:border-neutral-800 dark:bg-neutral-950/40">
          <div className={cn("font-medium text-neutral-500 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>Decisions automated</div>
          <div className="mt-1 text-lg font-semibold tabular-nums text-neutral-900 dark:text-neutral-100">
            {formatCount(roiData.decisionsAutomated)}
          </div>
        </div>
        <div className="rounded-md border border-neutral-100 bg-neutral-50/80 p-3 dark:border-neutral-800 dark:bg-neutral-950/40">
          <div className={cn("font-medium text-neutral-500 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>Compliance risks mitigated</div>
          <div className="mt-1 text-lg font-semibold tabular-nums text-neutral-900 dark:text-neutral-100">
            {formatCount(roiData.complianceRisksMitigated)}
          </div>
        </div>
      </div>
    </section>
  );
}
