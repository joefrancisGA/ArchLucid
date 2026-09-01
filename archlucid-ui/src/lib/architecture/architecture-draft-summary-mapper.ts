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
  const draft = mapDraftSummaryToDraftRequestResponse(summary);
  const linkedReviewId = architectureDraftSpawnedRunId(draft);

  const fieldBasedStatus =
    summary.status === "Abandoned"
      ? "archived"
      : resolveArchitectureDraftCustomerStatus({
          linkedReviewId,
          reviewReadinessValid: summary.reviewReadinessValid,
        });

  const customerStatus =
    fieldBasedStatus === "draft" && (summary.status === "Admitted" || summary.status === "Submitted")
      ? "ready-for-review"
      : fieldBasedStatus;

  const entry = buildArchitectureDraftRegistryEntry(draft, {
    customerStatus,
    linkedReviewId,
    ownerLabel: "You",
  });

  return { ...entry, customerStatus };
}

export function mapDraftSummariesToRegistryEntries(
  summaries: readonly DraftRequestSummary[],
): ArchitectureDraftRegistryEntry[] {
  return summaries.map(mapDraftSummaryToRegistryEntry);
}
