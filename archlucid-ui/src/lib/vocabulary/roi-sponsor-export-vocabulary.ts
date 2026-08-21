/**
 * TB-2258 — ROI summary ≠ sponsor export vocabulary rail.
 *
 * Why two surfaces exist:
 * - ROI summary (`/insights/roi-summary`) is the *portfolio KPI* view for
 *   review-cycle reduction, effort saved, and export-ready artifacts across
 *   the reporting window.
 * - Sponsor export (review-detail `#sponsor-handoff` and sponsor dashboard
 *   sponsor exports) is the *per-package send* — download the sponsor review
 *   summary or architecture report for a finalized architecture package.
 *
 * They stay separate because portfolio KPI framing is not the same task as
 * handing off one sealed review record to a sponsor.
 */

import { SPONSOR_DASHBOARD_HREF } from "@/lib/sponsor/sponsor-dashboard-route";
import { SPONSOR_REPORT_ROI_SUMMARY_PATH } from "@/lib/sponsor-report-navigation";

export type RoiSponsorExportSurfaceId =
  | "roi-summary"
  | "sponsor-handoff"
  | "sponsor-dashboard";

export type RoiSponsorExportLink = {
  readonly id: RoiSponsorExportSurfaceId;
  readonly label: string;
  readonly href: string;
  readonly whenToUse: string;
};

export type RoiSponsorExportVocabularyModel = {
  readonly heading: string;
  readonly whyTwo: string;
  readonly compactLine: string;
  readonly roiSummaryLink: RoiSponsorExportLink;
  readonly sponsorHandoffLink: RoiSponsorExportLink;
  readonly executiveDashboardLink: RoiSponsorExportLink;
};

export const ROI_SPONSOR_EXPORT_HEADING =
  "ROI summary and sponsor export serve different purposes" as const;

export const ROI_SPONSOR_EXPORT_WHY_TWO =
  "ROI summary shows portfolio KPIs — review-cycle reduction, estimated effort saved, and export-ready artifacts across the reporting window. Sponsor export sends a per-package sponsor review summary or architecture report for one finalized architecture package. Portfolio framing is not the same as handing off a single finalized review record." as const;

export const ROI_SPONSOR_EXPORT_COMPACT_LINE =
  "ROI summary is portfolio KPI; sponsor export is per-package send — open the other when you need both." as const;

export const ROI_SPONSOR_EXPORT_ROI_SUMMARY_LINK: RoiSponsorExportLink = {
  id: "roi-summary",
  label: "ROI summary",
  href: SPONSOR_REPORT_ROI_SUMMARY_PATH,
  whenToUse: "Review portfolio KPIs for the reporting window.",
};

/** Review-detail sponsor handoff lives on the active architecture package; href is the sponsor dashboard exports strip as a stable peer when no runId is in scope. */
export const ROI_SPONSOR_EXPORT_SPONSOR_HANDOFF_LINK: RoiSponsorExportLink = {
  id: "sponsor-handoff",
  label: "Sponsor export",
  href: `${SPONSOR_DASHBOARD_HREF}#sponsor-exports`,
  whenToUse: "Download the sponsor review summary or architecture report for a finalized package.",
};

export const ROI_SPONSOR_EXPORT_SPONSOR_DASHBOARD_LINK: RoiSponsorExportLink = {
  id: "sponsor-dashboard",
  label: "Sponsor dashboard",
  href: SPONSOR_DASHBOARD_HREF,
  whenToUse: "Open export-ready outputs and sponsor report from the dashboard.",
};

/** Full vocabulary model (heading, why-two copy, and deep links). */
export function buildRoiSponsorExportVocabulary(): RoiSponsorExportVocabularyModel {
  return {
    heading: ROI_SPONSOR_EXPORT_HEADING,
    whyTwo: ROI_SPONSOR_EXPORT_WHY_TWO,
    compactLine: ROI_SPONSOR_EXPORT_COMPACT_LINE,
    roiSummaryLink: ROI_SPONSOR_EXPORT_ROI_SUMMARY_LINK,
    sponsorHandoffLink: ROI_SPONSOR_EXPORT_SPONSOR_HANDOFF_LINK,
    executiveDashboardLink: ROI_SPONSOR_EXPORT_SPONSOR_DASHBOARD_LINK,
  };
}

/**
 * Peer deep-link for the task you are not currently on.
 * ROI summary ↔ sponsor export (handoff or sponsor dashboard exports).
 */
export function resolveRoiSponsorExportPeerLink(
  currentSurfaceId: RoiSponsorExportSurfaceId,
): RoiSponsorExportLink {
  if (currentSurfaceId === "roi-summary") {
    return ROI_SPONSOR_EXPORT_SPONSOR_HANDOFF_LINK;
  }

  return ROI_SPONSOR_EXPORT_ROI_SUMMARY_LINK;
}

/** Optional run-scoped sponsor handoff href when mounted on a review detail. */
export function buildRoiSponsorExportHandoffHref(runId: string | null | undefined): string {
  const trimmed = runId?.trim() ?? "";

  if (trimmed.length === 0) {
    return ROI_SPONSOR_EXPORT_SPONSOR_HANDOFF_LINK.href;
  }

  return `/architecture/reviews/${encodeURIComponent(trimmed)}#sponsor-handoff`;
}
