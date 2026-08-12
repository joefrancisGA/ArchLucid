import {
  deriveFindingTrustPresentation,
  type FindingModelProvenanceRow,
  type FindingTrustPresentationInput,
} from "@/lib/finding-trust-presentation";

export type { FindingModelProvenanceRow };

export type FindingModelProvenanceInput = FindingTrustPresentationInput;

/** Reviewer-facing model provenance row for finding inspect surfaces. */
export function buildFindingModelProvenanceRow(input: FindingModelProvenanceInput): FindingModelProvenanceRow {
  return deriveFindingTrustPresentation(input).inspectRow;
}
