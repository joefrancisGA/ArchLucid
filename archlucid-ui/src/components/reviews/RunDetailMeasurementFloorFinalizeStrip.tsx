"use client";

import Link from "next/link";
import type { ReactElement } from "react";

import { useWorkspaceMode } from "@/components/WorkspaceModeProvider";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { formatInsightDensityMeasurementFloorPresentation } from "@/lib/quality/insight-density-measurement-floor";
import { cn } from "@/lib/utils";

export type RunDetailMeasurementFloorFinalizeStripProps = {
  readonly enginesSucceeded?: number | null;
  readonly className?: string;
};

/** PC-01: measurement floor above finalize CTA on Working review-package scorecard. */
export function RunDetailMeasurementFloorFinalizeStrip(
  props: RunDetailMeasurementFloorFinalizeStripProps,
): ReactElement | null {
  const { isWorkingMode } = useWorkspaceMode();

  if (!isWorkingMode) {
    return null;
  }

  const presentation = formatInsightDensityMeasurementFloorPresentation(props.enginesSucceeded ?? null);

  return (
    <div
      className={cn(
        "mb-3 rounded-md border border-neutral-200 bg-neutral-50 px-3 py-2 dark:border-neutral-800 dark:bg-neutral-900/40",
        props.className,
      )}
      data-testid="run-detail-finalize-measurement-floor"
    >
      <p className={cn("m-0 font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.helper)}>
        Measurement floor
      </p>
      <p className={cn("m-0 mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
        {presentation.line}{" "}
        <Link className={OPERATOR_LINK.nav} href={presentation.helpHref}>
          Quality inventory
        </Link>
      </p>
    </div>
  );
}
