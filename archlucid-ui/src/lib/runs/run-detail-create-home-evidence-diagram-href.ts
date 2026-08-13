import { buildArchitectureWorkspaceTabHref } from "@/lib/architecture/architecture-workspace-tabs";

/** Create-home Evidence tab deep link to the Diagram archTab (TB-1848). */
export function buildRunDetailCreateHomeEvidenceDiagramHref(runId: string): string {
  return buildArchitectureWorkspaceTabHref(runId.trim(), "diagram", { includeCreateIntent: true });
}
