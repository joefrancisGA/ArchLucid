import { buyerDemoPackageCardMeta } from "@/lib/buyer/buyer-demo-package-card-meta";
import type { EnterpriseStatusKind } from "@/lib/design-tokens";
import type { RunSummary } from "@/types/authority";

export type ReviewsHubOverallStatus = "Draft" | "Active" | "Awaiting approval" | "Finalized" | "Archived";

export type ReviewsHubLifecycleStage =
  | "Architecture definition"
  | "Evidence collection"
  | "Evaluation"
  | "Finalized";

export function reviewsHubOverallStatus(run: RunSummary): ReviewsHubOverallStatus {
  if (run.isArchived === true) {
    return "Archived";
  }

  if (run.hasGoldenManifest === true) {
    const demoMeta = buyerDemoPackageCardMeta(run.runId);

    if (demoMeta !== null && demoMeta.decisionSummary.toLowerCase().includes("in progress")) {
      return "Awaiting approval";
    }

    if (run.hasGovernanceWarnings === true) {
      return "Active";
    }

    return "Finalized";
  }

  if (run.hasFindingsSnapshot === true || run.hasGraphSnapshot === true || run.hasContextSnapshot === true) {
    return "Active";
  }

  return "Draft";
}

/**
 * How far a review progressed through the pipeline. "Finalized" means a signed manifest exists — it
 * does not imply a governance approval request was submitted, so this stage never says "Approval"
 * (that word is reserved for the approval queue). Archived reviews keep the stage they reached;
 * archival is reported by {@link reviewsHubOverallStatus} instead.
 */
export function reviewsHubLifecycleStage(run: RunSummary): ReviewsHubLifecycleStage {
  if (run.hasGoldenManifest === true) {
    return "Finalized";
  }

  if (run.hasFindingsSnapshot === true) {
    return "Evaluation";
  }

  if (run.hasGraphSnapshot === true || run.hasContextSnapshot === true) {
    return "Evidence collection";
  }

  return "Architecture definition";
}

export function reviewsHubNeedsAttention(run: RunSummary): boolean {
  if (run.isArchived === true) {
    return false;
  }

  if (run.hasGoldenManifest === true && run.hasGovernanceWarnings === true) {
    return true;
  }

  if (run.hasGoldenManifest === true) {
    return false;
  }

  const openFindings = typeof run.findingCount === "number" && run.findingCount > 0;
  const openWarnings = typeof run.warningCount === "number" && run.warningCount > 0;

  return openFindings || openWarnings || run.hasWarnings === true || run.hasGovernanceWarnings === true;
}

/** Map inventory overall status onto enterprise StatusTag kinds. */
export function reviewsHubOverallStatusTagKind(
  status: ReviewsHubOverallStatus,
  attention: boolean,
): EnterpriseStatusKind {
  if (attention) {
    return "needs-attention";
  }

  switch (status) {
    case "Draft":
      return "draft";

    case "Active":
      return "in-progress";

    case "Awaiting approval":
      return "needs-attention";

    case "Finalized":
      return "approved";

    case "Archived":
      return "neutral";

    default: {
      const _exhaustive: never = status;

      return _exhaustive;
    }
  }
}
