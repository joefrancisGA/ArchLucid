import { buildOperatorHrefFromSearch } from "@/lib/operator/operator-url-href-from-search";
const NEW_RUN_WIZARD_MODE_PARAM = "mode";

export type NewRunWizardModeId = "quick" | "full";

export function parseNewRunWizardModeFromSearch(raw: string | null | undefined): NewRunWizardModeId | null {
  if (raw === null || raw === undefined) {
    return null;
  }

  const trimmed = raw.trim().toLowerCase();

  if (trimmed === "quick" || trimmed === "full") {
    return trimmed;
  }

  return null;
}

export function newRunWizardModeHrefFromSearch(
  currentSearch: string,
  mode: NewRunWizardModeId,
  pathname: string = "/architecture/reviews/new",
): string {
  return buildOperatorHrefFromSearch(currentSearch, pathname, {
    selectionSwitch: { kind: "disclosure-only" },
    mutate: (params) => {

    if (mode === "quick") {
      params.delete(NEW_RUN_WIZARD_MODE_PARAM);
    } else {
      params.set(NEW_RUN_WIZARD_MODE_PARAM, mode);
    }
    },
  });
}
