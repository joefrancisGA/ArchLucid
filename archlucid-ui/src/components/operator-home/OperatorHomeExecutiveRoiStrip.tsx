"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import { useEffect, useState } from "react";

import { useNavCommittedArchitectureReview } from "@/components/OperatorNavAuthorityProvider";
import { OperatorApiProblem } from "@/components/OperatorApiProblem";
import { RoiDispositionTrainingTooltip } from "@/components/roi/RoiDispositionTrainingTooltip";
import { Button } from "@/components/ui/button";
import type { ExecutiveRoiSummary } from "@/lib/executive-summary-markdown";
import { fetchExecutiveRoiSummaryClient } from "@/lib/fetch-executive-roi-summary-client";
import { toApiLoadFailure, type ApiLoadFailureState } from "@/lib/api-load-failure";
import {
  OPERATOR_LAYOUT,
  OPERATOR_SURFACE_CARD_CLASS,
  OPERATOR_TYPE_SCALE,
} from "@/lib/design-tokens";
import { resolveExecutiveHeadlineScopeLabel } from "@/lib/roi-sponsor-scope-labels";
import {
  buildExecutiveServerSavingsSummary,
  resolveRunSavingsUsd,
} from "@/lib/roi-resolution-priority";
import { formatUsd } from "@/lib/roi-assumptions";

/** Compact executive ROI strip on Overview after the first committed review package. */
export function OperatorHomeExecutiveRoiStrip(): React.JSX.Element | null {
  const hasCommittedArchitectureReview = useNavCommittedArchitectureReview();
  const [summary, setSummary] = useState<ExecutiveRoiSummary | null>(null);
  const [failure, setFailure] = useState<ApiLoadFailureState | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!hasCommittedArchitectureReview) {
      setSummary(null);
      setFailure(null);
      setLoading(false);

      return undefined;
    }

    let cancelled = false;
    setLoading(true);

    void (async () => {
      try {
        const json = await fetchExecutiveRoiSummaryClient();

        if (!cancelled) {
          setSummary(json);
          setFailure(null);
        }
      } catch (error: unknown) {
        if (!cancelled) {
          setSummary(null);
          setFailure(toApiLoadFailure(error));
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [hasCommittedArchitectureReview]);

  if (!hasCommittedArchitectureReview) {
    return null;
  }

  if (loading && summary === null && failure === null) {
    return (
      <section
        aria-labelledby="operator-home-roi-strip-heading"
        className={cn(OPERATOR_SURFACE_CARD_CLASS, "p-4")}
        data-testid="operator-home-roi-strip-loading"
      >
        <p className={cn("m-0", OPERATOR_TYPE_SCALE.helper, "text-al-text-secondary")}>Loading executive summary…</p>
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

  if (summary === null) {
    return null;
  }

  const resolvedSavings = resolveRunSavingsUsd({
    serverSummary: buildExecutiveServerSavingsSummary(
      summary.totalEstimatedUsdSavings,
      summary.savingsPricingBasisDescription,
    ),
  });
  const savingsLabel =
    resolvedSavings !== null ? formatUsd(resolvedSavings.annualizedUsd) : "—";
  const scopeLabel = resolveExecutiveHeadlineScopeLabel(summary);

  return (
    <section
      aria-labelledby="operator-home-roi-strip-heading"
      className={cn(OPERATOR_SURFACE_CARD_CLASS, "p-4")}
      data-testid="operator-home-roi-strip"
    >
      <div className={cn("flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between", OPERATOR_LAYOUT.inlineGap)}>
        <div className="min-w-0 space-y-1">
          <h2 id="operator-home-roi-strip-heading" className={cn("m-0", OPERATOR_TYPE_SCALE.sectionTitle)}>
            <span className="inline-flex items-center gap-1">
              Executive ROI
              <RoiDispositionTrainingTooltip />
            </span>
          </h2>
          <p className={cn("m-0", OPERATOR_TYPE_SCALE.helper, "text-al-text-secondary")}>
            <span className="font-medium text-al-text-primary">{savingsLabel}</span>
            {" "}
            estimated savings ({scopeLabel})
          </p>
          <p className={cn("m-0", OPERATOR_TYPE_SCALE.helper, "text-al-text-secondary/80")}>
            {summary.systemCount} system{summary.systemCount === 1 ? "" : "s"} · {summary.latestRunCount} committed review
            {summary.latestRunCount === 1 ? "" : "s"}
          </p>
        </div>
        <Button asChild variant="outline" size="sm" className="h-8 shrink-0">
          <Link href="/dashboard" data-testid="operator-home-roi-strip-open-dashboard">
            Open full summary
          </Link>
        </Button>
      </div>
    </section>
  );
}
