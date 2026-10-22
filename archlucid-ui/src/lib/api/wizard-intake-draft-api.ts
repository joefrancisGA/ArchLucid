import { formatExportSealedManifestAwareApiError } from "@/lib/api/export-sealed-manifest-conflict";
import { wizardIntakeDraftMutationBlockedReason } from "@/lib/architecture/wizard-intake-draft-mutation-blocked-reason";
import { toApiLoadFailure } from "@/lib/api-load-failure";
import { apiGet, apiPutJson } from "@/lib/api/http";

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
    return await apiGet<WizardIntakeDraftResponse>(
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
  try {
    return await apiPutJson<WizardIntakeDraftResponse>(
      `/v1/architecture/intake/wizard-draft/${encodeURIComponent(wizardId)}`,
      body,
    );
  } catch (error: unknown) {
    const failure = toApiLoadFailure(error);
    const blockedReason = wizardIntakeDraftMutationBlockedReason(failure);

    throw new Error(blockedReason ?? formatExportSealedManifestAwareApiError(failure));
  }
}
