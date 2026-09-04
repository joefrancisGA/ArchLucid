export const PILOT_ROI_WIZARD_OPEN_PARAM = "roiWizard";
export const PILOT_ROI_WIZARD_STEP_PARAM = "roiStep";

export const PILOT_ROI_WIZARD_STEP_COUNT = 2;

export type PilotRoiBaselineWizardUrlState = {
  readonly open: boolean;
  readonly stepIndex: number | null;
};

export function parsePilotRoiWizardOpenFromSearch(raw: string | null | undefined): boolean {
  if (raw === null || raw === undefined) {
    return false;
  }

  const trimmed = raw.trim().toLowerCase();

  return trimmed === "1" || trimmed === "true";
}

export function parsePilotRoiWizardStepFromSearch(raw: string | null | undefined): number | null {
  if (raw === null || raw === undefined) {
    return null;
  }

  const trimmed = raw.trim();

  if (trimmed.length === 0) {
    return null;
  }

  const parsed = Number.parseInt(trimmed, 10);

  if (!Number.isFinite(parsed) || parsed < 0 || parsed >= PILOT_ROI_WIZARD_STEP_COUNT) {
    return null;
  }

  return parsed;
}

export function pilotRoiBaselineWizardHrefFromSearch(
  currentSearch: string,
  state: PilotRoiBaselineWizardUrlState,
  pathname: string,
): string {
  const params = new URLSearchParams(currentSearch);

  if (!state.open) {
    params.delete(PILOT_ROI_WIZARD_OPEN_PARAM);
    params.delete(PILOT_ROI_WIZARD_STEP_PARAM);
  } else {
    params.set(PILOT_ROI_WIZARD_OPEN_PARAM, "1");

    if (state.stepIndex === null || state.stepIndex <= 0) {
      params.delete(PILOT_ROI_WIZARD_STEP_PARAM);
    } else {
      params.set(PILOT_ROI_WIZARD_STEP_PARAM, String(state.stepIndex));
    }
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}
