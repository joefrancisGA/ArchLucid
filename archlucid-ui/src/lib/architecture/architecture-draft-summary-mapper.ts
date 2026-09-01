import {
  buildArchitectureDraftRegistryEntry,
  type ArchitectureDraftRegistryEntry,
} from "@/lib/architecture/architecture-draft-registry";
import { architectureDraftSpawnedRunId } from "@/lib/architecture/architecture-draft-handoff-gate";
import { resolveArchitectureDraftCustomerStatus } from "@/lib/architecture/architecture-draft-status";
import type { DraftRequestSummary } from "@/types/draft-intake";

/** Maps a server draft summary row into the shared registry entry shape used by hub and home surfaces. */
export function mapDraftSummaryToRegistryEntry(summary: DraftRequestSummary): ArchitectureDraftRegistryEntry {
  const linkedReviewId = architectureDraftSpawnedRunId({
    spawnedRunId: summary.spawnedRunId ?? null,
  } as { spawnedRunId?: string | null });

  const customerStatus =
    summary.status === "Abandoned"
      ? "archived"
      : resolveArchitectureDraftCustomerStatus({
          linkedReviewId,
          reviewReadinessValid: summary.reviewReadinessValid,
        });

  return buildArchitectureDraftRegistryEntry(
    {
      draftId: summary.draftId,
      status: summary.status,
      document: {
        freeTextIntent: summary.freeTextIntent,
        systemName: summary.systemName ?? undefined,
        actorSet: { actors: [] },
      },
      spawnedRunId: summary.spawnedRunId ?? null,
      createdByUserId: summary.createdByUserId,
      createdUtc: summary.createdUtc,
      updatedUtc: summary.updatedUtc,
      tenantId: "",
      workspaceId: "",
      projectId: "",
    },
    {
      customerStatus,
      linkedReviewId,
      ownerLabel: "You",
    },
  );
}

export function mapDraftSummariesToRegistryEntries(
  summaries: readonly DraftRequestSummary[],
): ArchitectureDraftRegistryEntry[] {
  return summaries.map(mapDraftSummaryToRegistryEntry);
}
