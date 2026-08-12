"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import type { ReactElement } from "react";

import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import { usePilotRoiBaselineCompleteness } from "@/hooks/use-pilot-roi-baseline-completeness";
import { formatUsd } from "@/lib/roi-assumptions";
import { OPERATOR_LINK, OPERATOR_NAV_GROUP_LABEL, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import type { RunSavingsSummaryModel, RunSavingsSummarySourceKind } from "@/lib/runs/run-savings-summary-model";
import {
  resolveSponsorRoiBaselineGate,
  shouldShowSponsorRoiBaselineGateNotice,
  SPONSOR_ROI_BASELINE_GATE_CAPTURE_CTA,
  SPONSOR_ROI_BASELINE_SCORECARD_HREF,
} from "@/lib/sponsor-roi-baseline-gate";

function sourceBadgeLabel(sourceKind: RunSavingsSummarySourceKind): string {
  if (sourceKind === "server-findings") {
    return "findings snapshot • tenant ROI resolver";
  }

  if (sourceKind === "client-hours-estimate") {
    return "labour-hours estimate • client coefficients";
  }

  if (sourceKind === "static-demo") {
    if (isBuyerPolishedOperatorShellEnv()) {
      return "Estimated savings (methodology)";
    }

    return "demonstration KPI";
  }

  return "cost-actual.json";
}

export type RunSavingsSummaryProps = {
  readonly model: RunSavingsSummaryModel;
  /** When true, missing ROI baselines suppress the dollar figure. */
  readonly isFinalized?: boolean;
};

/** Highlights annualized savings opportunity on run detail (server resolver or demo-only heuristics). */
export function RunSavingsSummary(props: RunSavingsSummaryProps): ReactElement {
  const isFinalized = props.isFinalized === true;
  const { loading, complete } = usePilotRoiBaselineCompleteness();
  const gateStatus = resolveSponsorRoiBaselineGate({
    hasBaselines: complete === true,
    isFinalized,
  });
  // A baseline check that could not run (complete === null) must not read as "no baseline recorded",
  // so the figure stays visible — matching SponsorRoiBaselineGateNotice.
  const suppressAmount = complete !== null && shouldShowSponsorRoiBaselineGateNotice(gateStatus);
  const formatted = formatUsd(props.model.annualizedUsd);
  const badgeLabel = sourceBadgeLabel(props.model.sourceKind);

  return (
    <section aria-label="Annualized savings opportunity" className="scroll-mt-24">
      <div className="rounded-md border border-neutral-200 bg-al-surface-raised px-4 py-3 dark:border-neutral-800">
        <p className={cn("m-0 mb-1", OPERATOR_NAV_GROUP_LABEL)}>
          Annualized savings opportunity
        </p>
        {loading ? (
          <div
            className="h-8 w-36 max-w-full animate-pulse rounded bg-neutral-200 dark:bg-neutral-700"
            data-testid="run-savings-summary-loading"
            aria-hidden="true"
          />
        ) : suppressAmount ? (
          <div className="space-y-2" data-testid="run-savings-summary-not-quantified">
            <p className={cn("m-0 font-semibold text-neutral-900 dark:text-neutral-100", OPERATOR_TYPOGRAPHY.body)}>
              Not yet quantified
            </p>
            <Link
              href={SPONSOR_ROI_BASELINE_SCORECARD_HREF}
              className={cn(OPERATOR_LINK.nav, OPERATOR_TYPOGRAPHY.helper)}
              data-testid="run-savings-summary-baseline-cta"
            >
              {SPONSOR_ROI_BASELINE_GATE_CAPTURE_CTA}
            </Link>
          </div>
        ) : (
          <div className="flex flex-wrap items-baseline gap-3" data-testid="run-savings-summary-amount">
            <p className={cn("m-0", OPERATOR_TYPOGRAPHY.executiveDashboardMetric)}>{formatted}</p>
            <span
              className={cn(
                "rounded-full border border-neutral-200 bg-neutral-50 px-2 py-1 font-mono font-medium text-al-text-secondary dark:border-neutral-700 dark:bg-neutral-900/60",
                OPERATOR_TYPOGRAPHY.badge,
              )}
            >
              {badgeLabel}
            </span>
          </div>
        )}
        {!loading && !suppressAmount && props.model.basisFootnotes.length > 0 ? (
          <ul
            className={cn(
              "mt-3 space-y-1 pl-5 leading-snug text-neutral-700 marker:text-neutral-400 dark:text-neutral-300 dark:marker:text-neutral-600",
              OPERATOR_TYPOGRAPHY.navHelper,
            )}
          >
            {props.model.basisFootnotes.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        ) : null}
      </div>
    </section>
  );
}
