"use client";

import type { ReactElement } from "react";

import { ArchitectureSealDeltaPanel } from "@/components/architecture/ArchitectureSealDeltaPanel";

export type InhabitedFindingsAssumptionDeltaEntryProps = {
  readonly architectureId: string;
  readonly scopedRunId?: string | null;
};

/** IH-048 — read-only assumption delta vs last seal on inhabited findings. */
export function InhabitedFindingsAssumptionDeltaEntry(
  props: InhabitedFindingsAssumptionDeltaEntryProps,
): ReactElement {
  const architectureId = props.architectureId.trim();

  return (
    <div data-testid="inhabited-findings-assumption-delta-entry">
      <ArchitectureSealDeltaPanel
        architectureId={architectureId}
        currentReviewRunId={props.scopedRunId}
      />
    </div>
  );
}
