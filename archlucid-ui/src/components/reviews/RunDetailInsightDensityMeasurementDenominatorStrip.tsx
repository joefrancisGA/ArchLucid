"use client";

import Link from "next/link";
import type { ReactElement } from "react";

import { useWorkspaceMode } from "@/components/WorkspaceModeProvider";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { formatInsightDensityMeasurementFloorPresentation } from "@/lib/quality/insight-density-measurement-floor";
import { cn } from "@/lib/utils";

export type RunDetailInsightDensityMeasurementDenominatorStripProps = {
  readonly enginesSucceeded?: number | null;
  readonly actorNodeCount?: number;
  readonly analysisStagesComplete?: boolean;
  readonly judgeSkippedByCap?: number | null;
  readonly className?: string;
  /** Hide engine-coverage copy when the review is in terminal failure (recovery owns the viewport). */
  readonly suppressOnTerminalFailure?: boolean;
};

/** LK-14: names the measured engine floor on Working stamp / export surfaces. */
export function RunDetailInsightDensityMeasurementDenominatorStrip(
  props: RunDetailInsightDensityMeasurementDenominatorStripProps,
): ReactElement | null {
  const { isWorkingMode } = useWorkspaceMode();

  if (!isWorkingMode || props.suppressOnTerminalFailure === true) {
    return null;
  }

  const { line, helpHref } = formatInsightDensityMeasurementFloorPresentation(props.enginesSucceeded ?? null, {
    actorNodeCount: props.actorNodeCount,
    analysisStagesComplete: props.analysisStagesComplete,
    judgeSkippedByCap: props.judgeSkippedByCap ?? null,
  });

  return (
    <p
      className={cn("m-0", OPERATOR_TYPOGRAPHY.helper, props.className)}
      data-testid="run-detail-stamp-measurement-denominator"
    >
      {line}{" "}
      <Link className={OPERATOR_LINK.nav} href={helpHref}>
        Quality inventory
      </Link>
    </p>
  );
}
