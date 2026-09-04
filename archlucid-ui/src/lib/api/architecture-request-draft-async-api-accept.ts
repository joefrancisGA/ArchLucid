import { apiPostAcceptedWithLocation } from "@/lib/api/http";
import { parseOperationIdFromLocation } from "@/lib/operations/operation-location";
import {
  type DraftArchitectureRequestInput,
} from "@/lib/api/architecture-request-draft-api";

function buildDraftRequestBody(input: DraftArchitectureRequestInput): Record<string, unknown> {
  return {
    freeTextDescription: input.freeTextDescription,
    currentConstraints: input.currentConstraints ?? [],
    currentAssumptions: input.currentAssumptions ?? [],
    confirmedAssumptions: input.confirmedAssumptions ?? [],
  };
}

function parseDraftOperationGuid(operationId: string): string {
  const trimmed = operationId.trim();

  if (!trimmed.startsWith("draft:")) {
    throw new Error("Expected a draft: operation id.");
  }

  const guid = trimmed.slice("draft:".length).trim();

  if (guid.length === 0) {
    throw new Error("Draft operation id is missing a guid payload.");
  }

  return guid;
}

/** Accepts async structured-brief suggest work and returns the opaque operation id. */
export async function acceptDraftArchitectureRequestAsync(
  input: DraftArchitectureRequestInput,
): Promise<string> {
  const accepted = await apiPostAcceptedWithLocation(
    "/v1/architecture/request/draft/async",
    buildDraftRequestBody(input),
  );
  const operationId = parseOperationIdFromLocation(accepted.location);

  if (operationId === null) {
    throw new Error("Draft suggest accepted but no operation id was returned.");
  }

  return operationId;
}

export { parseDraftOperationGuid };
