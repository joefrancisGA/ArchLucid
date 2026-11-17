import type {
  ActorSet,
  DraftRequestDocument,
  DraftRequestResponse,
  DraftRequestSummaryPage,
} from "@/types/draft-intake";

import { formatExportSealedManifestAwareApiError } from "@/lib/api/export-sealed-manifest-conflict";
import { architectureDraftListBlockedReason } from "@/lib/architecture/architecture-draft-list-blocked-reason";
import {
  architectureDraftBlockedReason,
  architectureDraftIntakeMutationBlockedReason,
} from "@/lib/architecture/architecture-draft-blocked-reason";
import { isApiRequestError } from "@/lib/api-request-error";
import { toApiLoadFailure } from "@/lib/api-load-failure";

import { buildMissingDraftActorsPlaceholderSet } from "@/lib/draft-intake/draft-intake-actor-honesty";

import { encodeRequiredPathSegment, trimRequiredText, trimTextFields } from "./api-boundary-normalization";
import { apiGet, apiPatchJson, apiPostJson } from "./http";
import { apiGetSealedManifestAware } from "./api-get-sealed-manifest-aware";

const DRAFT_BASE = "/v1/architecture/draft";

export type PriorPackageSemanticCountsResponse = {
  readonly actorCount: number;
  readonly assumptionCount: number;
  readonly decisionCount: number;
  readonly requirementCount: number;
};

export async function getPriorPackageSemanticCounts(
  priorRunId: string,
): Promise<PriorPackageSemanticCountsResponse | null> {
  const trimmed = priorRunId.trim();

  if (trimmed.length === 0) {
    return null;
  }

  try {
    return await apiGetSealedManifestAware<PriorPackageSemanticCountsResponse>(
      `${DRAFT_BASE}/prior-package-semantics?priorRunId=${encodeURIComponent(trimmed)}`,
    );
  } catch (error: unknown) {
    const failure = toApiLoadFailure(error);

    if (failure.httpStatus === 404) {
      return null;
    }

    throw new Error(formatExportSealedManifestAwareApiError(failure));
  }
}

/** Structural admission placeholder when intake omitted actors — not a confirmed operator name. */
export function buildDefaultActorSet(): ActorSet {
  return buildMissingDraftActorsPlaceholderSet();
}

export async function createDraftRequest(
  freeTextIntent: string,
  workflowIntent?: "create-architecture" | "start-review",
  priorRunId?: string | null,
  systemName?: string,
): Promise<DraftRequestResponse> {
  const trimmedPriorRunId = priorRunId?.trim() ?? "";
  const trimmedSystemName = systemName?.trim() ?? "";
  // The API rejects a blank intent, so stop here instead of posting one.
  const trimmedIntent = trimRequiredText(freeTextIntent, "freeTextIntent");

  try {
    return await apiPostJson<DraftRequestResponse>(DRAFT_BASE, {
      freeTextIntent: trimmedIntent,
      ...(workflowIntent !== undefined ? { workflowIntent } : {}),
      ...(trimmedPriorRunId.length > 0 ? { priorRunId: trimmedPriorRunId } : {}),
      ...(trimmedSystemName.length > 0 ? { systemName: trimmedSystemName } : {}),
    });
  } catch (error: unknown) {
    const failure = toApiLoadFailure(error);
    const blockedReason = architectureDraftIntakeMutationBlockedReason(failure);

    throw new Error(blockedReason ?? formatExportSealedManifestAwareApiError(failure));
  }
}

/** Adds a paging parameter only when it is a whole number of 1 or more; otherwise the API default applies. */
function setPositiveIntegerParam(search: URLSearchParams, name: string, value: number | undefined): void {
  if (value !== undefined && Number.isInteger(value) && value >= 1) {
    search.set(name, String(value));
  }
}

export async function listDraftRequests(params?: {
  readonly mine?: boolean;
  readonly status?: string;
  readonly page?: number;
  readonly pageSize?: number;
}): Promise<DraftRequestSummaryPage> {
  const search = new URLSearchParams();

  if (params?.mine !== undefined) {
    search.set("mine", String(params.mine));
  }

  if (params?.status !== undefined && params.status.trim().length > 0) {
    search.set("status", params.status.trim());
  }

  setPositiveIntegerParam(search, "page", params?.page);
  setPositiveIntegerParam(search, "pageSize", params?.pageSize);

  const query = search.toString();
  const path = query.length > 0 ? `${DRAFT_BASE}?${query}` : DRAFT_BASE;

  try {
    return await apiGet<DraftRequestSummaryPage>(path);
  } catch (error: unknown) {
    const failure = toApiLoadFailure(error);
    const blockedReason = architectureDraftListBlockedReason(failure);

    throw new Error(blockedReason ?? formatExportSealedManifestAwareApiError(failure));
  }
}

export async function getDraftRequest(
  draftId: string,
  options?: { readonly scopeHeaders?: Record<string, string> },
): Promise<DraftRequestResponse> {
  const encodedDraftId = encodeRequiredPathSegment(draftId, "draftId");

  try {
    return await apiGetSealedManifestAware<DraftRequestResponse>(
      `${DRAFT_BASE}/${encodedDraftId}`,
      options,
    );
  } catch (error: unknown) {
    const failure = toApiLoadFailure(error);
    const blockedReason = architectureDraftBlockedReason(failure);

    throw new Error(blockedReason ?? formatExportSealedManifestAwareApiError(failure));
  }
}

export async function patchDraftRequest(
  draftId: string,
  body: {
    freeTextIntent?: string;
    systemName?: string;
    businessOutcome?: string;
    actorSet?: ActorSet;
    focusedPilotModeEnabled?: boolean;
    workflowIntent?: "create-architecture" | "start-review";
    structuredBrief?: DraftRequestDocument["structuredBrief"];
    openQuestions?: string;
    expectedUpdatedUtc?: string;
    forceOverwrite?: boolean;
  },
): Promise<DraftRequestResponse> {
  const encodedDraftId = encodeRequiredPathSegment(draftId, "draftId");
  // Trimming keeps an empty string as "", because the API uses it to clear a field.
  const normalizedBody = trimTextFields(body, [
    "freeTextIntent",
    "systemName",
    "businessOutcome",
    "openQuestions",
    "expectedUpdatedUtc",
  ]);

  try {
    return await apiPatchJson<DraftRequestResponse>(`${DRAFT_BASE}/${encodedDraftId}`, normalizedBody);
  } catch (error: unknown) {
    if (isApiRequestError(error) && error.httpStatus === 409) {
      throw error;
    }

    const failure = toApiLoadFailure(error);
    const blockedReason = architectureDraftIntakeMutationBlockedReason(failure);

    throw new Error(blockedReason ?? formatExportSealedManifestAwareApiError(failure));
  }
}

export type ArchitectureDraftPatchBody = Parameters<typeof patchDraftRequest>[1];

/** PATCH an architecture draft with ADR 0088 CAS. Resolves the token from GET when the caller has none. */
export async function patchDraftRequestRequiringCas(
  draftId: string,
  body: Omit<ArchitectureDraftPatchBody, "expectedUpdatedUtc" | "forceOverwrite">,
  expectedUpdatedUtc?: string | null,
): Promise<DraftRequestResponse> {
  let token = expectedUpdatedUtc?.trim() ?? "";

  if (token.length === 0) {
    const current = await getDraftRequest(draftId);
    token = current.updatedUtc;
  }

  return patchDraftRequest(draftId, { ...body, expectedUpdatedUtc: token });
}
