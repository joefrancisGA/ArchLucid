import type {
  ActorSet,
  DraftRequestDocument,
  DraftRequestResponse,
  DraftRequestSummaryPage,
} from "@/types/draft-intake";

import { apiGet, apiPatchJson, apiPostJson } from "./http";

const DRAFT_BASE = "/v1/architecture/draft";

/** Default asserted actor so structural admission can pass without a separate actor UI step. */
export function buildDefaultActorSet(): ActorSet {
  return {
    actors: [
      {
        label: "Primary operator",
        kind: "Human",
        trustOrigin: "Internal",
        contract: "Sync",
        origin: "Asserted",
        confidence: 100,
      },
    ],
  };
}

export async function createDraftRequest(
  freeTextIntent: string,
  workflowIntent?: "create-architecture" | "start-review",
  priorRunId?: string | null,
): Promise<DraftRequestResponse> {
  const trimmedPriorRunId = priorRunId?.trim() ?? "";

  return apiPostJson<DraftRequestResponse>(DRAFT_BASE, {
    freeTextIntent: freeTextIntent.trim(),
    ...(workflowIntent !== undefined ? { workflowIntent } : {}),
    ...(trimmedPriorRunId.length > 0 ? { priorRunId: trimmedPriorRunId } : {}),
  });
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

  if (params?.page !== undefined) {
    search.set("page", String(params.page));
  }

  if (params?.pageSize !== undefined) {
    search.set("pageSize", String(params.pageSize));
  }

  const query = search.toString();
  const path = query.length > 0 ? `${DRAFT_BASE}?${query}` : DRAFT_BASE;

  return apiGet<DraftRequestSummaryPage>(path);
}

export async function getDraftRequest(
  draftId: string,
  options?: { readonly scopeHeaders?: Record<string, string> },
): Promise<DraftRequestResponse> {
  return apiGet<DraftRequestResponse>(`${DRAFT_BASE}/${encodeURIComponent(draftId)}`, options);
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
  },
): Promise<DraftRequestResponse> {
  return apiPatchJson<DraftRequestResponse>(`${DRAFT_BASE}/${encodeURIComponent(draftId)}`, body);
}
