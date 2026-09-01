import {
  buildArchitectureDraftRegistryEntry,
  type ArchitectureDraftRegistryEntry,
} from "@/lib/architecture/architecture-draft-registry";
import { architectureDraftSpawnedRunId } from "@/lib/architecture/architecture-draft-handoff-gate";
import { resolveArchitectureDraftCustomerStatus } from "@/lib/architecture/architecture-draft-status";
import type { DraftRequestResponse, DraftRequestSummary } from "@/types/draft-intake";

function mapDraftSummaryToDraftRequestResponse(summary: DraftRequestSummary): DraftRequestResponse {
  return {
    draftId: summary.draftId,
    tenantId: "",
    workspaceId: "",
    projectId: "",
    status: summary.status,
    document: {
      freeTextIntent: summary.freeTextIntent,
      systemName: summary.systemName ?? undefined,
      actorSet: { actors: [] },
    },
    spawnedRunId: summary.spawnedRunId ?? undefined,
    createdByUserId: summary.createdByUserId,
    createdUtc: summary.createdUtc,
    updatedUtc: summary.updatedUtc,
  };
}

/** Maps a server draft summary row into the shared registry entry shape used by hub and home surfaces. */
export function mapDraftSummaryToRegistryEntry(summary: DraftRequestSummary): ArchitectureDraftRegistryEntry {
<<<<<<< HEAD
  const draft = mapDraftSummaryToDraftRequestResponse(summary);
  const linkedReviewId = architectureDraftSpawnedRunId(draft);
=======
  const linkedReviewId = architectureDraftSpawnedRunId(summary);
>>>>>>> 0eb754082d (Fix CI failures: audit matrix duplicate, UI typecheck, OpenAPI snapshot)

  const customerStatus =
    summary.status === "Abandoned"
      ? "archived"
      : resolveArchitectureDraftCustomerStatus({
          linkedReviewId,
          reviewReadinessValid: summary.reviewReadinessValid,
        });

<<<<<<< HEAD
  return buildArchitectureDraftRegistryEntry(draft, {
    customerStatus,
    linkedReviewId,
    ownerLabel: "You",
  });
=======
  return buildArchitectureDraftRegistryEntry(
    {
      draftId: summary.draftId,
      status: summary.status,
      document: {
        freeTextIntent: summary.freeTextIntent,
        systemName: summary.systemName ?? undefined,
        actorSet: { actors: [] },
      },
      spawnedRunId: summary.spawnedRunId ?? undefined,
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
>>>>>>> 0eb754082d (Fix CI failures: audit matrix duplicate, UI typecheck, OpenAPI snapshot)
}

export function mapDraftSummariesToRegistryEntries(
  summaries: readonly DraftRequestSummary[],
): ArchitectureDraftRegistryEntry[] {
  return summaries.map(mapDraftSummaryToRegistryEntry);
}
