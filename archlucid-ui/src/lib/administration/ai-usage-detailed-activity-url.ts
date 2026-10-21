import { AI_USAGE_SETTINGS_PATH } from "@/lib/ai-usage-nav-paths";
import { buildOperatorHrefFromSearch } from "@/lib/operator/operator-url-href-from-search";

export const AI_USAGE_DETAILED_ACTIVITY_OPEN_PARAM = "aiUsageDetailedActivityOpen";

export function parseAiUsageDetailedActivityOpenFromSearch(raw: string | null | undefined): boolean {
  if (raw === null || raw === undefined) {
    return false;
  }

  const trimmed = raw.trim().toLowerCase();

  return trimmed === "1" || trimmed === "true";
}

export function aiUsageDetailedActivityHrefFromSearch(
  currentSearch: string,
  open: boolean,
  pathname: string = AI_USAGE_SETTINGS_PATH,
): string {
  return buildOperatorHrefFromSearch(currentSearch, pathname, {
    selectionSwitch: { kind: "disclosure-only" },
    mutate: (params) => {

    if (!open) {
      params.delete(AI_USAGE_DETAILED_ACTIVITY_OPEN_PARAM);
    } else {
      params.set(AI_USAGE_DETAILED_ACTIVITY_OPEN_PARAM, "1");
    }
    },
  });
}
