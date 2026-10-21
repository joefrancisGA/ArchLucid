import { buildOperatorHrefFromSearch } from "@/lib/operator/operator-url-href-from-search";
export const FINDING_INSPECT_DISP_CONFIRM_PARAM = "dispConfirm";

export const FINDING_INSPECT_DISP_CONFIRM_OPTIONS = ["disposition", "mark-remediated"] as const;

export type FindingInspectDispositionConfirmUrlValue = (typeof FINDING_INSPECT_DISP_CONFIRM_OPTIONS)[number];

const FINDING_INSPECT_DISP_CONFIRM_IDS = new Set<string>(FINDING_INSPECT_DISP_CONFIRM_OPTIONS);

export function parseFindingInspectDispositionConfirmFromSearch(
  raw: string | null | undefined,
): FindingInspectDispositionConfirmUrlValue | null {
  if (raw === null || raw === undefined) {
    return null;
  }

  const trimmed = raw.trim().toLowerCase();

  if (!FINDING_INSPECT_DISP_CONFIRM_IDS.has(trimmed)) {
    return null;
  }

  return trimmed as FindingInspectDispositionConfirmUrlValue;
}

export function findingInspectDispositionConfirmHrefFromSearch(
  currentSearch: string,
  confirm: FindingInspectDispositionConfirmUrlValue | null,
  pathname: string,
): string {
  return buildOperatorHrefFromSearch(currentSearch, pathname, {
    selectionSwitch: { kind: "disclosure-only" },
    mutate: (params) => {

    if (confirm === null) {
      params.delete(FINDING_INSPECT_DISP_CONFIRM_PARAM);
    } else {
      params.set(FINDING_INSPECT_DISP_CONFIRM_PARAM, confirm);
    }
    },
  });
}
