import {
  ARCHITECTURE_FINDINGS_DUAL_PANE_NO_NODE_MATCH,
  type ArchitectureFindingsDiagramSelectionSync,
  type ArchitectureFindingsDualPaneFindingRef,
} from "@/lib/architecture/architecture-findings-dual-pane";

export function buildFindingDiagramSpotlight(
  sync: ArchitectureFindingsDiagramSelectionSync,
  finding: ArchitectureFindingsDualPaneFindingRef,
): string {
  const title = finding.title.trim();

  if (sync.matchKind === "none" || sync.matchedNodeLabel === null) {
    return ARCHITECTURE_FINDINGS_DUAL_PANE_NO_NODE_MATCH;
  }

  if (sync.matchKind === "node-id") {
    const base = `This finding cites ${sync.matchedNodeLabel} on the diagram.`;

    if (title.length === 0) {
      return base;
    }

    return `${base} ${title}`;
  }

  const base =
    `Linked by name to ${sync.matchedNodeLabel} — not a package citation. Open findings for the full record.`;

  if (title.length === 0) {
    return base;
  }

  return `${base} ${title}`;
}
