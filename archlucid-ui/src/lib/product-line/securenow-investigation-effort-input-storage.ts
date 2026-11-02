import { readOperatorScopeFromStorage } from "@/lib/operator/operator-scope-storage";

export const SECURENOW_INVESTIGATION_EFFORT_INPUT_STORAGE_PREFIX =
  "securenow-investigation-effort-inputs:" as const;

export const SECURENOW_INVESTIGATION_EFFORT_INPUT_STORAGE_DISCIPLINE =
  "Stored in this browser for this workspace. Reloading restores your entries; they are not written to the pilot measurement log." as const;

export type SecureNowInvestigationEffortInputFields = {
  readonly baselineHours: string;
  readonly afterHours: string;
  readonly annualInvestigations: string;
  readonly hourlyRate: string;
  readonly annualCost: string;
};

function resolveStorageKey(): string | null {
  const scope = readOperatorScopeFromStorage();

  if (scope === null) {
    return null;
  }

  const tenantId = scope.tenantId?.trim() ?? "";
  const workspaceId = scope.workspaceId?.trim() ?? "";

  if (tenantId.length === 0 || workspaceId.length === 0) {
    return null;
  }

  return `${SECURENOW_INVESTIGATION_EFFORT_INPUT_STORAGE_PREFIX}${tenantId}:${workspaceId}`;
}

function parseStoredFields(raw: string): SecureNowInvestigationEffortInputFields | null {
  try {
    const parsed = JSON.parse(raw) as Partial<SecureNowInvestigationEffortInputFields>;

    return {
      baselineHours: typeof parsed.baselineHours === "string" ? parsed.baselineHours : "",
      afterHours: typeof parsed.afterHours === "string" ? parsed.afterHours : "",
      annualInvestigations: typeof parsed.annualInvestigations === "string" ? parsed.annualInvestigations : "",
      hourlyRate: typeof parsed.hourlyRate === "string" ? parsed.hourlyRate : "",
      annualCost: typeof parsed.annualCost === "string" ? parsed.annualCost : "",
    };
  } catch {
    return null;
  }
}

export function readSecureNowInvestigationEffortInputs(): SecureNowInvestigationEffortInputFields | null {
  if (typeof window === "undefined") {
    return null;
  }

  const key = resolveStorageKey();

  if (key === null) {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(key);

    if (raw === null || raw.trim().length === 0) {
      return null;
    }

    return parseStoredFields(raw);
  } catch {
    return null;
  }
}

export function persistSecureNowInvestigationEffortInputs(fields: SecureNowInvestigationEffortInputFields): void {
  if (typeof window === "undefined") {
    return;
  }

  const key = resolveStorageKey();

  if (key === null) {
    return;
  }

  try {
    window.localStorage.setItem(key, JSON.stringify(fields));
  } catch {
    /* localStorage may be unavailable */
  }
}

export function secureNowInvestigationEffortInputStorageKeyForScope(
  tenantId: string,
  workspaceId: string,
): string {
  return `${SECURENOW_INVESTIGATION_EFFORT_INPUT_STORAGE_PREFIX}${tenantId.trim()}:${workspaceId.trim()}`;
}
