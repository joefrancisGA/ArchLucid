import { apiGet } from "@/lib/api/http";
import { ApiRequestError } from "@/lib/api-request-error";
import { trackAdvisoryDraftInFlight } from "@/lib/operations/advisory-draft-in-flight";
import {
  type DraftArchitectureRequestInput,
  type DraftArchitectureRequestResponse,
} from "@/lib/api/architecture-request-draft-api";
import {
  acceptDraftArchitectureRequestAsync,
  parseDraftOperationGuid,
} from "@/lib/api/architecture-request-draft-async-api-accept";
import {
  pollAdvisoryDraftOperationUntilTerminal,
  type PollAdvisoryDraftOperationOptions,
} from "@/lib/api/architecture-request-draft-async-api-poll";
import { type OperationDetail, type OperationState } from "@/lib/operations/operation-state";

/** Fetches the structured-brief suggestion result after the operation succeeds. */
export async function getDraftArchitectureRequestAsyncResult(
  operationId: string,
): Promise<DraftArchitectureRequestResponse> {
  const guid = parseDraftOperationGuid(operationId);

  return apiGet<DraftArchitectureRequestResponse>(
    `/v1/architecture/request/draft/async/${encodeURIComponent(guid)}/result`,
  );
}

function buildDraftSuggestFailureMessage(operation: OperationDetail): string {
  if (operation.state === ("Canceled" as OperationState)) {
    return "Structured brief suggestion was canceled.";
  }

  return "Structured brief suggestion failed. Retry or try a shorter overview excerpt.";
}

/**
 * Polls an already-accepted Suggest from overview operation, then fetches the suggestion result.
 */
export async function resumeDraftArchitectureRequestWithPoll(
  operationId: string,
  options?: PollAdvisoryDraftOperationOptions,
): Promise<{
  readonly response: DraftArchitectureRequestResponse;
  readonly operation: OperationDetail;
}> {
  const terminalOperation = await pollAdvisoryDraftOperationUntilTerminal(operationId, options);

  if (terminalOperation.state !== "Succeeded") {
    throw new ApiRequestError(buildDraftSuggestFailureMessage(terminalOperation), {
      problem: null,
      correlationId: null,
      httpStatus: terminalOperation.state === "Failed" ? 400 : 409,
    });
  }

  const response = await getDraftArchitectureRequestAsyncResult(operationId);

  return { response, operation: terminalOperation };
}

/**
 * Tier C structured-brief suggest: accept immediately, poll with named stages, then fetch result.
 */
export async function draftArchitectureRequestWithPoll(
  input: DraftArchitectureRequestInput,
  options?: PollAdvisoryDraftOperationOptions,
): Promise<{
  readonly response: DraftArchitectureRequestResponse;
  readonly operation: OperationDetail;
}> {
  const operationId = await acceptDraftArchitectureRequestAsync(input);
  trackAdvisoryDraftInFlight({
    operationId,
    draftId: options?.draftId,
  });

  return resumeDraftArchitectureRequestWithPoll(operationId, options);
}
