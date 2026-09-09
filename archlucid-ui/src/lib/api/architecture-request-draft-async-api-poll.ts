import { getOperation } from "@/lib/api/operations-api";
import { ApiRequestError } from "@/lib/api-request-error";
import {
  advisoryDraftOperationMissingMessage,
  isAdvisoryDraftOperationMissingError,
} from "@/lib/operations/advisory-draft-operation-missing";
import {
  isTerminalOperationState,
  type OperationDetail,
} from "@/lib/operations/operation-state";

/** Poll cadence for advisory structured-brief suggest operations (Tier C). */
export const ADVISORY_DRAFT_OPERATION_POLL_INTERVAL_MS = 10_000;

export type PollAdvisoryDraftOperationOptions = {
  readonly signal?: AbortSignal;
  readonly onUpdate?: (operation: OperationDetail) => void;
  readonly pollIntervalMs?: number;
  /** Draft being edited — used to deep-link In progress rows back to this draft. */
  readonly draftId?: string;
};

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

/** Polls GET /v1/operations/{id} until the advisory draft operation reaches a terminal state. */
export async function pollAdvisoryDraftOperationUntilTerminal(
  operationId: string,
  options?: PollAdvisoryDraftOperationOptions,
): Promise<OperationDetail> {
  const pollIntervalMs = options?.pollIntervalMs ?? ADVISORY_DRAFT_OPERATION_POLL_INTERVAL_MS;

  while (true) {
    let operation: OperationDetail;

    try {
      operation = await getOperation(operationId);
    } catch (error: unknown) {
      if (isAdvisoryDraftOperationMissingError(error)) {
        throw new ApiRequestError(advisoryDraftOperationMissingMessage(), {
          problem: error instanceof ApiRequestError ? error.problem : null,
          correlationId: error instanceof ApiRequestError ? error.correlationId : null,
          httpStatus: 404,
        });
      }

      throw error;
    }

    options?.onUpdate?.(operation);

    if (isTerminalOperationState(operation.state)) {
      return operation;
    }

    await delay(pollIntervalMs, options?.signal);
  }
}
