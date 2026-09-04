import { SETTINGS_AUTH_DOMAINS_PATH } from "@/lib/settings-admin-route-paths";

export const AUTH_DOMAIN_PARAM = "authDomain";
export const AUTH_CONFIRM_PARAM = "authConfirm";
export const AUTH_ENFORCEMENT_MODE_PARAM = "authEnforcementMode";
export const AUTH_OTP_RECOVERY_PARAM = "authOtpRecovery";
export const AUTH_RECOVERY_EMAIL_PARAM = "authRecoveryEmail";

export const AUTH_CONFIRM_KIND_OPTIONS = [
  "enable-enforcement",
  "set-enforcement-mode",
  "recovery-remove",
] as const;

export type AuthDomainsConfirmKind = (typeof AUTH_CONFIRM_KIND_OPTIONS)[number];

const AUTH_CONFIRM_KIND_IDS = new Set<string>(AUTH_CONFIRM_KIND_OPTIONS);

export type AuthDomainsSelectionConfirmUrlState = {
  readonly selectedDomain: string | null;
  readonly confirmKind: AuthDomainsConfirmKind | null;
  readonly enforcementMode: string | null;
  readonly allowEmailOtpRecovery: boolean;
  readonly recoveryAdminEmail: string | null;
};

export function parseAuthDomainFromSearch(raw: string | null | undefined): string {
  if (raw === null || raw === undefined) {
    return "";
  }

  return raw.trim();
}

export function parseAuthConfirmKindFromSearch(raw: string | null | undefined): AuthDomainsConfirmKind | null {
  if (raw === null || raw === undefined) {
    return null;
  }

  const trimmed = raw.trim().toLowerCase();

  if (!AUTH_CONFIRM_KIND_IDS.has(trimmed)) {
    return null;
  }

  return trimmed as AuthDomainsConfirmKind;
}

export function parseAuthEnforcementModeFromSearch(raw: string | null | undefined): string {
  if (raw === null || raw === undefined) {
    return "";
  }

  return raw.trim();
}

export function parseAuthOtpRecoveryFromSearch(raw: string | null | undefined): boolean {
  if (raw === null || raw === undefined) {
    return false;
  }

  const trimmed = raw.trim().toLowerCase();

  return trimmed === "1" || trimmed === "true";
}

export function parseAuthRecoveryEmailFromSearch(raw: string | null | undefined): string {
  if (raw === null || raw === undefined) {
    return "";
  }

  return raw.trim();
}

export function authDomainsSelectionConfirmHrefFromSearch(
  currentSearch: string,
  state: AuthDomainsSelectionConfirmUrlState,
  pathname: string = SETTINGS_AUTH_DOMAINS_PATH,
): string {
  const params = new URLSearchParams(currentSearch);
  const selectedDomain = (state.selectedDomain ?? "").trim();
  const enforcementMode = (state.enforcementMode ?? "").trim();
  const recoveryAdminEmail = (state.recoveryAdminEmail ?? "").trim();

  if (selectedDomain.length === 0) {
    params.delete(AUTH_DOMAIN_PARAM);
  } else {
    params.set(AUTH_DOMAIN_PARAM, selectedDomain);
  }

  if (state.confirmKind === null) {
    params.delete(AUTH_CONFIRM_PARAM);
    params.delete(AUTH_ENFORCEMENT_MODE_PARAM);
    params.delete(AUTH_OTP_RECOVERY_PARAM);
    params.delete(AUTH_RECOVERY_EMAIL_PARAM);
  } else {
    params.set(AUTH_CONFIRM_PARAM, state.confirmKind);

    if (state.confirmKind === "set-enforcement-mode" && enforcementMode.length > 0) {
      params.set(AUTH_ENFORCEMENT_MODE_PARAM, enforcementMode);

      if (state.allowEmailOtpRecovery) {
        params.set(AUTH_OTP_RECOVERY_PARAM, "1");
      } else {
        params.delete(AUTH_OTP_RECOVERY_PARAM);
      }
    } else {
      params.delete(AUTH_ENFORCEMENT_MODE_PARAM);
      params.delete(AUTH_OTP_RECOVERY_PARAM);
    }

    if (state.confirmKind === "recovery-remove" && recoveryAdminEmail.length > 0) {
      params.set(AUTH_RECOVERY_EMAIL_PARAM, recoveryAdminEmail);
    } else {
      params.delete(AUTH_RECOVERY_EMAIL_PARAM);
    }
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}
