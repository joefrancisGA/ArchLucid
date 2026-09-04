export const TIER2_CONNECTION_WIZARD_STEP_PARAM = "step";

const TIER2_CONNECTION_WIZARD_MAX_STEP_INDEX = 3;

export function parseTier2ConnectionWizardStepFromSearch(raw: string | null | undefined): number | null {
  if (raw === null || raw === undefined) {
    return null;
  }

  const trimmed = raw.trim();

  if (trimmed.length === 0) {
    return null;
  }

  const parsed = Number.parseInt(trimmed, 10);

  if (!Number.isFinite(parsed) || parsed < 0 || parsed > TIER2_CONNECTION_WIZARD_MAX_STEP_INDEX) {
    return null;
  }

  return parsed;
}

export function tier2ConnectionWizardStepHrefFromSearch(
  currentSearch: string,
  stepIndex: number,
  pathname: string,
): string {
  const params = new URLSearchParams(currentSearch);

  if (stepIndex <= 0) {
    params.delete(TIER2_CONNECTION_WIZARD_STEP_PARAM);
  } else {
    params.set(TIER2_CONNECTION_WIZARD_STEP_PARAM, String(stepIndex));
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}
