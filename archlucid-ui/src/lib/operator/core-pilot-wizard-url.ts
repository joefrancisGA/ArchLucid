import { CORE_PILOT_WIZARD_STEP_COUNT } from "@/lib/core-pilot-wizard-state";

export const CORE_PILOT_WIZARD_OPEN_PARAM = "pilotWizard";
export const CORE_PILOT_WIZARD_STEP_PARAM = "pilotWizardStep";

export type CorePilotWizardUrlState = {
  readonly open: boolean;
  readonly stepIndex: number | null;
};

export function parseCorePilotWizardOpenFromSearch(raw: string | null | undefined): boolean {
  if (raw === null || raw === undefined) {
    return false;
  }

  const trimmed = raw.trim().toLowerCase();

  return trimmed === "1" || trimmed === "true";
}

export function parseCorePilotWizardStepFromSearch(raw: string | null | undefined): number | null {
  if (raw === null || raw === undefined) {
    return null;
  }

  const trimmed = raw.trim();

  if (trimmed.length === 0) {
    return null;
  }

  const parsed = Number.parseInt(trimmed, 10);

  if (!Number.isFinite(parsed) || parsed < 0 || parsed >= CORE_PILOT_WIZARD_STEP_COUNT) {
    return null;
  }

  return parsed;
}

export function corePilotWizardHrefFromSearch(
  currentSearch: string,
  state: CorePilotWizardUrlState,
  pathname: string,
): string {
  const params = new URLSearchParams(currentSearch);

  if (!state.open) {
    params.delete(CORE_PILOT_WIZARD_OPEN_PARAM);
    params.delete(CORE_PILOT_WIZARD_STEP_PARAM);
  } else {
    params.set(CORE_PILOT_WIZARD_OPEN_PARAM, "1");

    if (state.stepIndex === null || state.stepIndex <= 0) {
      params.delete(CORE_PILOT_WIZARD_STEP_PARAM);
    } else {
      params.set(CORE_PILOT_WIZARD_STEP_PARAM, String(state.stepIndex));
    }
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}
