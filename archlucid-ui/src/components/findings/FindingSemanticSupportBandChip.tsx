import type { ReactElement } from "react";

import { StatusTag } from "@/components/ui/status-tag";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { isDecisionGradeFinding } from "@/lib/findings/review-detail-findings-classification-band";
import {
  presentDecisionGradeSemanticSupportBand,
  type PresentedSemanticSupportBand,
} from "@/lib/governance/simulator-career-honesty";
import type { QuickDecisionFinding } from "@/lib/quick-decision-summary-derive";
import type { StructuralExecutionModeInput } from "@/lib/structural-execution-mode";
import { cn } from "@/lib/utils";

export type FindingSemanticSupportBandChipProps = {
  readonly finding: QuickDecisionFinding;
  readonly className?: string;
  readonly showReason?: boolean;
  readonly structuralExecutionMode?: StructuralExecutionModeInput;
};

export function resolveSemanticSupportBandPresentationForFinding(
  finding: QuickDecisionFinding,
  structuralExecutionMode?: StructuralExecutionModeInput,
): PresentedSemanticSupportBand | null {
  if (!isDecisionGradeFinding(finding)) {
    return null;
  }

  return presentDecisionGradeSemanticSupportBand({
    wireBand: finding.semanticSupportBand,
    structuralExecutionMode,
  });
}

/** AS-061: compact semantic support band chip for Working decision-grade rows (ADR 0085). */
export function FindingSemanticSupportBandChip(
  props: FindingSemanticSupportBandChipProps,
): ReactElement | null {
  const presentation = resolveSemanticSupportBandPresentationForFinding(
    props.finding,
    props.structuralExecutionMode,
  );

  if (presentation === null) {
    return null;
  }

  const showReason = props.showReason === true;

  return (
    <div
      className={cn("flex flex-col gap-1", props.className)}
      data-testid="working-finding-semantic-support-band"
      data-finding-semantic-support-band-finding-id={props.finding.findingId}
      data-finding-semantic-support-band-rehearsal={
        presentation.isRehearsalPresentation ? "true" : "false"
      }
    >
      <StatusTag
        kind={presentation.statusTagKind}
        label={presentation.label}
        className="w-fit"
        data-testid={`finding-semantic-support-band-tag-${props.finding.findingId}`}
        aria-label={showReason ? `${presentation.label}. ${presentation.reason}` : presentation.label}
      />
      {showReason ? (
        <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.micro)}>
          {presentation.reason}
        </p>
      ) : null}
    </div>
  );
}
