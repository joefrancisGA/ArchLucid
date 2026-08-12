"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import type { ReactElement } from "react";

import { usePilotRoiBaselineCompleteness } from "@/hooks/use-pilot-roi-baseline-completeness";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import { formatUsd } from "@/lib/roi-assumptions";
import { OPERATOR_NAV_GROUP_LABEL, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  resolveSponsorRoiBaselineGate,
  shouldShowSponsorRoiBaselineGateNotice,
  SPONSOR_ROI_BASELINE_GATE_CAPTURE_CTA,
  SPONSOR_ROI_BASELINE_SCORECARD_HREF,
} from "@/lib/sponsor-roi-baseline-gate";
import type { RunSavingsSummaryModel, RunSavingsSummarySourceKind } from "@/lib/run-savings-summary-model";

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

/** Highlights annualized savings opportunity on run detail (server resolver or demo-only heuristics). */
export function RunSavingsSummary(props: { readonly model: RunSavingsSummaryModel }): ReactElement {
  const { loading, complete } = usePilotRoiBaselineCompleteness();
  const baselineGateStatus =
    complete === null
      ? "not-applicable"
      : resolveSponsorRoiBaselineGate({
          hasBaselines: complete,
          isFinalized: true,
        });
  const suppressQuantifiedFigure = shouldShowSponsorRoiBaselineGateNotice(baselineGateStatus);
  const formatted = formatUsd(props.model.annualizedUsd);
  const badgeLabel = sourceBadgeLabel(props.model.sourceKind);

  if (!loading && suppressQuantifiedFigure) {
    return (
      <section aria-label="Annualized savings opportunity" className="scroll-mt-24">
        <div className="rounded-md border border-neutral-200 bg-al-surface-raised px-4 py-3 dark:border-neutral-800">
          <p className={cn("m-0 mb-1", OPERATOR_NAV_GROUP_LABEL)}>
            Annualized savings opportunity
          </p>
          <div className="flex flex-wrap items-baseline gap-3">
            <p className={cn("m-0 font-semibold text-neutral-900 dark:text-neutral-100", OPERATOR_TYPOGRAPHY.body)}>
              Not yet quantified
            </p>
            <Link
              href={SPONSOR_ROI_BASELINE_SCORECARD_HREF}
              className={cn(
                "rounded-md border border-neutral-200 bg-neutral-50 px-2 py-1 font-medium text-neutral-800 dark:border-neutral-700 dark:bg-neutral-900/60 dark:text-neutral-100",
                OPERATOR_TYPOGRAPHY.badge,
              )}
              data-testid="run-savings-summary-baseline-capture"
            >
              {SPONSOR_ROI_BASELINE_GATE_CAPTURE_CTA}
            </Link>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section aria-label="Annualized savings opportunity" className="scroll-mt-24">
      <div className="rounded-md border border-neutral-200 bg-al-surface-raised px-4 py-3 dark:border-neutral-800">
        <p className={cn("m-0 mb-1", OPERATOR_NAV_GROUP_LABEL)}>
          Annualized savings opportunity
        </p>
        <div className="flex flex-wrap items-baseline gap-3">
          <p className={cn("m-0", OPERATOR_TYPOGRAPHY.executiveDashboardMetric)}>{formatted}</p>
          <span className={cn("rounded-md border border-neutral-200 bg-neutral-50 px-2 py-1 font-medium text-neutral-800 dark:border-neutral-700 dark:bg-neutral-900/60 dark:text-neutral-100", OPERATOR_TYPOGRAPHY.badge)}>
            {badgeLabel}
          </span>
        </div>
        {props.model.basisFootnotes.length === 0 ? null : (
          <ul className={cn("mt-3 space-y-1 pl-5 leading-snug text-neutral-700 marker:text-neutral-400 dark:text-neutral-300 dark:marker:text-neutral-600", OPERATOR_TYPOGRAPHY.navHelper)}>
            {props.model.basisFootnotes.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
