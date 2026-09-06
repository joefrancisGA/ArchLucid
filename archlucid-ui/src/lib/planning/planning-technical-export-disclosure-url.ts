import { PLANNING_PATH } from "@/lib/planning-route";

export const PLANNING_TECHNICAL_EXPORT_OPEN_PARAM = "planningTechnicalExportOpen";

export function parsePlanningTechnicalExportOpenFromSearch(raw: string | null | undefined): boolean {
  if (raw === null || raw === undefined) {
    return false;
  }

  const trimmed = raw.trim().toLowerCase();

  return trimmed === "1" || trimmed === "true";
}

export function planningTechnicalExportDisclosureHrefFromSearch(
  currentSearch: string,
  open: boolean,
  pathname: string = PLANNING_PATH,
): string {
  const params = new URLSearchParams(currentSearch);

  if (!open) {
    params.delete(PLANNING_TECHNICAL_EXPORT_OPEN_PARAM);
  } else {
    params.set(PLANNING_TECHNICAL_EXPORT_OPEN_PARAM, "1");
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}
