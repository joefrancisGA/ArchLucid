import type { ArchitectureDeskDiagramSourceRow } from "@/lib/architecture-spine/read-architecture-desk-diagram-sources";

export type ArchitectureDeskDiagramSourcesQueryData = {
  readonly snapshotStored: boolean;
  readonly rows: readonly ArchitectureDeskDiagramSourceRow[];
};

export function isArchitectureDeskDiagramContextSnapshotStored(contextSnapshot: unknown): boolean {
  return contextSnapshot !== null && contextSnapshot !== undefined && typeof contextSnapshot === "object";
}
