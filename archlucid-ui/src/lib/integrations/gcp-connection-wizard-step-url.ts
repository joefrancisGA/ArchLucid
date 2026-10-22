import { CLOUD_CONNECTIONS_GCP_PATH } from "@/lib/cloud-connections-paths";
import { buildOperatorHrefFromSearch } from "@/lib/operator/operator-url-href-from-search";

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

  if (!/^\d+$/.test(trimmed)) {
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
  return buildOperatorHrefFromSearch(currentSearch, pathname, {
    selectionSwitch: { kind: "disclosure-only" },
    mutate: (params) => {

    if (stepIndex <= 0) {
      params.delete(GCP_CONNECTION_WIZARD_STEP_PARAM);
    } else {
      params.set(GCP_CONNECTION_WIZARD_STEP_PARAM, String(stepIndex));
    }
    },
  });
}
