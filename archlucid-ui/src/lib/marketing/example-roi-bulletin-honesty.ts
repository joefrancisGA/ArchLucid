import { SPONSOR_SUMMARY_PILOT_ROI_MEASUREMENT_HELP_HREF } from "@/lib/sponsor/sponsor-report-pilot-roi-measurement-help";

/** Buyer-safe methodology help for aggregate ROI bulletin shape (TB-1520). */
export const EXAMPLE_ROI_BULLETIN_METHODOLOGY_HELP_HREF = SPONSOR_SUMMARY_PILOT_ROI_MEASUREMENT_HELP_HREF;

export const EXAMPLE_ROI_BULLETIN_TRUST_CENTER_HREF = "/trust" as const;

export const EXAMPLE_ROI_BULLETIN_PRIMARY_CTA_LABEL = "Pilot ROI model (help)" as const;

export const EXAMPLE_ROI_BULLETIN_TRUST_CENTER_CTA_LABEL = "Trust Center" as const;

export const EXAMPLE_ROI_BULLETIN_OPERATOR_DISCLOSURE_TITLE = "For operators / CLI" as const;

export const EXAMPLE_ROI_BULLETIN_SAMPLE_SECTION_TITLE = "Sample bulletin" as const;

export const EXAMPLE_ROI_BULLETIN_SAMPLE_SECTION_LEAD =
  "Illustrative aggregate baseline bulletin shape — synthetic numbers only, not a signed publication." as const;

export const EXAMPLE_ROI_BULLETIN_SOURCE_DISCLOSURE_TITLE = "View checked-in sample source" as const;

export const EXAMPLE_ROI_BULLETIN_SOURCE_DISCLOSURE_SUMMARY =
  "Contributor file — may list internal repository doc paths. Buyers should use the rendered sample above." as const;

export const EXAMPLE_ROI_BULLETIN_HERO_LEAD =
  "This page shows the quarterly aggregate baseline bulletin shape procurement reviewers see once enough tenants have captured baselines. Numbers here are illustrative only — not a signed publication or live tenant ROI." as const;

export const EXAMPLE_ROI_BULLETIN_OPERATOR_GATE_LEAD =
  "Real aggregate numbers require an API key with Admin access after sign-in. Publication requires minTenants=5 qualifying tenants. This synthetic sample must never receive a product changelog ROI bulletin signed entry." as const;

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

/** Parses the Reviewed date from the sample frontmatter blockquote. */
export function lastReviewedLabelFromSample(markdown: string): string {
  const match = markdown.match(/\*\*Reviewed:\*\*\s*(\d{4}-\d{2}-\d{2})/);

  if (match === null || match[1] === undefined || match[1].trim().length === 0) {
    return "2026-07-25";
  }

  return match[1].trim();
}

export function adminRoiBulletinPreviewHref(illustrativeQuarter: string): string {
  const params = new URLSearchParams();
  params.set("quarter", illustrativeQuarter);
  params.set("minTenants", "5");

  return `/api/proxy/v1/admin/roi-bulletin-preview?${params.toString()}`;
}
