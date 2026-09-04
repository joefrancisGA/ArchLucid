import { SPONSOR_REPORT_PATH } from "@/lib/sponsor-report-navigation";

export const SPONSOR_REPORT_EMAIL_PREVIEW_PARAM = "emailPreview";

export function parseSponsorReportEmailPreviewOpenFromSearch(raw: string | null | undefined): boolean {
  if (raw === null || raw === undefined) {
    return false;
  }

  const trimmed = raw.trim().toLowerCase();

  return trimmed === "1" || trimmed === "true";
}

export function sponsorReportEmailPreviewHrefFromSearch(
  currentSearch: string,
  emailPreviewOpen: boolean,
  pathname: string = SPONSOR_REPORT_PATH,
): string {
  const params = new URLSearchParams(currentSearch);

  if (!emailPreviewOpen) {
    params.delete(SPONSOR_REPORT_EMAIL_PREVIEW_PARAM);
  } else {
    params.set(SPONSOR_REPORT_EMAIL_PREVIEW_PARAM, "1");
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}
