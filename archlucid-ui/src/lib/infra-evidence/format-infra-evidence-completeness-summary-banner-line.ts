import type { InfraEvidenceMermaidCompletenessSummary } from "@/lib/infra-evidence/infra-evidence-mermaid-types";

function formatCompletenessCount(value: number | null, label: string): string {
  if (value === null) {
    return `${label} was not stored.`;
  }

  return String(value);
}

export function formatInfraEvidenceCompletenessSummaryBannerLine(
  summary: InfraEvidenceMermaidCompletenessSummary,
): string {
  const visibleNodeCount = formatCompletenessCount(summary.visibleNodeCount, "Visible resource count");
  const connectedComponentCount = formatCompletenessCount(
    summary.connectedComponentCount,
    "Connected component count",
  );
  const visibleEdgeCount = formatCompletenessCount(summary.visibleEdgeCount, "Visible relationship count");
  const hiddenHops =
    summary.hiddenHopsUsedCount === null
      ? " Hidden attachment hop count was not stored."
      : summary.hiddenHopsUsedCount > 0
        ? ` (${summary.hiddenHopsUsedCount} from hidden attachment hops)`
        : "";
  if (
    summary.visibleNodeCount === null
    || summary.connectedComponentCount === null
    || summary.visibleEdgeCount === null
  ) {
    return [visibleNodeCount, connectedComponentCount, visibleEdgeCount].filter((part) => part.length > 0).join(" ");
  }

  const missing =
    summary.missingClasses === null || summary.missingClasses === undefined
      ? " Missing resource classes were not stored."
      : summary.missingClasses.length > 0
        ? ` Missing: ${summary.missingClasses.join("; ")}.`
        : "";

  const collocationPart =
    summary.likelyInCollocationEdgeCount === null
      ? ", including likely-in collocation count was not stored."
      : summary.likelyInCollocationEdgeCount > 0
        ? `, including ${summary.likelyInCollocationEdgeCount} same-resource-group guesses that are not stored connections.`
        : ".";

  return `${visibleNodeCount} resources in ${connectedComponentCount} connected components on this diagram. ${visibleEdgeCount} lines on the diagram${hiddenHops}${collocationPart}${missing}`;
}
