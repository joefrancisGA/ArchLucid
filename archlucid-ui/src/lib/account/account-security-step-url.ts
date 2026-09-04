import { ACCOUNT_SECURITY_PATH } from "@/lib/account-route-paths";

export const ACCOUNT_SECURITY_STEP_PARAM = "secStep";
export const ACCOUNT_SECURITY_CHALLENGE_PARAM = "challengeId";

export const ACCOUNT_SECURITY_STEP_OPTIONS = ["methods", "add-email", "verify"] as const;

export type AccountSecurityStepUrlValue = (typeof ACCOUNT_SECURITY_STEP_OPTIONS)[number];

const ACCOUNT_SECURITY_STEP_IDS = new Set<string>(ACCOUNT_SECURITY_STEP_OPTIONS);

export type AccountSecurityStepUrlState = {
  readonly step: AccountSecurityStepUrlValue | null;
  readonly challengeId: string | null;
};

export function parseAccountSecurityStepFromSearch(raw: string | null | undefined): AccountSecurityStepUrlValue | null {
  if (raw === null || raw === undefined) {
    return null;
  }

  const trimmed = raw.trim().toLowerCase();

  if (!ACCOUNT_SECURITY_STEP_IDS.has(trimmed)) {
    return null;
  }

  return trimmed as AccountSecurityStepUrlValue;
}

export function parseAccountSecurityChallengeIdFromSearch(raw: string | null | undefined): string {
  if (raw === null || raw === undefined) {
    return "";
  }

  return raw.trim();
}

export function accountSecurityStepHrefFromSearch(
  currentSearch: string,
  state: AccountSecurityStepUrlState,
  pathname: string = ACCOUNT_SECURITY_PATH,
): string {
  const params = new URLSearchParams(currentSearch);
  const challengeId = (state.challengeId ?? "").trim();

  if (state.step === null || state.step === "methods") {
    params.delete(ACCOUNT_SECURITY_STEP_PARAM);
  } else {
    params.set(ACCOUNT_SECURITY_STEP_PARAM, state.step);
  }

  if (challengeId.length === 0) {
    params.delete(ACCOUNT_SECURITY_CHALLENGE_PARAM);
  } else {
    params.set(ACCOUNT_SECURITY_CHALLENGE_PARAM, challengeId);
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}
