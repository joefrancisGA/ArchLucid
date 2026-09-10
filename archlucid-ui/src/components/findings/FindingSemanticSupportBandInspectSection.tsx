import type { ReactElement } from "react";

import { FindingSemanticSupportBandChip } from "@/components/findings/FindingSemanticSupportBandChip";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  ARCHITECT_RESTATEMENT_SEMANTIC_SUPPORT_BAND_CLAIM_LINE_COPY,
  ARCHITECT_RESTATEMENT_SEMANTIC_SUPPORT_BAND_RESTATEMENT_LINE_COPY,
  shouldShowArchitectRestatementSemanticSupportBandSplit,
} from "@/lib/findings/finding-architect-restatement-semantic-support-band-honesty";
import {
  normalizeFindingSemanticSupportBand,
  resolveDecisionGradeSemanticSupportBand,
  semanticSupportBandInspectDetail,
} from "@/lib/findings/semantic-support-band-presentation";
import { isDecisionGradeFinding } from "@/lib/findings/review-detail-findings-classification-band";
import type { QuickDecisionFinding } from "@/lib/quick-decision-summary-derive";
import { cn } from "@/lib/utils";

export type FindingSemanticSupportBandInspectSectionProps = {
  readonly finding: QuickDecisionFinding;
  readonly trailBackedArchitectRestatement?: string | null;
};

export function findingSemanticSupportBandFromTypedPayload(
  typedPayload: Record<string, unknown> | null,
  classification: QuickDecisionFinding["classification"],
): QuickDecisionFinding["semanticSupportBand"] {
  const band = normalizeFindingSemanticSupportBand(typedPayload?.semanticSupportBand);

  if (classification === "ChecklistCoverage") {
    return band;
  }

  return band ?? resolveDecisionGradeSemanticSupportBand(null);
}

/** AS-061 inspect section beside model provenance for decision-grade findings. */
export function FindingSemanticSupportBandInspectSection(
  props: FindingSemanticSupportBandInspectSectionProps,
): ReactElement | null {
  if (!isDecisionGradeFinding(props.finding)) {
    return null;
  }

  const band = resolveDecisionGradeSemanticSupportBand(props.finding.semanticSupportBand);
  const showRestatementSplit = shouldShowArchitectRestatementSemanticSupportBandSplit(
    props.trailBackedArchitectRestatement,
  );

  return (
    <div
      className="mt-4 rounded-md border border-neutral-200 bg-al-surface-raised px-3 py-2 dark:border-neutral-800"
      data-testid="finding-semantic-support-band-section"
    >
      <p className={cn("m-0 font-semibold text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>
        Semantic support
      </p>
      <div className="mt-2">
        <FindingSemanticSupportBandChip finding={props.finding} />
      </div>
      {showRestatementSplit ? (
        <p className={cn("m-0 mt-2 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
          {ARCHITECT_RESTATEMENT_SEMANTIC_SUPPORT_BAND_CLAIM_LINE_COPY}
        </p>
      ) : null}
      <p className={cn("m-0 mt-2 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
        {semanticSupportBandInspectDetail(band)}
      </p>
      {showRestatementSplit ? (
        <p
          className={cn("m-0 mt-2 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
          data-testid="finding-architect-restatement-semantic-support-band-honesty"
        >
          {ARCHITECT_RESTATEMENT_SEMANTIC_SUPPORT_BAND_RESTATEMENT_LINE_COPY}
        </p>
      ) : null}
    </div>
  );
}
