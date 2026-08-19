"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import { useMemo } from "react";

import { useSponsorRoiSummaryQuery } from "@/hooks/use-sponsor-roi-summary-query";
import { useNavCommittedArchitectureReview } from "@/components/operator/OperatorNavAuthorityProvider";
import { OperatorApiProblem } from "@/components/operator/OperatorApiProblem";
import { RoiDispositionTrainingTooltip } from "@/components/roi/RoiDispositionTrainingTooltip";
import { toApiLoadFailure } from "@/lib/api-load-failure";
import {
  OPERATOR_LINK,
  OPERATOR_SURFACE_CARD_CLASS,
  OPERATOR_TYPE_SCALE,
} from "@/lib/design-tokens";
import { resolveSponsorHeadlineScopeLabel } from "@/lib/roi-sponsor-scope-labels";
import {
  buildSponsorServerSavingsSummary,
  resolveRunSavingsUsd,
} from "@/lib/roi-resolution-priority";
import { formatUsd } from "@/lib/roi-assumptions";

/** Compact sponsor ROI story on Overview after the first committed review. */
export function OperatorHomeSponsorRoiStrip(): React.JSX.Element | null {
  const hasCommittedArchitectureReview = useNavCommittedArchitectureReview();
  const summaryQuery = useSponsorRoiSummaryQuery({ enabled: hasCommittedArchitectureReview });

  const failure = useMemo(
    () => (summaryQuery.isError ? toApiLoadFailure(summaryQuery.error) : null),
    [summaryQuery.isError, summaryQuery.error],
  );

  if (!hasCommittedArchitectureReview) {
    return null;
  }

  if (summaryQuery.isPending && summaryQuery.data === undefined && failure === null) {
    return (
      <section
        aria-labelledby="operator-home-roi-strip-heading"
        className={cn(OPERATOR_SURFACE_CARD_CLASS, "p-4")}
        data-testid="operator-home-roi-strip-loading"
      >
        <p className={cn("m-0", OPERATOR_TYPE_SCALE.helper, "text-al-text-secondary")}>Loading sponsor report…</p>
      </section>
    );
  }

  if (failure !== null) {
    return (
      <section
        aria-labelledby="operator-home-roi-strip-heading"
        className={cn(OPERATOR_SURFACE_CARD_CLASS, "p-4")}
        data-testid="operator-home-roi-strip-error"
      >
        <OperatorApiProblem failure={failure} />
      </section>
    );
  }

  const summary = summaryQuery.data ?? null;

  if (summary === null) {
    return null;
  }

  const resolvedSavings = resolveRunSavingsUsd({
    serverSummary: buildSponsorServerSavingsSummary(
      summary.totalEstimatedUsdSavings,
      summary.savingsPricingBasisDescription,
    ),
  });

  // TB-1037: hide empty/zero savings chrome — do not imply estimated savings without data.
  if (
    resolvedSavings === null ||
    !Number.isFinite(resolvedSavings.annualizedUsd) ||
    resolvedSavings.annualizedUsd <= 0 ||
    summary.latestRunCount < 1
  ) {
    return null;
  }

  const savingsLabel = formatUsd(resolvedSavings.annualizedUsd);
  const scopeLabel = resolveSponsorHeadlineScopeLabel(summary);

  return (
    <section
      aria-labelledby="operator-home-roi-strip-heading"
      className={cn(OPERATOR_SURFACE_CARD_CLASS, "p-4")}
      data-testid="operator-home-roi-strip"
    >
      <h2 id="operator-home-roi-strip-heading" className="sr-only">
        Sponsor ROI
      </h2>
      <p className={cn("m-0", OPERATOR_TYPE_SCALE.body, "text-al-text-secondary")}>
        <span className="inline-flex items-baseline gap-1.5 font-medium text-al-text-primary">
          {savingsLabel}
          <RoiDispositionTrainingTooltip />
        </span>
        {" estimated savings from "}
        {summary.latestRunCount} committed review
        {summary.latestRunCount === 1 ? "" : "s"}
        {" ("}
        {scopeLabel}
        {"). "}
        <Link
          href="/insights/architecture-scorecard"
          className={OPERATOR_LINK.optional}
          data-testid="operator-home-roi-strip-open-scorecard"
        >
          See architecture scorecard
        </Link>
      </p>
    </section>
  );
}
