import { apiPostJson } from "./http";

/** Matches API minimum for POST /v1/architecture/request/draft. */
export const ARCHITECTURE_REQUEST_DRAFT_MIN_DESCRIPTION_CHARS = 20;

/** Body for POST /v1/architecture/request/draft. */
export type DraftArchitectureRequestInput = {
  freeTextDescription: string;
};

/** Parsed intake suggestions from the architecture request draft endpoint. */
export type DraftArchitectureRequestResponse = {
  suggestedConstraints: string[];
  suggestedCapabilities: string[];
  suggestedAssumptions: string[];
  topologyHints: string[];
  securityBaselineHints: string[];
};

/** Calls POST /v1/architecture/request/draft to suggest wizard chip fields from a free-text brief. */
export async function draftArchitectureRequest(
  input: DraftArchitectureRequestInput,
): Promise<DraftArchitectureRequestResponse> {
  return apiPostJson<DraftArchitectureRequestResponse>("/v1/architecture/request/draft", {
    freeTextDescription: input.freeTextDescription,
  });
}
