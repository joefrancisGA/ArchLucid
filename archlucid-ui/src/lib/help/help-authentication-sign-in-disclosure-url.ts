import { buildOperatorHrefFromSearch } from "@/lib/operator/operator-url-href-from-search";
export const HELP_AUTH_COMMON_ISSUES_OPEN_PARAM = "helpAuthCommonIssuesOpen";
export const HELP_AUTH_ACCOUNT_RECOVERY_OPEN_PARAM = "helpAuthAccountRecoveryOpen";
export const HELP_AUTH_ACCEPTING_INVITATION_OPEN_PARAM = "helpAuthAcceptingInvitationOpen";
export const HELP_AUTH_ENTERPRISE_SSO_OPEN_PARAM = "helpAuthEnterpriseSsoOpen";

export type HelpAuthenticationSignInDisclosureUrlState = {
  readonly commonIssuesOpen: boolean;
  readonly accountRecoveryOpen: boolean;
  readonly acceptingInvitationOpen: boolean;
  readonly enterpriseSsoOpen: boolean;
};

function parseBooleanOpenParam(raw: string | null | undefined): boolean {
  if (raw === null || raw === undefined) {
    return false;
  }

  const trimmed = raw.trim().toLowerCase();

  return trimmed === "1" || trimmed === "true";
}

export function parseHelpAuthCommonIssuesOpenFromSearch(raw: string | null | undefined): boolean {
  return parseBooleanOpenParam(raw);
}

export function parseHelpAuthAccountRecoveryOpenFromSearch(raw: string | null | undefined): boolean {
  return parseBooleanOpenParam(raw);
}

export function parseHelpAuthAcceptingInvitationOpenFromSearch(raw: string | null | undefined): boolean {
  return parseBooleanOpenParam(raw);
}

export function parseHelpAuthEnterpriseSsoOpenFromSearch(raw: string | null | undefined): boolean {
  return parseBooleanOpenParam(raw);
}

export function helpAuthenticationSignInDisclosureHrefFromSearch(
  currentSearch: string,
  state: HelpAuthenticationSignInDisclosureUrlState,
  pathname: string,
): string {
  return buildOperatorHrefFromSearch(currentSearch, pathname, {
    selectionSwitch: { kind: "disclosure-only" },
    mutate: (params) => {

    if (!state.commonIssuesOpen) {
      params.delete(HELP_AUTH_COMMON_ISSUES_OPEN_PARAM);
    } else {
      params.set(HELP_AUTH_COMMON_ISSUES_OPEN_PARAM, "1");
    }

    if (!state.accountRecoveryOpen) {
      params.delete(HELP_AUTH_ACCOUNT_RECOVERY_OPEN_PARAM);
    } else {
      params.set(HELP_AUTH_ACCOUNT_RECOVERY_OPEN_PARAM, "1");
    }

    if (!state.acceptingInvitationOpen) {
      params.delete(HELP_AUTH_ACCEPTING_INVITATION_OPEN_PARAM);
    } else {
      params.set(HELP_AUTH_ACCEPTING_INVITATION_OPEN_PARAM, "1");
    }

    if (!state.enterpriseSsoOpen) {
      params.delete(HELP_AUTH_ENTERPRISE_SSO_OPEN_PARAM);
    } else {
      params.set(HELP_AUTH_ENTERPRISE_SSO_OPEN_PARAM, "1");
    }
    },
  });
}
