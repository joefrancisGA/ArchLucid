import type { EnterpriseStatusKind } from "@/lib/design-tokens";

/** Maps persisted authority stage outcome to enterprise StatusTag kind (TB-250). */
export function mapPipelineStageOutcomeToStatusKind(outcomeStatus: string): EnterpriseStatusKind {
  switch (outcomeStatus) {
    case "succeeded":
      return "ready";

    case "failed":
      return "blocked";

    case "running":
      return "in-progress";

    case "skipped":
      return "neutral";

    default:
      return "needs-attention";
  }
}

/** Human label for pipeline stage outcome chips. */
export function pipelineStageOutcomeLabel(outcomeStatus: string): string {
  switch (outcomeStatus) {
    case "succeeded":
      return "Succeeded";

    case "failed":
      return "Failed";

    case "running":
      return "Running";

    case "skipped":
      return "Skipped";

    default:
      return outcomeStatus;
  }
}
