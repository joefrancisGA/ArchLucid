/**
 * AS-044 — diagram source rows for the architecture identity desk (latest review context snapshot).
 */

import {
  ARCHITECTURE_IDENTITY_DESK_DIAGRAM_SOURCES_ANALYZED_STATUS,
  ARCHITECTURE_IDENTITY_DESK_DIAGRAM_SOURCES_NOT_EXTRACTED_STATUS,
} from "@/lib/architecture/architecture-identity-desk-copy";
import {
  readPixelDiagramNotVerifiableSourcesFromContextSnapshot,
} from "@/lib/architecture-spine/read-pixel-diagram-not-verifiable-sources";

/** Matches <see cref="StructuredDiagramCanonicalSourceTypes.StructuredDiagram" /> on canonical objects. */
export const STRUCTURED_DIAGRAM_CANONICAL_SOURCE_TYPE = "StructuredDiagram";

export type ArchitectureDeskDiagramSourceStatus = "analyzed" | "not-extracted";

export type ArchitectureDeskDiagramSourceRow = {
  readonly sourceKey: string;
  readonly label: string;
  readonly status: ArchitectureDeskDiagramSourceStatus;
  readonly nodeCount: number | null;
};

type CanonicalObjectWire = {
  readonly sourceType?: string;
  readonly sourceId?: string;
};

export function formatArchitectureDeskDiagramSourceRow(row: ArchitectureDeskDiagramSourceRow): string {
  if (row.status === "not-extracted") {
    return `${row.label} — ${ARCHITECTURE_IDENTITY_DESK_DIAGRAM_SOURCES_NOT_EXTRACTED_STATUS}`;
  }

  const nodeCount = row.nodeCount ?? 0;
  const nodeClause =
    nodeCount > 0 ? ` (${nodeCount} node${nodeCount === 1 ? "" : "s"})` : "";

  return `${row.label} — ${ARCHITECTURE_IDENTITY_DESK_DIAGRAM_SOURCES_ANALYZED_STATUS}${nodeClause}`;
}

function readStructuredDiagramSourceRows(contextSnapshot: Record<string, unknown>): ArchitectureDeskDiagramSourceRow[] {
  const canonicalObjects = contextSnapshot.canonicalObjects;

  if (!Array.isArray(canonicalObjects)) {
    return [];
  }

  const nodeCountBySourceId = new Map<string, number>();

  for (const item of canonicalObjects) {
    if (item === null || typeof item !== "object") {
      continue;
    }

    const wire = item as CanonicalObjectWire;
    const sourceType = wire.sourceType?.trim() ?? "";

    if (sourceType.localeCompare(STRUCTURED_DIAGRAM_CANONICAL_SOURCE_TYPE, undefined, { sensitivity: "accent" }) !== 0) {
      continue;
    }

    const sourceId = wire.sourceId?.trim() ?? "";

    if (sourceId.length === 0) {
      continue;
    }

    nodeCountBySourceId.set(sourceId, (nodeCountBySourceId.get(sourceId) ?? 0) + 1);
  }

  return [...nodeCountBySourceId.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([sourceId, nodeCount]) => ({
      sourceKey: `structured:${sourceId}`,
      label: sourceId,
      status: "analyzed" as const,
      nodeCount,
    }));
}

function readPixelDiagramSourceRows(contextSnapshot: unknown): ArchitectureDeskDiagramSourceRow[] {
  const pixelSources = readPixelDiagramNotVerifiableSourcesFromContextSnapshot(contextSnapshot);
  const seenFileNames = new Set<string>();
  const rows: ArchitectureDeskDiagramSourceRow[] = [];

  for (const source of pixelSources) {
    const fileName = source.fileName.trim();

    if (fileName.length === 0 || seenFileNames.has(fileName)) {
      continue;
    }

    seenFileNames.add(fileName);
    rows.push({
      sourceKey: `pixel:${fileName}`,
      label: fileName,
      status: "not-extracted",
      nodeCount: null,
    });
  }

  return rows;
}

export function readArchitectureDeskDiagramSourcesFromContextSnapshot(
  contextSnapshot: unknown,
): readonly ArchitectureDeskDiagramSourceRow[] {
  if (contextSnapshot === null || contextSnapshot === undefined || typeof contextSnapshot !== "object") {
    return [];
  }

  const structuredRows = readStructuredDiagramSourceRows(contextSnapshot as Record<string, unknown>);
  const pixelRows = readPixelDiagramSourceRows(contextSnapshot);

  return [...structuredRows, ...pixelRows];
}
