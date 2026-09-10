import { formatExportSealedManifestAwareApiError } from "@/lib/api/export-sealed-manifest-conflict";
import { architectureRequestDraftMutationBlockedReason } from "@/lib/architecture/architecture-request-draft-mutation-blocked-reason";
import { toApiLoadFailure } from "@/lib/api-load-failure";

import { apiPostJson } from "./http";

/** Matches API minimum for POST /v1/architecture/request/draft. */
export const ARCHITECTURE_REQUEST_DRAFT_MIN_DESCRIPTION_CHARS = 20;

/** Body for POST /v1/architecture/request/draft. */
export type DraftArchitectureRequestInput = {
  freeTextDescription: string;
  /** Constraints already on the draft — avoids semantic duplicates in new suggestions. */
  currentConstraints?: readonly string[];
  /** Assumptions already on the draft — avoids semantic duplicates in new suggestions. */
  currentAssumptions?: readonly string[];
  /** Confirmed assumptions — checked against overview evidence for contradictions. */
  confirmedAssumptions?: readonly string[];
};

export type EvidenceContradictedBriefAssumption = {
  assumption: string;
  evidenceNote: string;
};

/** Parsed intake suggestions from the architecture request draft endpoint. */
export type DraftArchitectureRequestResponse = {
  suggestedConstraints: string[];
  suggestedCapabilities: string[];
  suggestedAssumptions: string[];
  topologyHints: string[];
  securityBaselineHints: string[];
  suggestedFailureModeNote?: string | null;
  evidenceContradictedAssumptions?: EvidenceContradictedBriefAssumption[];
};

/** Calls POST /v1/architecture/request/draft to suggest wizard chip fields from a free-text brief. */
export async function draftArchitectureRequest(
  input: DraftArchitectureRequestInput,
): Promise<DraftArchitectureRequestResponse> {
  try {
    return await apiPostJson<DraftArchitectureRequestResponse>("/v1/architecture/request/draft", {
      freeTextDescription: input.freeTextDescription,
      currentConstraints: input.currentConstraints ?? [],
      currentAssumptions: input.currentAssumptions ?? [],
      confirmedAssumptions: input.confirmedAssumptions ?? [],
    });
  } catch (error: unknown) {
    const failure = toApiLoadFailure(error);
    const blockedReason = architectureRequestDraftMutationBlockedReason(failure);

    throw new Error(blockedReason ?? formatExportSealedManifestAwareApiError(failure));
  }
}
