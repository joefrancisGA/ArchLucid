export const WIZARD_STEP_DESCRIPTION_ADVANCED_OPEN_PARAM = "wizardStepDescriptionAdvancedOpen";

export function parseWizardStepDescriptionAdvancedOpenFromSearch(raw: string | null | undefined): boolean {
  if (raw === null || raw === undefined) {
    return false;
  }

  const trimmed = raw.trim().toLowerCase();

  return trimmed === "1" || trimmed === "true";
}

export function wizardStepDescriptionAdvancedDisclosureHrefFromSearch(
  currentSearch: string,
  open: boolean,
  pathname: string,
): string {
  const params = new URLSearchParams(currentSearch);

  if (!open) {
    params.delete(WIZARD_STEP_DESCRIPTION_ADVANCED_OPEN_PARAM);
  } else {
    params.set(WIZARD_STEP_DESCRIPTION_ADVANCED_OPEN_PARAM, "1");
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}
