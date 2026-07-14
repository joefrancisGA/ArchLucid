import { buyerDemoPackageCardMeta } from "@/lib/buyer-demo-package-card-meta";
import type { RunSummary } from "@/types/authority";

export type ReviewsHubOverallStatus = "Draft" | "Active" | "Awaiting approval" | "Finalized" | "Archived";

export type ReviewsHubLifecycleStage =
  | "Architecture definition"
  | "Evidence collection"
  | "Evaluation"
  | "Decision"
  | "Approval";

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

export function reviewsHubLifecycleStage(run: RunSummary): ReviewsHubLifecycleStage {
  if (run.isArchived === true) {
    return "Approval";
  }

  if (run.hasGoldenManifest === true) {
    const status = reviewsHubOverallStatus(run);

    if (status === "Awaiting approval") {
      return "Approval";
    }

    return "Approval";
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
