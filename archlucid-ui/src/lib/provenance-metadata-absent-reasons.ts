import type { ReviewRecordMetadataContext } from "@/lib/run-detail-workspace-derive/review-metadata";

export type ProvenanceMetadataAbsentReasons = {
  readonly contextSnapshot: string;
  readonly graphSnapshot: string;
  readonly architectureRequest: string;
};

const PROVENANCE_NOT_FINALIZED_REASONS: ProvenanceMetadataAbsentReasons = {
  contextSnapshot: "Not recorded — review has not finalized",
  graphSnapshot: "Not recorded — review has not finalized",
  architectureRequest: "Not recorded — no architecture request linked yet",
};

const PROVENANCE_NOT_RECORDED_REASONS: ProvenanceMetadataAbsentReasons = {
  contextSnapshot: "Not recorded — context snapshot missing from this review",
  graphSnapshot: "Not recorded — graph snapshot missing from this review",
  architectureRequest: "Not recorded — architecture request missing from this review",
};

export function resolveProvenanceMetadataAbsentReasons(
  context: ReviewRecordMetadataContext,
): ProvenanceMetadataAbsentReasons {
  return context === "not-finalized"
    ? PROVENANCE_NOT_FINALIZED_REASONS
    : PROVENANCE_NOT_RECORDED_REASONS;
}
