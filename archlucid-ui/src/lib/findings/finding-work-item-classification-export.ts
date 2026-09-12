import { POLICY_PACK_INFLUENCE_HONESTY_LINE } from "@/components/reviews/PolicyPackInfluenceHonestyChip";
import {
  resolveFindingClassificationChipReason,
  resolveFindingClassificationLabel,
  type FindingClassificationValue,
} from "@/lib/findings/finding-classification-chip-presentation";

export function formatFindingClassificationExportLine(
  classification: FindingClassificationValue,
  treatment?: number | null,
): string | null {
  const label = resolveFindingClassificationLabel(classification, treatment);
  const reason = resolveFindingClassificationChipReason(classification, treatment);

  if (label === null) {
    return null;
  }

  if (reason === null) {
    return label;
  }

  return `${label} — ${reason}`;
}

export function formatFindingWorkItemPolicyInfluenceExportLine(): string {
  return POLICY_PACK_INFLUENCE_HONESTY_LINE;
}
