import { EXECUTIVE_SUMMARY_PILOT_ROI_MEASUREMENT_HELP_HREF } from "@/lib/executive/executive-summary-pilot-roi-measurement-help";

/** Buyer-safe methodology help for aggregate ROI bulletin shape (TB-1520). */
export const EXAMPLE_ROI_BULLETIN_METHODOLOGY_HELP_HREF = EXECUTIVE_SUMMARY_PILOT_ROI_MEASUREMENT_HELP_HREF;

/** Parses the illustrative quarter label from the checked-in synthetic sample Markdown. */
export function illustrativeQuarterLabelFromSample(markdown: string): string {
  const match = markdown.match(/\*\*Quarter:\*\*\s*([^\n(]+)/);

  if (match === null) {
    return "illustrative quarter";
  }

  const trimmed = match[1]?.trim() ?? "";

  if (trimmed.length === 0) {
    return "illustrative quarter";
  }

  return trimmed;
}

export function adminRoiBulletinPreviewHref(illustrativeQuarter: string): string {
  const params = new URLSearchParams();
  params.set("quarter", illustrativeQuarter);
  params.set("minTenants", "5");

  return `/api/proxy/v1/admin/roi-bulletin-preview?${params.toString()}`;
}
