import { SPONSOR_DASHBOARD_HREF } from "@/lib/sponsor/sponsor-dashboard-route";
import type { SponsorTimeRange } from "@/lib/sponsor/sponsor-time-range";

export const SPONSOR_ROI_TREND_RANGE_PARAM = "range";

const SPONSOR_ROI_TREND_RANGE_IDS = new Set<string>(["30d", "quarter", "year", "all"]);

export const DEFAULT_SPONSOR_ROI_TREND_RANGE: SponsorTimeRange = "quarter";

export function parseSponsorRoiTrendRangeFromSearch(raw: string | null | undefined): SponsorTimeRange {
  if (raw === null || raw === undefined) {
    return DEFAULT_SPONSOR_ROI_TREND_RANGE;
  }

  const trimmed = raw.trim();

  if (!SPONSOR_ROI_TREND_RANGE_IDS.has(trimmed)) {
    return DEFAULT_SPONSOR_ROI_TREND_RANGE;
  }

  return trimmed as SponsorTimeRange;
}

export function sponsorRoiTrendRangeHrefFromSearch(
  currentSearch: string,
  range: SponsorTimeRange,
  pathname: string = SPONSOR_DASHBOARD_HREF,
): string {
  const params = new URLSearchParams(currentSearch);

  if (range === DEFAULT_SPONSOR_ROI_TREND_RANGE) {
    params.delete(SPONSOR_ROI_TREND_RANGE_PARAM);
  } else {
    params.set(SPONSOR_ROI_TREND_RANGE_PARAM, range);
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}
