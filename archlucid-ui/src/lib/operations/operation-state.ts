/** Unified operation lifecycle from GET /v1/operations/{id} (TB-2074 / TB-2077). */

export type OperationState =
  | "Pending"
  | "Running"
  | "Succeeded"
  | "Failed"
  | "Canceled"
  | "CancelRequested";

export type OperationResultRef = {
  readonly runId?: string | null;
  readonly jobId?: string | null;
  readonly downloadPath?: string | null;
};

export type OperationDetail = {
  readonly operationId: string;
  readonly state: OperationState;
  readonly stepLabel: string;
  readonly currentStep?: number | null;
  readonly totalSteps?: number | null;
  readonly heartbeatUtc: string;
  readonly resultRef?: OperationResultRef | null;
};

const TERMINAL_STATES: ReadonlySet<OperationState> = new Set([
  "Succeeded",
  "Failed",
  "Canceled",
]);

export function isTerminalOperationState(state: OperationState): boolean {
  return TERMINAL_STATES.has(state);
}

export function normalizeOperationState(raw: unknown): OperationState {
  if (typeof raw !== "string") {
    return "Pending";
  }

  switch (raw) {
    case "Pending":
    case "Running":
    case "Succeeded":
    case "Failed":
    case "Canceled":
    case "CancelRequested":
      return raw;
    default:
      return "Pending";
  }
}
