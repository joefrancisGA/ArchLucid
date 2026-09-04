import { CLOUD_CONNECTIONS_AWS_PATH } from "@/lib/cloud-connections-paths";

export const AWS_CONNECTION_WIZARD_STEP_PARAM = "awsStep";

const AWS_CONNECTION_WIZARD_MAX_STEP_INDEX = 1;

export function parseAwsConnectionWizardStepFromSearch(raw: string | null | undefined): number | null {
  if (raw === null || raw === undefined) {
    return null;
  }

  const trimmed = raw.trim();

  if (trimmed.length === 0) {
    return null;
  }

  const parsed = Number.parseInt(trimmed, 10);

  if (!Number.isFinite(parsed) || parsed < 0 || parsed > AWS_CONNECTION_WIZARD_MAX_STEP_INDEX) {
    return null;
  }

  return parsed;
}

export function awsConnectionWizardStepHrefFromSearch(
  currentSearch: string,
  stepIndex: number,
  pathname: string = CLOUD_CONNECTIONS_AWS_PATH,
): string {
  const params = new URLSearchParams(currentSearch);

  if (stepIndex <= 0) {
    params.delete(AWS_CONNECTION_WIZARD_STEP_PARAM);
  } else {
    params.set(AWS_CONNECTION_WIZARD_STEP_PARAM, String(stepIndex));
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}
