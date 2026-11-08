import type { ReviewRecordMetadataContext } from "@/lib/run-detail-workspace-derive/review-metadata";

export type ProvenanceMetadataAbsentReasons = {
  readonly contextSnapshot: string;
  readonly graphSnapshot: string;
  readonly architectureRequest: string;
};

const PROVENANCE_OMISSION_REASONS: ProvenanceMetadataAbsentReasons = {
  contextSnapshot: "Context snapshot was not stored.",
  graphSnapshot: "Graph snapshot was not stored.",
  architectureRequest: "Architecture request was not stored.",
};

export function resolveProvenanceMetadataAbsentReasons(
  _context: ReviewRecordMetadataContext,
): ProvenanceMetadataAbsentReasons {
  return PROVENANCE_OMISSION_REASONS;
}
