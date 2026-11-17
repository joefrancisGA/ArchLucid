import { formatExportSealedManifestAwareApiError } from "@/lib/api/export-sealed-manifest-conflict";
import { wizardIntakeDraftMutationBlockedReason } from "@/lib/architecture/wizard-intake-draft-mutation-blocked-reason";
import { isApiNotFoundFailure, toApiLoadFailure } from "@/lib/api-load-failure";
import { apiGet, apiPutJson } from "@/lib/api/http";
import {
  encodeRequiredPathSegment,
  nonNegativeFiniteOrNull,
  trimOptionalText,
} from "./api-boundary-normalization";

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
      `/v1/architecture/intake/wizard-draft/${encodeRequiredPathSegment(wizardId, "wizardId")}`,
    );
  } catch (error: unknown) {
    if (isApiNotFoundFailure(toApiLoadFailure(error))) {
      return null;
    }

    throw error;
  }
}

export async function upsertWizardIntakeDraft(
  wizardId: string,
  body: UpsertWizardIntakeDraftRequest,
): Promise<WizardIntakeDraftResponse> {
  const stepIndex = nonNegativeFiniteOrNull(body.stepIndex);

  if (stepIndex === null) {
    throw new Error("stepIndex must be a non-negative number.");
  }

  const request = {
    stepIndex,
    stateJson: body.stateJson,
    ...(trimOptionalText(body.idempotencyKey) !== undefined
      ? { idempotencyKey: trimOptionalText(body.idempotencyKey) }
      : {}),
  };

  try {
    return await apiPutJson<WizardIntakeDraftResponse>(
      `/v1/architecture/intake/wizard-draft/${encodeRequiredPathSegment(wizardId, "wizardId")}`,
      request,
    );
  } catch (error: unknown) {
    const failure = toApiLoadFailure(error);
    const blockedReason = wizardIntakeDraftMutationBlockedReason(failure);

    throw new Error(blockedReason ?? formatExportSealedManifestAwareApiError(failure));
  }
}
