export type WizardCreateResponse = {
  run?: {
    runId?: string;
  };
};

export type WizardOperationResponse = {
  state?: string;
  stepLabel?: string;
  resultRef?: {
    runId?: string;
  };
};

export type WizardCreateOperationPoll = "ready" | "failed" | "wait";

/**
 * Async create leaves LegacyRunStatus=Created after coordination, so GET /v1/operations/run:{id}
 * stays Pending with stepLabel "Creating review". Waiting only for Succeeded times out TB-927
 * after the review already exists.
 */
const CREATE_COORDINATION_READY_STEP_LABELS = new Set([
  "creating review",
  "agents queued",
  "committed",
  "execute complete",
]);

export function interpretWizardCreateOperation(
  operation: WizardOperationResponse,
): WizardCreateOperationPoll {
  const state = String(operation.state ?? "")
    .trim()
    .toLowerCase();

  if (state === "failed" || state === "canceled") {
    return "failed";
  }

  if (state === "succeeded") {
    return "ready";
  }

  const runId = operation.resultRef?.runId?.trim() ?? "";
  const stepLabel = (operation.stepLabel ?? "").trim().toLowerCase();

  if (runId.length > 0 && CREATE_COORDINATION_READY_STEP_LABELS.has(stepLabel)) {
    return "ready";
  }

  return "wait";
}

export function parseWizardCreateResponse(
  responseBody: string,
  status: number,
  contentType: string | undefined,
): WizardCreateResponse {
  try {
    return JSON.parse(responseBody) as WizardCreateResponse;
  } catch (error: unknown) {
    throw new Error(
      `[wizard-create-response] Create response was not valid JSON. ` +
        `Status: ${status}. Content type: ${contentType ?? "missing"}. ` +
        `Body: ${responseBody.slice(0, 400) || "<empty>"}.`,
      { cause: error },
    );
  }
}

export function parseWizardOperationResponse(
  responseBody: string,
  status: number,
  operationUrl: string,
  contentType: string | undefined,
): WizardOperationResponse {
  try {
    return JSON.parse(responseBody) as WizardOperationResponse;
  } catch (error: unknown) {
    throw new Error(
      `[wizard-create-response] Operation response was not valid JSON. ` +
        `Status: ${status}. URL: ${operationUrl}. ` +
        `Content type: ${contentType ?? "missing"}. ` +
        `Body: ${responseBody.slice(0, 400) || "<empty>"}.`,
      { cause: error },
    );
  }
}
