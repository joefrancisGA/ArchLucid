"use client";

import type { ReactElement } from "react";

import { CompareFindingCorrelationPanel } from "@/app/(operator)/insights/compare-two-reviews/_sections/CompareFindingCorrelationPanel";
import { useCompareFindingCorrelation } from "@/app/(operator)/insights/compare-two-reviews/_sections/useCompareFindingCorrelation";

export type CompareFindingCorrelationSectionProps = {
  readonly baselineRunId: string | null;
  readonly targetRunId: string | null;
};

/** Client section — soft-loads finding correlation metadata without blocking structured compare render. */
export function CompareFindingCorrelationSection(
  props: CompareFindingCorrelationSectionProps,
): ReactElement {
  const { loading, metadata, lifecycle, lifecycleRecords, softFailureMessage } = useCompareFindingCorrelation(
    props.baselineRunId,
    props.targetRunId,
  );

  return (
    <CompareFindingCorrelationPanel
      metadata={metadata}
      lifecycle={lifecycle}
      lifecycleRecords={lifecycleRecords}
      priorRunId={props.baselineRunId}
      laterRunId={props.targetRunId}
      loading={loading}
      softFailureMessage={softFailureMessage}
    />
  );
}
