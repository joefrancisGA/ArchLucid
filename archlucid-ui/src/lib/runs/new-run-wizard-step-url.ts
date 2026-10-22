import { buildOperatorHrefFromSearch } from "@/lib/operator/operator-url-href-from-search";
const NEW_RUN_WIZARD_STEP_PARAM = "step";

export function parseNewRunWizardStepFromSearch(raw: string | null | undefined): number | null {
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

  if (!Number.isFinite(parsed) || parsed < 0) {
    return null;
  }

  return parsed;
}

export function newRunWizardStepHrefFromSearch(
  currentSearch: string,
  stepIndex: number,
  pathname: string = "/architecture/reviews/new",
): string {
  return buildOperatorHrefFromSearch(currentSearch, pathname, {
    selectionSwitch: { kind: "disclosure-only" },
    mutate: (params) => {

    if (stepIndex <= 0) {
      params.delete(NEW_RUN_WIZARD_STEP_PARAM);
    } else {
      params.set(NEW_RUN_WIZARD_STEP_PARAM, String(stepIndex));
    }
    },
  });
}
