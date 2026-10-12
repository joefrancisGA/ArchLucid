export type WizardCreateResponse = {
  run?: {
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
