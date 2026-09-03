import { SPONSOR_REPORT_PATH } from "@/lib/sponsor-report-navigation";

export const SPONSOR_REPORT_FROM_PARAM = "from";
export const SPONSOR_REPORT_TO_PARAM = "to";

const DATETIME_LOCAL_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/;

export function parseSponsorReportCustomDateFromSearch(raw: string | null | undefined): string {
  if (raw === null || raw === undefined) {
    return "";
  }

  const trimmed = raw.trim();

  if (!DATETIME_LOCAL_PATTERN.test(trimmed)) {
    return "";
  }

  return trimmed;
}

export function sponsorReportCustomDateHrefFromSearch(
  currentSearch: string,
  fromUtc: string,
  toUtc: string,
  pathname: string = SPONSOR_REPORT_PATH,
): string {
  const params = new URLSearchParams(currentSearch);
  const from = parseSponsorReportCustomDateFromSearch(fromUtc);
  const to = parseSponsorReportCustomDateFromSearch(toUtc);

  if (from.length === 0) {
    params.delete(SPONSOR_REPORT_FROM_PARAM);
  } else {
    params.set(SPONSOR_REPORT_FROM_PARAM, from);
  }

  if (to.length === 0) {
    params.delete(SPONSOR_REPORT_TO_PARAM);
  } else {
    params.set(SPONSOR_REPORT_TO_PARAM, to);
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}
