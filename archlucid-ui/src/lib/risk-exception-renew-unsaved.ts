import { defaultRiskExceptionExpiresAtUtc } from "@/lib/api/governance-stickiness-api";

/** True when an inline renew form has typed work that would be lost on navigation. */
export function riskExceptionRenewHasUnsavedEdits(
  renewingId: string | null,
  renewExpiresAtUtc: string,
  renewRationale: string,
  renewOpenedAtUtc: string,
): boolean {
  if (renewingId === null) {
    return false;
  }

  if (renewRationale.trim().length > 0) {
    return true;
  }

  return renewExpiresAtUtc !== renewOpenedAtUtc;
}

export function defaultRiskExceptionRenewOpenedExpiryUtc(): string {
  return defaultRiskExceptionExpiresAtUtc();
}
