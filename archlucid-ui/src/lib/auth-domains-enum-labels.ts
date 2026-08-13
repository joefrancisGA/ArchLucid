import type { EnterpriseStatusKind } from "@/lib/design-tokens";

/** Raw API verification status tokens — keep on `data-*` attributes, not visible copy. */
export const AUTH_DOMAIN_RAW_VERIFICATION_STATUS_TOKENS = [
  "Unverified",
  "VerificationPending",
  "Verified",
  "VerificationFailed",
  "Removed",
] as const;

/** Raw API enforcement mode tokens — keep on `data-*` attributes, not visible copy. */
export const AUTH_DOMAIN_RAW_ENFORCEMENT_MODE_TOKENS = [
  "SsoOptional",
  "SsoRequiredForVerifiedDomain",
  "SsoRequiredWithRecoveryException",
] as const;

export const AUTH_DOMAIN_RAW_ENUM_VISIBLE_BANNED = [
  ...AUTH_DOMAIN_RAW_VERIFICATION_STATUS_TOKENS,
  ...AUTH_DOMAIN_RAW_ENFORCEMENT_MODE_TOKENS,
] as const;

function normalizeEnumToken(value: string): string {
  return value.trim();
}

export function labelForAuthDomainVerificationStatus(status: string): string {
  const normalized = normalizeEnumToken(status);

  switch (normalized) {
    case "Unverified":
      return "Not verified";
    case "VerificationPending":
      return "Verification pending";
    case "Verified":
      return "Verified";
    case "VerificationFailed":
      return "Verification failed";
    case "Removed":
      return "Removed";
    default:
      return "Unknown verification status";
  }
}

export function helperForAuthDomainVerificationStatus(status: string): string | null {
  const normalized = normalizeEnumToken(status);

  switch (normalized) {
    case "Unverified":
      return "Add the DNS TXT record to prove domain ownership.";
    case "VerificationPending":
      return "Waiting for DNS propagation after you add the TXT record.";
    case "Verified":
      return "DNS ownership is confirmed for this domain.";
    case "VerificationFailed":
      return "DNS checks did not match the expected TXT record.";
    case "Removed":
      return "This domain row is no longer active.";
    default:
      return null;
  }
}

export function authDomainVerificationStatusKind(status: string): EnterpriseStatusKind {
  const normalized = normalizeEnumToken(status);

  switch (normalized) {
    case "Verified":
      return "ready";
    case "VerificationPending":
      return "in-progress";
    case "VerificationFailed":
      return "blocked";
    case "Unverified":
    case "Removed":
      return "neutral";
    default:
      return "needs-attention";
  }
}

export function labelForAuthDomainEnforcementMode(mode: string): string {
  const normalized = normalizeEnumToken(mode);

  switch (normalized) {
    case "SsoOptional":
      return "SSO optional";
    case "SsoRequiredForVerifiedDomain":
      return "SSO required";
    case "SsoRequiredWithRecoveryException":
      return "SSO required with recovery";
    default:
      return "Unknown enforcement mode";
  }
}

export function helperForAuthDomainEnforcementMode(mode: string): string | null {
  const normalized = normalizeEnumToken(mode);

  switch (normalized) {
    case "SsoOptional":
      return "Email one-time codes and SSO can both remain available.";
    case "SsoRequiredForVerifiedDomain":
      return "Verified users on this domain must sign in through your identity provider once enforcement is enabled.";
    case "SsoRequiredWithRecoveryException":
      return "SSO is required with audited email-code recovery for designated administrators.";
    default:
      return null;
  }
}

export function authDomainEnforcementModeKind(mode: string): EnterpriseStatusKind {
  const normalized = normalizeEnumToken(mode);

  switch (normalized) {
    case "SsoOptional":
      return "neutral";
    case "SsoRequiredForVerifiedDomain":
    case "SsoRequiredWithRecoveryException":
      return "needs-attention";
    default:
      return "needs-attention";
  }
}

export function successMessageForAuthDomainEnforcementModeChange(
  displayDomain: string,
  enforcementMode: string,
): string {
  return `Enforcement mode for ${displayDomain} set to ${labelForAuthDomainEnforcementMode(enforcementMode)}.`;
}

export function isRestrictiveAuthDomainEnforcementMode(enforcementMode: string): boolean {
  const normalized = normalizeEnumToken(enforcementMode);

  return (
    normalized === "SsoRequiredForVerifiedDomain" || normalized === "SsoRequiredWithRecoveryException"
  );
}
