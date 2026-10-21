import { operatorBooleanDisclosureHrefFromSearch } from "@/lib/operator/operator-url-href-from-search";
export const WIZARD_STEP_CONSTRAINTS_ADVANCED_OPEN_PARAM = "wizardStepConstraintsAdvancedOpen";

export function parseWizardStepConstraintsAdvancedOpenFromSearch(raw: string | null | undefined): boolean {
  if (raw === null || raw === undefined) {
    return false;
  }

  const trimmed = raw.trim().toLowerCase();

  return trimmed === "1" || trimmed === "true";
}

export function wizardStepConstraintsAdvancedDisclosureHrefFromSearch(
  currentSearch: string,
  open: boolean,
  pathname: string,
): string {
  return operatorBooleanDisclosureHrefFromSearch(currentSearch, open, pathname, WIZARD_STEP_CONSTRAINTS_ADVANCED_OPEN_PARAM);
}
