import type { PilotOutcomesPeriodPresetId } from "@/lib/pilot-outcomes-period-presets";
import { SPONSOR_REPORT_PATH } from "@/lib/sponsor-report-navigation";
import {
  SPONSOR_REPORT_FROM_PARAM,
  SPONSOR_REPORT_TO_PARAM,
} from "@/lib/insights/sponsor-report-custom-date-url";

export const SPONSOR_REPORT_PERIOD_PARAM = "range";

export const DEFAULT_SPONSOR_REPORT_PERIOD: PilotOutcomesPeriodPresetId = "last-30";

const PERIOD_PRESET_IDS = new Set<string>([
  "last-30",
  "last-90",
  "current-quarter",
  "previous-quarter",
  "full-pilot",
  "custom",
]);

export function parseSponsorReportPeriodFromSearch(
  raw: string | null | undefined,
): PilotOutcomesPeriodPresetId {
  if (raw === null || raw === undefined) {
    return DEFAULT_SPONSOR_REPORT_PERIOD;
  }

  const trimmed = raw.trim();

  if (!PERIOD_PRESET_IDS.has(trimmed)) {
    return DEFAULT_SPONSOR_REPORT_PERIOD;
  }

  return trimmed as PilotOutcomesPeriodPresetId;
}

export function sponsorReportPeriodHrefFromSearch(
  currentSearch: string,
  period: PilotOutcomesPeriodPresetId,
  pathname: string = SPONSOR_REPORT_PATH,
): string {
  const params = new URLSearchParams(currentSearch);

  if (period === DEFAULT_SPONSOR_REPORT_PERIOD) {
    params.delete(SPONSOR_REPORT_PERIOD_PARAM);
  } else {
    params.set(SPONSOR_REPORT_PERIOD_PARAM, period);
  }

  if (period !== "custom") {
    params.delete(SPONSOR_REPORT_FROM_PARAM);
    params.delete(SPONSOR_REPORT_TO_PARAM);
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}
