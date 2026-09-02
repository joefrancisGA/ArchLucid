import type { components } from "@/lib/openapi-schemas";

type AuthorityRunLifecyclePhase = components["schemas"]["AuthorityRunLifecyclePhase"];

export function resolveAuthorityLifecycleCommitBlock(
  phase: AuthorityRunLifecyclePhase | null | undefined,
): string | null {
  if (phase === undefined || phase === null || phase === "Complete") {
    return null;
  }

  if (phase === "Failed") {
    return "Authority pipeline failed. Re-run the review before finalizing.";
  }

  if (phase === "InProgress") {
    return "Authority pipeline is still running. Wait for completion before finalizing.";
  }

  if (phase === "NotStarted") {
    return "Authority pipeline has not started. Run the review before finalizing.";
  }

  return "Authority pipeline is not complete. Wait before finalizing.";
}

export function authorityLifecyclePhaseLabel(
  phase: AuthorityRunLifecyclePhase | null | undefined,
): string | null {
  if (phase === undefined || phase === null) {
    return null;
  }

  switch (phase) {
    case "Complete":
      return "Complete";
    case "Failed":
      return "Failed";
    case "InProgress":
      return "In progress";
    case "NotStarted":
      return "Not started";
    default:
      return phase;
  }
}
