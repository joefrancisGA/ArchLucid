export const SIGN_IN_PATH = "/auth/signin" as const;

export const SIGN_IN_FLOW_STEP_PARAM = "step";

export const SIGN_IN_FLOW_STEP_OPTIONS = ["options", "email", "code", "sso"] as const;

export type SignInFlowStepUrlValue = (typeof SIGN_IN_FLOW_STEP_OPTIONS)[number];

const SIGN_IN_FLOW_STEP_IDS = new Set<string>(SIGN_IN_FLOW_STEP_OPTIONS);

export function parseSignInFlowStepFromSearch(raw: string | null | undefined): SignInFlowStepUrlValue | null {
  if (raw === null || raw === undefined) {
    return null;
  }

  const trimmed = raw.trim().toLowerCase();

  if (!SIGN_IN_FLOW_STEP_IDS.has(trimmed)) {
    return null;
  }

  return trimmed as SignInFlowStepUrlValue;
}

export function signInFlowStepHrefFromSearch(
  currentSearch: string,
  step: SignInFlowStepUrlValue | null,
  pathname: string = SIGN_IN_PATH,
): string {
  const params = new URLSearchParams(currentSearch);

  if (step === null || step === "options") {
    params.delete(SIGN_IN_FLOW_STEP_PARAM);
  } else {
    params.set(SIGN_IN_FLOW_STEP_PARAM, step);
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}
