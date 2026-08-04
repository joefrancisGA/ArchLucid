import {
  FINDING_PROVENANCE_ORIGIN_EXPLANATIONS,
  resolveFindingProvenance,
  type FindingProvenanceDisplay,
} from "@/lib/finding-provenance-display";

export type FindingModelProvenanceRow = {
  readonly origin: string;
  readonly grounding: string;
  readonly explanation: string;
  readonly trustLabelReason: string | null;
};

export type FindingModelProvenanceInput = {
  readonly trustLabel?: string | null;
  readonly trustLabelReason?: string | null;
  readonly policyRuleId?: string | null;
  readonly evidenceRefCount?: number | null;
  readonly confidenceLevel?: string | null;
  readonly isSimulatorRun?: boolean;
};

/** Reviewer-facing model provenance row for finding inspect surfaces. */
export function buildFindingModelProvenanceRow(input: FindingModelProvenanceInput): FindingModelProvenanceRow {
  const provenance: FindingProvenanceDisplay = resolveFindingProvenance({
    trustLabel: input.trustLabel,
    policyRuleId: input.policyRuleId,
    evidenceRefCount: input.evidenceRefCount,
    confidenceLevel: input.confidenceLevel,
    isSimulatorRun: input.isSimulatorRun,
  });

  const trustLabelReason =
    typeof input.trustLabelReason === "string" && input.trustLabelReason.trim().length > 0
      ? input.trustLabelReason.trim()
      : null;

  return {
    origin: provenance.origin,
    grounding: provenance.grounding,
    explanation: FINDING_PROVENANCE_ORIGIN_EXPLANATIONS[provenance.origin],
    trustLabelReason,
  };
}
