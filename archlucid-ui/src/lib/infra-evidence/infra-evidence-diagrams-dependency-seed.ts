import type { InfraEvidenceMermaidRenderResponse } from "@/lib/infra-evidence/infra-evidence-mermaid-types";

export type DependencyNeighborhoodSeedBlockedReason = {
  readonly title: string;
  readonly message: string;
};

export function dependencyNeighborhoodRequiresAppliedSeed(
  mode: string,
  appliedSeedNodeId: string,
): boolean {
  return mode === "dependencyNeighborhood" && appliedSeedNodeId.trim().length === 0;
}

export function resolveDependencyNeighborhoodSeedBlockedReason(input: {
  readonly appliedSeedNodeId: string;
  readonly loadError: string | null;
  readonly renderResult: InfraEvidenceMermaidRenderResponse | null;
}): DependencyNeighborhoodSeedBlockedReason | null {
  const appliedSeed = input.appliedSeedNodeId.trim();

  if (appliedSeed.length === 0) {
    return null;
  }

  if (input.loadError != null && input.loadError.trim().length > 0) {
    return {
      title: "Dependency neighborhood could not render",
      message: input.loadError.trim(),
    };
  }

  const renderResult = input.renderResult;

  if (renderResult == null) {
    return null;
  }

  if (renderResult.status === "Failed") {
    return {
      title: "Dependency neighborhood could not render",
      message:
        "Diagram rendering failed for the selected seed. Pick a different graph node id and try again.",
    };
  }

  const mermaidEmpty = (renderResult.mermaid ?? "").trim().length === 0;
  const nodeCount = renderResult.metrics?.nodeCount ?? 0;

  if (renderResult.status === "Succeeded" && (mermaidEmpty || nodeCount === 0)) {
    return {
      title: "Seed did not match this snapshot",
      message:
        `No neighborhood was found for seed "${appliedSeed}". Use the graph node id from the node table (usually the cloud resource GUID), not an ARM resource path or Mermaid node hash.`,
    };
  }

  return null;
}
