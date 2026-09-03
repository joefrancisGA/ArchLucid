"use client";

import { TransparencyTrailPanel } from "@/components/feasibility/TransparencyTrailPanel";
import type { ManifestFeasibilityVerdict } from "@/types/feasibility-verdict";

export type RunDetailOverviewTransparencyTrailProps = {
  readonly feasibilityVerdict: ManifestFeasibilityVerdict | null | undefined;
  readonly runCompleted: boolean;
};

/** Overview transparency trail with defect callout when a completed review omits the mandatory record. */
export function RunDetailOverviewTransparencyTrail(props: RunDetailOverviewTransparencyTrailProps) {
  const trail = props.feasibilityVerdict?.transparencyTrail ?? null;
  const missingTrailDefect = props.runCompleted && trail === null;

  return (
    <TransparencyTrailPanel
      trail={trail}
      missingTrailDefect={missingTrailDefect}
    />
  );
}
