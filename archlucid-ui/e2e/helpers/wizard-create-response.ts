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
