/**
 * Printable architecture review view (TB-2205) — source-of-truth copy and helpers.
 * Dedicated print route keeps shell chrome out of the PDF without export-format roulette.
 */

import { formatInventoryShowingLine } from "@/lib/inventory-showing-count";
import { buyerFacingReviewTitleFromSummary } from "@/lib/buyer/buyer-facing-review-title";
import { resolveWorkingPrintBackHref } from "@/lib/architecture/working-back-href";
import type { EnterpriseStatusKind } from "@/lib/design-tokens";
import type { ReviewMeetingCaptureEntry } from "@/lib/reviews/review-meeting-capture-export";
import type { RunSummary } from "@/types/authority";

/** Document title / H1 for the print stylesheet view. */
export const PACKAGE_PRINT_PAGE_TITLE = "Architecture review";

/** Screen-only instructions above the print button (hidden when printing). */
export const PACKAGE_PRINT_INSTRUCTIONS =
  "Use Print / Save as PDF for a clean review summary without operator chrome or export-format choices. This view is for printing — not a signed export artifact.";

/** Working print: fail-closed coverage honesty when quiet-engine / skipped-MUST detail is not on the summary (CD-06). */
export const PACKAGE_PRINT_COVERAGE_HONESTY_LINE =
  "This print summary is not the sealed record. Decision-grade and checklist counts reflect gate classification — open the architecture package for quiet-engine and skipped-MUST coverage before board or procurement use.";

/** Primary CTA on the print page (mirrors help-topic wording). */
export const PACKAGE_PRINT_BUTTON_LABEL = "Print / Save as PDF";

/** CTA on the review-package tab that opens the dedicated print route. */
export const PACKAGE_PRINT_OPEN_LABEL = "Print / Save as PDF";

/** Link back from the print view to the review workspace package tab. */
export const PACKAGE_PRINT_BACK_LABEL = "Back to review";

export const PACKAGE_PRINT_STATUS_HEADING = "Status";
export const PACKAGE_PRINT_FINDINGS_HEADING = "Key findings summary";
export const PACKAGE_PRINT_SYNOPSIS_HEADING = "Sponsor synopsis";
export const PACKAGE_PRINT_META_CREATED_LABEL = "Created";
export const PACKAGE_PRINT_LOADING_LABEL = "Loading review for print…";
export const PACKAGE_PRINT_ERROR_FALLBACK = "This architecture review could not be loaded for print.";

export type PackagePrintStatusLabel =
  | "Draft"
  | "Active"
  | "Awaiting approval"
  | "Finalized"
  | "Archived";

/** Builds the dedicated print path for a review (`/architecture/reviews/{runId}/print`). */
export function buildPackagePrintPath(runId: string): string {
  const trimmed = runId.trim();

  if (trimmed.length === 0) {
    return "/architecture/reviews/print";
  }

  return `/architecture/reviews/${encodeURIComponent(trimmed)}/print`;
}

/** Builds the review workspace href with the package tab focused (AO-44 nested when architecture id known). */
export function buildPackagePrintBackHref(
  runId: string,
  architectureId?: string | null,
): string {
  const trimmed = runId.trim();

  if (trimmed.length === 0) {
    return "/architecture/reviews";
  }

  return resolveWorkingPrintBackHref(trimmed, architectureId);
}

/** Invokes the browser print dialog (screen stylesheet already hides shell chrome). */
export function printPackagePage(): void {
  if (typeof window === "undefined") {
    throw new Error("printPackagePage is only supported in the browser.");
  }

  window.print();
}

export type PackagePrintPresentation = {
  readonly title: string;
  readonly statusLabel: PackagePrintStatusLabel;
  readonly statusKind: EnterpriseStatusKind;
  readonly findingsSummary: string;
  readonly findingsListedCount?: number | null;
  readonly findingsTotalCount?: number | null;
  readonly sponsorSynopsis: string | null;
  readonly createdUtc: string;
  readonly runId: string;
  readonly coverageHonestyLine?: string | null;
  readonly manifestVersionForGuard?: string | null;
  readonly meetingCaptureEntries?: readonly ReviewMeetingCaptureEntry[] | null;
};

function finiteCount(value: number | null | undefined): number | null {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return null;
  }

  return Math.max(0, Math.trunc(value));
}

/** Overall package status for the print header (aligned with reviews hub labels). */
export function resolvePackagePrintStatusLabel(summary: RunSummary): PackagePrintStatusLabel {
  if (summary.isArchived === true) {
    return "Archived";
  }

  if (summary.hasGoldenManifest === true) {
    if (summary.hasGovernanceWarnings === true) {
      return "Active";
    }

    return "Finalized";
  }

  if (
    summary.hasFindingsSnapshot === true
    || summary.hasGraphSnapshot === true
    || summary.hasContextSnapshot === true
  ) {
    return "Active";
  }

  return "Draft";
}

export function resolvePackagePrintStatusKind(status: PackagePrintStatusLabel): EnterpriseStatusKind {
  switch (status) {
    case "Draft":
      return "draft";
    case "Active":
      return "in-progress";
    case "Awaiting approval":
      return "needs-attention";
    case "Finalized":
      return "approved";
    case "Archived":
      return "neutral";
    default: {
      const _exhaustive: never = status;

      return _exhaustive;
    }
  }
}

/** Buyer-facing one-line findings rollup from the lightweight run summary. */
export function buildPackagePrintFindingsSummary(summary: RunSummary): string {
  const findings = finiteCount(summary.findingCount);
  const warnings = finiteCount(summary.warningCount);
  const parts: string[] = [];

  if (findings !== null) {
    parts.push(`${findings} finding${findings === 1 ? "" : "s"}`);
  }

  if (warnings !== null && warnings > 0) {
    parts.push(`${warnings} warning${warnings === 1 ? "" : "s"}`);
  }

  if (summary.hasFindingsSnapshot === true && findings === null) {
    parts.push("Findings snapshot available");
  }

  if (parts.length === 0) {
    if (summary.hasGoldenManifest === true) {
      return "Findings counts are not on this summary — open the review findings tab for the full list.";
    }

    return "No findings summary is available yet. Finalize the review to publish findings with the architecture review.";
  }

  const base = parts.join(" · ");

  if (summary.hasGoldenManifest === true) {
    return `${base}. Included in the finalized architecture review.`;
  }

  return `${base}. Package not finalized yet — counts may change before finalize.`;
}

/**
 * Short sponsor-facing synopsis when a finalized package exists.
 * Returns null when there is nothing honest to say (pre-finalize drafts).
 */
export function buildPackagePrintSponsorSynopsis(summary: RunSummary): string | null {
  if (summary.hasGoldenManifest !== true) {
    return null;
  }

  const title = buyerFacingReviewTitleFromSummary(summary);
  const findings = finiteCount(summary.findingCount);
  const warnings = finiteCount(summary.warningCount);
  const findingsPhrase =
    findings === null
      ? "findings are available on the review"
      : `${findings} finding${findings === 1 ? "" : "s"} recorded`;
  const warningsPhrase =
    warnings !== null && warnings > 0
      ? ` ${warnings} approval-check warning${warnings === 1 ? "" : "s"} remain for attention.`
      : " No open approval-check warnings on this summary.";

  return `Sponsor synopsis for "${title}": finalized architecture review with ${findingsPhrase}.${warningsPhrase}`;
}

/** Maps a run summary into the print view presentation model. */
export function buildPackagePrintPresentation(
  summary: RunSummary,
  options?: {
    readonly findingsListedCount?: number | null;
    readonly coverageHonestyLine?: string | null;
    readonly meetingCaptureEntries?: readonly ReviewMeetingCaptureEntry[] | null;
  },
): PackagePrintPresentation {
  const statusLabel = resolvePackagePrintStatusLabel(summary);
  const findingsTotalCount = finiteCount(summary.findingCount);
  const findingsListedCount =
    options?.findingsListedCount === undefined || options?.findingsListedCount === null
      ? findingsTotalCount
      : finiteCount(options.findingsListedCount);
  const baseSummary = buildPackagePrintFindingsSummary(summary);
  const inventoryLine =
    findingsListedCount !== null &&
    findingsTotalCount !== null &&
    findingsListedCount < findingsTotalCount
      ? formatInventoryShowingLine(findingsListedCount, findingsTotalCount)
      : null;

  return {
    title: buyerFacingReviewTitleFromSummary(summary),
    statusLabel,
    statusKind: resolvePackagePrintStatusKind(statusLabel),
    findingsSummary: inventoryLine !== null ? `${baseSummary} ${inventoryLine}.` : baseSummary,
    findingsListedCount,
    findingsTotalCount,
    sponsorSynopsis: buildPackagePrintSponsorSynopsis(summary),
    createdUtc: summary.createdUtc,
    runId: summary.runId,
    coverageHonestyLine: options?.coverageHonestyLine ?? null,
    meetingCaptureEntries: options?.meetingCaptureEntries ?? null,
    manifestVersionForGuard:
      summary.currentManifestVersion?.trim()
      ?? summary.goldenManifestId?.trim()
      ?? (summary.hasGoldenManifest === true ? summary.runId : null),
  };
}
