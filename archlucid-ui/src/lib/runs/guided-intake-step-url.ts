const GUIDED_INTAKE_STEP_PARAM = "intakeStep";

const GUIDED_INTAKE_MAX_STEP_INDEX = 2;

export function parseGuidedIntakeStepFromSearch(raw: string | null | undefined): number | null {
  if (raw === null || raw === undefined) {
    return null;
  }

  const trimmed = raw.trim();

  if (trimmed.length === 0) {
    return null;
  }

  const parsed = Number.parseInt(trimmed, 10);

  if (!Number.isFinite(parsed) || parsed < 0 || parsed > GUIDED_INTAKE_MAX_STEP_INDEX) {
    return null;
  }

  return parsed;
}

export function guidedIntakeStepHrefFromSearch(
  currentSearch: string,
  stepIndex: number,
  pathname: string = "/architecture/reviews/new",
): string {
  const params = new URLSearchParams(currentSearch);

  if (stepIndex <= 0) {
    params.delete(GUIDED_INTAKE_STEP_PARAM);
  } else {
    params.set(GUIDED_INTAKE_STEP_PARAM, String(stepIndex));
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}
