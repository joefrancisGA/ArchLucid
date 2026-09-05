import { NEW_RUN_WIZARD_PATH } from "@/lib/runs/quick-family-wizard-step-url";

export const WIZARD_PRESET_IMPORT_OPEN_PARAM = "wizardImportOpen";

export function parseWizardPresetImportOpenFromSearch(raw: string | null | undefined): boolean {
  if (raw === null || raw === undefined) {
    return false;
  }

  const trimmed = raw.trim().toLowerCase();

  return trimmed === "1" || trimmed === "true";
}

export function wizardStepPresetImportHrefFromSearch(
  currentSearch: string,
  open: boolean,
  pathname: string = NEW_RUN_WIZARD_PATH,
): string {
  const params = new URLSearchParams(currentSearch);

  if (!open) {
    params.delete(WIZARD_PRESET_IMPORT_OPEN_PARAM);
  } else {
    params.set(WIZARD_PRESET_IMPORT_OPEN_PARAM, "1");
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}
