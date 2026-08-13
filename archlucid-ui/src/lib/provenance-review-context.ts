import type { ProvenanceReviewContext } from "@/components/provenance/ProvenancePageWorkspace";
import { buyerFacingReviewTitleFromSummary } from "@/lib/buyer/buyer-facing-review-title";
import { resolveRunPipelineStatusPresentation } from "@/lib/runs/run-pipeline-status-presentation";
import type { RunSummary } from "@/types/authority";

/** Maps a run summary into the minimal review header context for the provenance page. */
export function provenanceReviewContextFromSummary(summary: RunSummary): ProvenanceReviewContext {
  const presentation = resolveRunPipelineStatusPresentation(summary);
  const reviewTitle = buyerFacingReviewTitleFromSummary(summary).trim();

  return {
    reviewTitle: reviewTitle.length > 0 ? reviewTitle : null,
    statusLabel: presentation.displayLabel,
    statusTagKind: presentation.statusTagKind,
  };
}
