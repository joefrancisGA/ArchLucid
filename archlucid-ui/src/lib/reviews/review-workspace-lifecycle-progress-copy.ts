import type { ReviewWorkspaceLifecycle } from "@/lib/resolve-review-workspace-lifecycle";

export type ReviewWorkspaceLifecycleProgressStepId =
  | "open"
  | "evidence-findings"
  | "finalize"
  | "post-finalize";

export type ReviewWorkspaceLifecycleProgressStep = {
  readonly id: ReviewWorkspaceLifecycleProgressStepId;
  readonly label: string;
};

export const REVIEW_WORKSPACE_LIFECYCLE_PROGRESS_STEPS: readonly ReviewWorkspaceLifecycleProgressStep[] = [
  { id: "open", label: "Open review" },
  { id: "evidence-findings", label: "Evidence & findings" },
  { id: "finalize", label: "Finalize" },
  { id: "post-finalize", label: "Share & compare" },
] as const;

export function resolveReviewWorkspaceLifecycleProgressStep(
  lifecycle: ReviewWorkspaceLifecycle,
): ReviewWorkspaceLifecycleProgressStepId {
  if (lifecycle === "create-home") {
    return "open";
  }

  if (lifecycle === "finalized") {
    return "post-finalize";
  }

  return "evidence-findings";
}
