import { NEW_RUN_WIZARD_PATH } from "@/lib/runs/quick-family-wizard-step-url";
import { buildOperatorHrefFromSearch } from "@/lib/operator/operator-url-href-from-search";

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
  return buildOperatorHrefFromSearch(currentSearch, pathname, {
    selectionSwitch: { kind: "disclosure-only" },
    mutate: (params) => {

    if (!open) {
      params.delete(WIZARD_PRESET_IMPORT_OPEN_PARAM);
    } else {
      params.set(WIZARD_PRESET_IMPORT_OPEN_PARAM, "1");
    }
    },
  });
}
