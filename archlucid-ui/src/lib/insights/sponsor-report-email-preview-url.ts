import { SPONSOR_REPORT_PATH } from "@/lib/sponsor-report-navigation";
import { buildOperatorHrefFromSearch } from "@/lib/operator/operator-url-href-from-search";

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
  return buildOperatorHrefFromSearch(currentSearch, pathname, {
    selectionSwitch: { kind: "disclosure-only" },
    mutate: (params) => {

    if (!emailPreviewOpen) {
      params.delete(SPONSOR_REPORT_EMAIL_PREVIEW_PARAM);
    } else {
      params.set(SPONSOR_REPORT_EMAIL_PREVIEW_PARAM, "1");
    }
    },
  });
}
