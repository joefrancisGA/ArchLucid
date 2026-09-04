export const NEW_RUN_WIZARD_PATH = "/architecture/reviews/new" as const;

export const QUICK_FAMILY_WIZARD_STEP_PARAM = "qsStep";

export function parseQuickFamilyWizardStepFromSearch(raw: string | null | undefined): number | null {
  if (raw === null || raw === undefined) {
    return null;
  }

  const trimmed = raw.trim();

  if (trimmed.length === 0) {
    return null;
  }

  const parsed = Number.parseInt(trimmed, 10);

  if (!Number.isFinite(parsed) || parsed < 0) {
    return null;
  }

  return parsed;
}

export function quickFamilyWizardStepHrefFromSearch(
  currentSearch: string,
  stepIndex: number,
  pathname: string = NEW_RUN_WIZARD_PATH,
): string {
  const params = new URLSearchParams(currentSearch);

  if (stepIndex <= 0) {
    params.delete(QUICK_FAMILY_WIZARD_STEP_PARAM);
  } else {
    params.set(QUICK_FAMILY_WIZARD_STEP_PARAM, String(stepIndex));
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}
