import { isApiNotFoundFailure, toApiLoadFailure } from "@/lib/api-load-failure";
import { proxyJsonGet, proxyJsonPut } from "@/lib/proxy-json-client";
import type { SecureNowInvestigationEffortInputFields } from "@/lib/product-line/securenow-investigation-effort-input-storage";

const EFFORT_INPUTS_PATH = "/api/proxy/v1/operational-security/investigation-effort-inputs";

export type SecureNowInvestigationEffortInputsServerRecord = SecureNowInvestigationEffortInputFields & {
  readonly recordedUtc: string;
};

function mapInputs(raw: Record<string, unknown>): SecureNowInvestigationEffortInputsServerRecord {
  return {
    baselineHours: String(raw.baselineHours ?? ""),
    afterHours: String(raw.afterHours ?? ""),
    annualInvestigations: String(raw.annualInvestigations ?? ""),
    hourlyRate: String(raw.hourlyRate ?? ""),
    annualCost: String(raw.annualCost ?? ""),
    recordedUtc: String(raw.recordedUtc ?? ""),
  };
}

export async function fetchSecureNowInvestigationEffortInputs(): Promise<SecureNowInvestigationEffortInputFields | null> {
  try {
    const raw = await proxyJsonGet<Record<string, unknown>>(EFFORT_INPUTS_PATH);
    const mapped = mapInputs(raw);
    return {
      baselineHours: mapped.baselineHours,
      afterHours: mapped.afterHours,
      annualInvestigations: mapped.annualInvestigations,
      hourlyRate: mapped.hourlyRate,
      annualCost: mapped.annualCost,
    };
  } catch (error: unknown) {
    const failure = toApiLoadFailure(error);

    if (isApiNotFoundFailure(failure)) {
      return null;
    }

    throw error;
  }
}

export async function saveSecureNowInvestigationEffortInputs(
  fields: SecureNowInvestigationEffortInputFields,
): Promise<string | null> {
  const raw = await proxyJsonPut<Record<string, unknown>>(EFFORT_INPUTS_PATH, fields);

  if (raw.succeeded === true) {
    return null;
  }

  return raw.errorMessage != null ? String(raw.errorMessage) : "Investigation effort input save failed.";
}
