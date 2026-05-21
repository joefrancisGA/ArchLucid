import { apiPostJson } from "./http";

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
