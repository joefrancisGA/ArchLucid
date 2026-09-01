import {
  buildArchitectureDraftRegistryEntry,
  type ArchitectureDraftRegistryEntry,
} from "@/lib/architecture/architecture-draft-registry";
import { architectureDraftSpawnedRunId } from "@/lib/architecture/architecture-draft-handoff-gate";
import {
  resolveArchitectureDraftCustomerStatus,
  type ArchitectureDraftCustomerStatus,
} from "@/lib/architecture/architecture-draft-status";
import type { DraftRequestResponse, DraftRequestSummary } from "@/types/draft-intake";

/** Maps a server draft summary row into the shared registry entry shape used by hub and home surfaces. */
export function mapDraftSummaryToRegistryEntry(summary: DraftRequestSummary): ArchitectureDraftRegistryEntry {
  const draftForSpawnedRun: DraftRequestResponse = {
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

  const linkedReviewId = architectureDraftSpawnedRunId(draftForSpawnedRun);

  const fieldBasedStatus = resolveArchitectureDraftCustomerStatus({
    linkedReviewId,
    reviewReadinessValid: summary.reviewReadinessValid,
    registryStatus: summary.status === "Abandoned" ? "archived" : null,
  });

  // Mirror deriveRegistryCustomerStatus: admitted/submitted drafts are review-ready
  // even when the summary-derived readiness fields say otherwise.
  const customerStatus: ArchitectureDraftCustomerStatus =
    fieldBasedStatus === "draft" && (summary.status === "Admitted" || summary.status === "Submitted")
      ? "ready-for-review"
      : fieldBasedStatus;

  const entry = buildArchitectureDraftRegistryEntry(
    draftForSpawnedRun,
    {
      customerStatus,
      linkedReviewId,
      ownerLabel: "You",
    },
  );

  // The partial summary document cannot reproduce server readiness, so the
  // summary-derived status wins over the document-derived one.
  return { ...entry, customerStatus };
}

export function mapDraftSummariesToRegistryEntries(
  summaries: readonly DraftRequestSummary[],
): ArchitectureDraftRegistryEntry[] {
  return summaries.map(mapDraftSummaryToRegistryEntry);
}
