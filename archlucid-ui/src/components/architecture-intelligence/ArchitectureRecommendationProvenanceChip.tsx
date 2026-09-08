import type { ReactElement } from "react";

import { enterpriseStatusTagClass, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  formatArchitectureRecommendationProvenanceLine,
  isArchitectureRecommendationEvidenceBacked,
  type ArchitectureRecommendationProvenance,
} from "@/lib/architecture-intelligence/architecture-recommendation-provenance-presentation";
import { cn } from "@/lib/utils";

type ArchitectureRecommendationProvenanceChipProps = {
  readonly provenance?: ArchitectureRecommendationProvenance | null;
};

export function ArchitectureRecommendationProvenanceChip(
  props: ArchitectureRecommendationProvenanceChipProps,
): ReactElement | null {
  const line = formatArchitectureRecommendationProvenanceLine(props.provenance);

  if (line === null) {
    return null;
  }

  const evidenceBacked = isArchitectureRecommendationEvidenceBacked(props.provenance);
  const chipClass = evidenceBacked
    ? enterpriseStatusTagClass("ready")
    : enterpriseStatusTagClass("needs-attention");

  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center rounded-md border px-2 py-0.5 font-semibold",
        chipClass,
        OPERATOR_TYPOGRAPHY.helper,
      )}
      data-testid="architecture-recommendation-provenance-chip"
      role="status"
    >
      {line}
    </span>
  );
}
