import { apiGetJson, apiPutJson } from "@/lib/api/http";

export type WizardIntakeDraftResponse = {
  wizardId: string;
  stepIndex: number;
  stateJson: string;
  updatedUtc: string;
};

export type UpsertWizardIntakeDraftRequest = {
  stepIndex: number;
  stateJson: string;
  idempotencyKey?: string;
};

export async function fetchWizardIntakeDraft(
  wizardId: string,
): Promise<WizardIntakeDraftResponse | null> {
  try {
    return await apiGetJson<WizardIntakeDraftResponse>(
      `/v1/architecture/intake/wizard-draft/${encodeURIComponent(wizardId)}`,
    );
  } catch {
    return null;
  }
}

export async function upsertWizardIntakeDraft(
  wizardId: string,
  body: UpsertWizardIntakeDraftRequest,
): Promise<WizardIntakeDraftResponse> {
  return apiPutJson<WizardIntakeDraftResponse>(
    `/v1/architecture/intake/wizard-draft/${encodeURIComponent(wizardId)}`,
    body,
  );
}
