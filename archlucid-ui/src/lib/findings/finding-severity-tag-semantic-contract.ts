import contractJson from "../../../../docs/library/FINDING_SEVERITY_TAG_SEMANTIC_CONTRACT.json";

import {
  normalizeFindingSeverity,
  SEVERITY_LABELS,
  type FindingSeverityKind,
} from "@/lib/design-tokens";

export type FindingSeverityTagMapping = {
  readonly enumName: string;
  readonly enumValue: number;
  readonly uiKind: FindingSeverityKind;
  readonly displayLabel: string;
};

export type FindingSeverityTagSemanticContract = {
  readonly schemaVersion: number;
  readonly mappings: readonly FindingSeverityTagMapping[];
};

/** TB-328: canonical API enum → SeverityTag kind contract (display/formatting only in UI). */
export const FINDING_SEVERITY_TAG_SEMANTIC_CONTRACT =
  contractJson as FindingSeverityTagSemanticContract;

export function listFindingSeverityContractMismatches(): string[] {
  const mismatches: string[] = [];

  for (const mapping of FINDING_SEVERITY_TAG_SEMANTIC_CONTRACT.mappings) {
    const resolved = normalizeFindingSeverity(mapping.enumName);

    if (resolved !== mapping.uiKind) {
      mismatches.push(
        `${mapping.enumName}: expected uiKind ${mapping.uiKind}, got ${resolved}`,
      );
    }

    if (SEVERITY_LABELS[resolved] !== mapping.displayLabel) {
      mismatches.push(
        `${mapping.enumName}: expected label ${mapping.displayLabel}, got ${SEVERITY_LABELS[resolved]}`,
      );
    }
  }

  return mismatches;
}
