import { CLOUD_CONNECTIONS_GCP_PATH } from "@/lib/cloud-connections-paths";

export const GCP_CONNECTION_WIZARD_STEP_PARAM = "gcpStep";

const GCP_CONNECTION_WIZARD_MAX_STEP_INDEX = 1;

export function parseGcpConnectionWizardStepFromSearch(raw: string | null | undefined): number | null {
  if (raw === null || raw === undefined) {
    return null;
  }

  const trimmed = raw.trim();

  if (trimmed.length === 0) {
    return null;
  }

  const parsed = Number.parseInt(trimmed, 10);

  if (!Number.isFinite(parsed) || parsed < 0 || parsed > GCP_CONNECTION_WIZARD_MAX_STEP_INDEX) {
    return null;
  }

  return parsed;
}

export function gcpConnectionWizardStepHrefFromSearch(
  currentSearch: string,
  stepIndex: number,
  pathname: string = CLOUD_CONNECTIONS_GCP_PATH,
): string {
  const params = new URLSearchParams(currentSearch);

  if (stepIndex <= 0) {
    params.delete(GCP_CONNECTION_WIZARD_STEP_PARAM);
  } else {
    params.set(GCP_CONNECTION_WIZARD_STEP_PARAM, String(stepIndex));
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}
