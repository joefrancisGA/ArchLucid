import { readOperatorScopeFromStorage } from "@/lib/operator/operator-scope-storage";
import {
  parseSecureNowInvestigationEffortNonNegative,
  parseSecureNowInvestigationEffortPositive,
} from "@/lib/product-line/securenow-investigation-effort-missing-fields";

export const SECURENOW_INVESTIGATION_EFFORT_INPUT_STORAGE_PREFIX =
  "securenow-investigation-effort-inputs:" as const;

export const SECURENOW_INVESTIGATION_EFFORT_INPUT_STORAGE_DISCIPLINE =
  "Tenant audit stores operator inputs for this project. This browser copy is a cache. Fixture worksheet values are not stored. They are not written to the pilot measurement log. This is not a customer result." as const;

export const SECURENOW_INVESTIGATION_EFFORT_FIXTURE_BASELINE_HOURS = 3;
export const SECURENOW_INVESTIGATION_EFFORT_FIXTURE_AFTER_HOURS = 2;
export const SECURENOW_INVESTIGATION_EFFORT_FIXTURE_ANNUAL_INVESTIGATIONS = 20;
export const SECURENOW_INVESTIGATION_EFFORT_FIXTURE_HOURLY_RATE = 100;
export const SECURENOW_INVESTIGATION_EFFORT_FIXTURE_ANNUAL_COST = 10000;

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
  const projectId = scope.projectId?.trim() ?? "";

  if (tenantId.length === 0 || workspaceId.length === 0 || projectId.length === 0) {
    return null;
  }

  return secureNowInvestigationEffortInputStorageKeyForScope(tenantId, workspaceId, projectId);
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
  projectId: string,
): string {
  return `${SECURENOW_INVESTIGATION_EFFORT_INPUT_STORAGE_PREFIX}${tenantId.trim()}:${workspaceId.trim()}:${projectId.trim()}`;
}

export function isSecureNowInvestigationEffortFixtureWorksheet(
  fields: SecureNowInvestigationEffortInputFields,
): boolean {
  return parseSecureNowInvestigationEffortPositive(fields.baselineHours) === SECURENOW_INVESTIGATION_EFFORT_FIXTURE_BASELINE_HOURS
    && parseSecureNowInvestigationEffortPositive(fields.afterHours) === SECURENOW_INVESTIGATION_EFFORT_FIXTURE_AFTER_HOURS
    && parseSecureNowInvestigationEffortPositive(fields.annualInvestigations) === SECURENOW_INVESTIGATION_EFFORT_FIXTURE_ANNUAL_INVESTIGATIONS
    && parseSecureNowInvestigationEffortPositive(fields.hourlyRate) === SECURENOW_INVESTIGATION_EFFORT_FIXTURE_HOURLY_RATE
    && parseSecureNowInvestigationEffortPositive(fields.annualCost) === SECURENOW_INVESTIGATION_EFFORT_FIXTURE_ANNUAL_COST;
}

/** Complete operator inputs eligible for both the ROI preview and audit autosave. */
export function isSecureNowInvestigationEffortAuditCandidate(
  fields: SecureNowInvestigationEffortInputFields,
): boolean {
  const baseline = parseSecureNowInvestigationEffortNonNegative(fields.baselineHours);
  const after = parseSecureNowInvestigationEffortNonNegative(fields.afterHours);

  return baseline !== null
    && after !== null
    && after <= baseline
    && parseSecureNowInvestigationEffortPositive(fields.annualInvestigations) !== null
    && parseSecureNowInvestigationEffortPositive(fields.hourlyRate) !== null
    && parseSecureNowInvestigationEffortPositive(fields.annualCost) !== null
    && !isSecureNowInvestigationEffortFixtureWorksheet(fields);
}
