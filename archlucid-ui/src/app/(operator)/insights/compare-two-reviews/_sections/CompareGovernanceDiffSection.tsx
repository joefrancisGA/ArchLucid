"use client";

import type { ReactElement } from "react";

import { CompareGovernanceDiffPanel } from "@/app/(operator)/insights/compare-two-reviews/_sections/CompareGovernanceDiffPanel";
import {
  useCompareGovernanceDiff,
  type CompareGovernanceDiffLoadState,
} from "@/app/(operator)/insights/compare-two-reviews/_sections/useCompareGovernanceDiff";

export type CompareGovernanceDiffSectionProps = {
  readonly baselineRunId: string | null;
  readonly targetRunId: string | null;
  readonly preloaded?: CompareGovernanceDiffLoadState;
};

/** Client section — soft-loads governance diff without blocking structured compare render. */
export function CompareGovernanceDiffSection(props: CompareGovernanceDiffSectionProps): ReactElement {
  const internal = useCompareGovernanceDiff(
    props.preloaded !== undefined ? null : props.baselineRunId,
    props.preloaded !== undefined ? null : props.targetRunId,
  );
  const { loading, view, softFailureMessage } = props.preloaded ?? internal;

  return (
    <CompareGovernanceDiffPanel
      view={view}
      loading={loading}
      softFailureMessage={softFailureMessage}
      hideCurrentEffectiveDisclaimer
    />
  );
}
