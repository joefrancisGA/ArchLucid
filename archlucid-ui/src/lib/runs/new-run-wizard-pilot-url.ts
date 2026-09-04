const NEW_RUN_WIZARD_PILOT_PARAM = "pilot";
const NEW_RUN_WIZARD_ADVANCED_CONFIG_PARAM = "advancedConfig";

export function parseNewRunWizardPilotFromSearch(raw: string | null | undefined): boolean | null {
  if (raw === null || raw === undefined) {
    return null;
  }

  const trimmed = raw.trim().toLowerCase();

  if (trimmed === "1" || trimmed === "true") {
    return true;
  }

  if (trimmed === "0" || trimmed === "false") {
    return false;
  }

  return null;
}

export function parseNewRunWizardAdvancedConfigFromSearch(raw: string | null | undefined): boolean {
  if (raw === null || raw === undefined) {
    return false;
  }

  const trimmed = raw.trim().toLowerCase();

  return trimmed === "1" || trimmed === "true";
}

export function newRunWizardPilotHrefFromSearch(
  currentSearch: string,
  patch: {
    readonly focusedPilotModeEnabled?: boolean;
    readonly advancedConfigurationOptIn?: boolean;
  },
  pathname: string = "/architecture/reviews/new",
): string {
  const params = new URLSearchParams(currentSearch);

  if (patch.focusedPilotModeEnabled !== undefined) {
    if (patch.focusedPilotModeEnabled) {
      params.delete(NEW_RUN_WIZARD_PILOT_PARAM);
    } else {
      params.set(NEW_RUN_WIZARD_PILOT_PARAM, "0");
    }
  }

  if (patch.advancedConfigurationOptIn !== undefined) {
    if (!patch.advancedConfigurationOptIn) {
      params.delete(NEW_RUN_WIZARD_ADVANCED_CONFIG_PARAM);
    } else {
      params.set(NEW_RUN_WIZARD_ADVANCED_CONFIG_PARAM, "1");
    }
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}
