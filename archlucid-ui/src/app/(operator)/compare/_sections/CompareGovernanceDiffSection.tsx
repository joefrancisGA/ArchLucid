"use client";

import type { ReactElement } from "react";

import { CompareGovernanceDiffPanel } from "@/app/(operator)/compare/_sections/CompareGovernanceDiffPanel";
import { useCompareGovernanceDiff } from "@/app/(operator)/compare/_sections/useCompareGovernanceDiff";

export type CompareGovernanceDiffSectionProps = {
  readonly baselineRunId: string | null;
  readonly targetRunId: string | null;
};

/** Client section — soft-loads governance diff without blocking structured compare render. */
export function CompareGovernanceDiffSection(props: CompareGovernanceDiffSectionProps): ReactElement {
  const { loading, view, softFailureMessage } = useCompareGovernanceDiff(
    props.baselineRunId,
    props.targetRunId,
  );

  return (
    <CompareGovernanceDiffPanel
      view={view}
      loading={loading}
      softFailureMessage={softFailureMessage}
    />
  );
}
