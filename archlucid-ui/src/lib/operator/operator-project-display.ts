import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import { DEV_SCOPE_PROJECT_ID } from "@/lib/scope";

/**
 * Maps raw project ids to buyer-facing labels in demo builds (e.g. {@code default} workspace).
 */
export function formatOperatorProjectIdDisplay(projectId: string): string {
  const trimmed = projectId.trim();

  if (trimmed.toLowerCase() === "default") {
    return isBuyerPolishedOperatorShellEnv() ? "Primary project" : "Primary workspace";
  }

  if (trimmed === "claims-intake-sample-workspace" || trimmed === DEV_SCOPE_PROJECT_ID) {
    return "Claims Intake sample workspace";
  }

  return projectId;
}
