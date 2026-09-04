"use client";

import { GovernanceRecordCorrectionInlineControl } from "@/components/governance/GovernanceRecordCorrectionInlineControl";
import type { GovernanceMutationCorrectionTarget } from "@/lib/governance/governance-mutation-correction-api";
import { mutationSupportsAmend } from "@/lib/mutation-reversibility-registry";

export type FindingDispositionRecordCorrectionControlProps = {
  readonly findingId: string;
  readonly runId: string;
  readonly hasRecordedDisposition: boolean;
  readonly testId?: string;
};

/** Persistent record-correction affordance after the undo window expires (WA-11). */
export function FindingDispositionRecordCorrectionControl(
  props: FindingDispositionRecordCorrectionControlProps,
): React.JSX.Element | null {
  if (!props.hasRecordedDisposition || !mutationSupportsAmend("governance_keyboard_finding_disposition")) {
    return null;
  }

  const target: GovernanceMutationCorrectionTarget = {
    mutationKind: "governance_keyboard_finding_disposition",
    subjectId: props.findingId,
    runId: props.runId,
  };

  return (
    <GovernanceRecordCorrectionInlineControl
      target={target}
      testId={props.testId ?? "finding-disposition-record-correction"}
    />
  );
}
