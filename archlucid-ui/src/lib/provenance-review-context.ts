import { deriveRunListPipelineLabel } from "@/components/runs/RunStatusBadge";
import type { ProvenanceReviewContext } from "@/components/provenance/ProvenancePageWorkspace";
import { buyerFacingReviewTitleFromSummary } from "@/lib/buyer/buyer-facing-review-title";
import type { EnterpriseStatusKind } from "@/lib/design-tokens";
import { PIPELINE_STATUS_LABELS, type RunPipelineInternalLabel } from "@/lib/pipeline-status-labels";
import { resolvePipelineStatusDisplayLabel } from "@/lib/resolve-pipeline-status-display-label";
import type { RunSummary } from "@/types/authority";

function pipelineStatusTagKind(internal: RunPipelineInternalLabel): EnterpriseStatusKind {
  switch (internal) {
    case PIPELINE_STATUS_LABELS.finalized:
      return "approved";
    case PIPELINE_STATUS_LABELS.readyToFinalize:
      return "needs-attention";
    case PIPELINE_STATUS_LABELS.inPipeline:
      return "in-progress";
    case PIPELINE_STATUS_LABELS.starting:
      return "neutral";
    default: {
      const exhaustiveCheck: never = internal;

      return exhaustiveCheck;
    }
  }
}

/** Maps a run summary into the minimal review header context for the provenance page. */
export function provenanceReviewContextFromSummary(summary: RunSummary): ProvenanceReviewContext {
  const pipelineLabel = deriveRunListPipelineLabel(summary);
  const reviewTitle = buyerFacingReviewTitleFromSummary(summary).trim();

  return {
    reviewTitle: reviewTitle.length > 0 ? reviewTitle : null,
    statusLabel: resolvePipelineStatusDisplayLabel(pipelineLabel),
    statusTagKind: pipelineStatusTagKind(pipelineLabel),
  };
}
