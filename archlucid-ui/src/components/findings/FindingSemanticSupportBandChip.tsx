import type { ReactElement } from "react";

import { StatusTag } from "@/components/ui/status-tag";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  FINDING_SEMANTIC_SUPPORT_BAND_LABELS,
  resolveDecisionGradeSemanticSupportBand,
  semanticSupportBandShortReason,
  semanticSupportBandStatusTagKind,
  type FindingSemanticSupportBandValue,
} from "@/lib/findings/semantic-support-band-presentation";
import { isDecisionGradeFinding } from "@/lib/findings/review-detail-findings-classification-band";
import type { QuickDecisionFinding } from "@/lib/quick-decision-summary-derive";
import { cn } from "@/lib/utils";

export type FindingSemanticSupportBandChipProps = {
  readonly finding: QuickDecisionFinding;
  readonly className?: string;
  readonly showReason?: boolean;
};

export function resolveSemanticSupportBandForFinding(
  finding: QuickDecisionFinding,
): FindingSemanticSupportBandValue | null {
  if (!isDecisionGradeFinding(finding)) {
    return null;
  }

  return resolveDecisionGradeSemanticSupportBand(finding.semanticSupportBand);
}

/** AS-061: compact semantic support band chip for Working decision-grade rows (ADR 0085). */
export function FindingSemanticSupportBandChip(
  props: FindingSemanticSupportBandChipProps,
): ReactElement | null {
  const band = resolveSemanticSupportBandForFinding(props.finding);

  if (band === null) {
    return null;
  }

  const label = FINDING_SEMANTIC_SUPPORT_BAND_LABELS[band];
  const showReason = props.showReason === true;

  return (
    <div
      className={cn("flex flex-col gap-1", props.className)}
      data-testid="working-finding-semantic-support-band"
      data-finding-semantic-support-band-finding-id={props.finding.findingId}
    >
      <StatusTag
        kind={semanticSupportBandStatusTagKind(band)}
        label={label}
        className="w-fit"
        data-testid={`finding-semantic-support-band-tag-${props.finding.findingId}`}
        aria-label={showReason ? `${label}. ${semanticSupportBandShortReason(band)}` : label}
      />
      {showReason ? (
        <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.micro)}>
          {semanticSupportBandShortReason(band)}
        </p>
      ) : null}
    </div>
  );
}
