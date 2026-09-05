export const ARCHITECTURE_REQUEST_WIZARD_HELP_OPEN_PARAM = "wizardHelpOpen";

export function parseArchitectureRequestWizardHelpOpenFromSearch(raw: string | null | undefined): boolean {
  if (raw === null || raw === undefined) {
    return false;
  }

  const trimmed = raw.trim().toLowerCase();

  return trimmed === "1" || trimmed === "true";
}

export function architectureRequestWizardHelpDrawerHrefFromSearch(
  currentSearch: string,
  open: boolean,
  pathname: string,
): string {
  const params = new URLSearchParams(currentSearch);

  if (!open) {
    params.delete(ARCHITECTURE_REQUEST_WIZARD_HELP_OPEN_PARAM);
  } else {
    params.set(ARCHITECTURE_REQUEST_WIZARD_HELP_OPEN_PARAM, "1");
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}
