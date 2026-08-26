import { apiGet, apiPostAcceptedWithLocation } from "@/lib/api/http";
import { getOperation } from "@/lib/api/operations-api";
import { ApiRequestError } from "@/lib/api-request-error";
import { trackAdvisoryDraftInFlight } from "@/lib/operations/advisory-draft-in-flight";
import { parseOperationIdFromLocation } from "@/lib/operations/operation-location";
import {
  isTerminalOperationState,
  type OperationDetail,
  type OperationState,
} from "@/lib/operations/operation-state";
import {
  type DraftArchitectureRequestInput,
  type DraftArchitectureRequestResponse,
} from "@/lib/api/architecture-request-draft-api";

/** Poll cadence for advisory structured-brief suggest operations (Tier C). */
export const ADVISORY_DRAFT_OPERATION_POLL_INTERVAL_MS = 10_000;

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

/** Fetches the structured-brief suggestion result after the operation succeeds. */
export async function getDraftArchitectureRequestAsyncResult(
  operationId: string,
): Promise<DraftArchitectureRequestResponse> {
  const guid = parseDraftOperationGuid(operationId);

  return apiGet<DraftArchitectureRequestResponse>(
    `/v1/architecture/request/draft/async/${encodeURIComponent(guid)}/result`,
  );
}

function delay(ms: number, signal?: AbortSignal): Promise<void> {
  if (signal?.aborted === true) {
    return Promise.reject(new DOMException("Aborted", "AbortError"));
  }

  return new Promise((resolve, reject) => {
    const timer = window.setTimeout(() => {
      signal?.removeEventListener("abort", onAbort);
      resolve();
    }, ms);

    function onAbort(): void {
      window.clearTimeout(timer);
      reject(new DOMException("Aborted", "AbortError"));
    }

    signal?.addEventListener("abort", onAbort, { once: true });
  });
}

export type PollAdvisoryDraftOperationOptions = {
  readonly signal?: AbortSignal;
  readonly onUpdate?: (operation: OperationDetail) => void;
  readonly pollIntervalMs?: number;
  /** Draft being edited — used to deep-link In progress rows back to this architecture. */
  readonly architectureId?: string;
};

/** Polls GET /v1/operations/{id} until the advisory draft operation reaches a terminal state. */
export async function pollAdvisoryDraftOperationUntilTerminal(
  operationId: string,
  options?: PollAdvisoryDraftOperationOptions,
): Promise<OperationDetail> {
  const pollIntervalMs = options?.pollIntervalMs ?? ADVISORY_DRAFT_OPERATION_POLL_INTERVAL_MS;

  while (true) {
    const operation = await getOperation(operationId);
    options?.onUpdate?.(operation);

    if (isTerminalOperationState(operation.state)) {
      return operation;
    }

    await delay(pollIntervalMs, options?.signal);
  }
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
    architectureId: options?.architectureId,
  });

  return resumeDraftArchitectureRequestWithPoll(operationId, options);
}
