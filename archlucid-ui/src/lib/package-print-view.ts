/**
 * Printable architecture review view (TB-2205) — source-of-truth copy and helpers.
 * Dedicated print route keeps shell chrome out of the PDF without export-format roulette.
 */

import {
  resolveWorkingReviewPackageBackHref,
  type ResolveWorkingBackLocatorInput,
} from "@/lib/architecture/working-back-href";
import { formatInventoryShowingLine } from "@/lib/inventory-showing-count";
import { buyerFacingReviewTitleFromSummary } from "@/lib/buyer/buyer-facing-review-title";
import type { EnterpriseStatusKind } from "@/lib/design-tokens";
import type { ReviewMeetingCaptureEntry } from "@/lib/reviews/review-meeting-capture-export";
import type { RunSummary } from "@/types/authority";
import { buildSemanticSupportBandExportStamp } from "@/lib/findings/finding-semantic-support-band-export";
import type { QuickDecisionFinding } from "@/lib/quick-decision-summary-derive";
import type { StructuralExecutionModeInput } from "@/lib/structural-execution-mode";
import type { PackagePrintRehearsalHonestyStrip } from "@/lib/package-print-rehearsal-honesty";
import type { TransparencyTrail } from "@/types/feasibility-verdict";
import { formatInstantForLocale } from "@/lib/locale-datetime";

/** Document title / H1 for the print stylesheet view. */
export const PACKAGE_PRINT_PAGE_TITLE = "Architecture review";

/** Screen-only instructions above the print button (hidden when printing). */
export const PACKAGE_PRINT_INSTRUCTIONS =
  "Use Print / Save as PDF for a clean review summary without operator chrome or export-format choices. This view is for printing — not a signed export artifact.";

/** Working print: fail-closed coverage honesty when quiet-engine / skipped-MUST detail is not on the summary (CD-06). */
export const PACKAGE_PRINT_COVERAGE_HONESTY_LINE =
  "This print summary is not the sealed record. Decision-grade and checklist counts reflect gate classification — open the architecture package for quiet-engine and skipped-MUST coverage before board or procurement use.";

export const PACKAGE_PRINT_COVERAGE_HONESTY_STORED_EMPTY =
  "Coverage honesty was stored empty." as const;

export function formatPackagePrintCoverageHonestyLine(
  coverageHonestyLine: string | null | undefined,
): string {
  if (coverageHonestyLine === null || coverageHonestyLine === undefined) {
    return PACKAGE_PRINT_COVERAGE_HONESTY_LINE;
  }

  if (coverageHonestyLine.trim().length === 0) {
    return PACKAGE_PRINT_COVERAGE_HONESTY_STORED_EMPTY;
  }

  return coverageHonestyLine.trim();
}

/** Primary CTA on the print page (mirrors help-topic wording). */
export const PACKAGE_PRINT_BUTTON_LABEL = "Print / Save as PDF";

/** CTA on the review-package tab that opens the dedicated print route. */
export const PACKAGE_PRINT_OPEN_LABEL = "Print / Save as PDF";

/** Link back from the print view to the review workspace package tab. */
export const PACKAGE_PRINT_BACK_LABEL = "Back to review";

export const PACKAGE_PRINT_STATUS_HEADING = "Status";
export const PACKAGE_PRINT_FINDINGS_HEADING = "Key findings summary";
export const PACKAGE_PRINT_SEMANTIC_SUPPORT_HEADING = "Semantic support";
export const PACKAGE_PRINT_SEMANTIC_SUPPORT_STAMP_NOT_STORED_LINE =
  "Semantic support stamp was not stored on this print." as const;
export const PACKAGE_PRINT_SEMANTIC_SUPPORT_NO_DECISION_GRADE_LINE =
  "No decision-grade findings were stored for semantic support." as const;
export const PACKAGE_PRINT_SYNOPSIS_HEADING = "Sponsor synopsis";
export const PACKAGE_PRINT_DRAFT_SYNOPSIS_HEADING = "Working sponsor synopsis (draft)";
export const PACKAGE_PRINT_DRAFT_SYNOPSIS_NOT_PUBLISHED =
  "Draft sponsor synopsis is not published with a finalized architecture package.";
export const PACKAGE_PRINT_META_CREATED_LABEL = "Created";
export const PACKAGE_PRINT_CREATED_TIME_NOT_STORED = "Created time was not stored on this print.";
export const PACKAGE_PRINT_CREATED_TIME_STORED_EMPTY = "Created time was stored empty on this print.";
export const PACKAGE_PRINT_CREATED_TIME_NOT_READABLE = "Created time on this print was not readable.";
export const PACKAGE_PRINT_LOADING_LABEL = "Loading review for print…";
export const PACKAGE_PRINT_ERROR_FALLBACK = "This architecture review could not be loaded for print.";

export const PACKAGE_PRINT_PIPELINE_STAGE_FLAGS_OMITTED_LINE =
  "Assessment step flags were not stored on this summary — review status may not reflect pipeline progress.";

export type PackagePrintStatusLabel =
  | "Draft"
  | "Active"
  | "Awaiting approval"
  | "Finalized"
  | "Finalized. Governance warnings were stored."
  | "Finalized. No governance warnings were stored."
  | "Finalized. Governance warning flags were not stored."
  | "Review status was not stored."
  | "Archived";

/** Builds the dedicated print path for a review (`/architecture/reviews/{runId}/print`). */
/** Print metadata line — avoids generic "Not recorded" for missing review created time. */
export function formatPackagePrintCreatedMetadataLine(createdUtc: string | null | undefined): string {
  if (createdUtc === null || createdUtc === undefined) {
    return PACKAGE_PRINT_CREATED_TIME_NOT_STORED;
  }

  if (createdUtc.trim().length === 0) {
    return PACKAGE_PRINT_CREATED_TIME_STORED_EMPTY;
  }

  const formatted = formatInstantForLocale(createdUtc);

  if (formatted === "Date not readable") {
    return PACKAGE_PRINT_CREATED_TIME_NOT_READABLE;
  }

  if (formatted === "Not recorded") {
    return PACKAGE_PRINT_CREATED_TIME_NOT_STORED;
  }

  return formatted;
}

export function buildPackagePrintPath(runId: string): string {
  const trimmed = runId.trim();

  if (trimmed.length === 0) {
    return "/architecture/reviews/print";
  }

  return `/architecture/reviews/${encodeURIComponent(trimmed)}/print`;
}

/** Builds the review workspace href with the package tab focused (AO-44 nested when architecture is known). */
export function buildPackagePrintBackHref(
  runId: string,
  options?: Omit<ResolveWorkingBackLocatorInput, "reviewId" | "reviewTab">,
): string {
  const trimmed = runId.trim();

  if (trimmed.length === 0) {
    return "/architecture/reviews";
  }

  return resolveWorkingReviewPackageBackHref({ reviewId: trimmed, ...options });
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
  readonly warningsTotalCount?: number | null;
  readonly sponsorSynopsis: string | null;
  /** TB-2183 working synopsis paragraph when the package is not finalized. */
  readonly draftWorkingSynopsisParagraph?: string | null;
  readonly createdUtc: string;
  readonly runId: string;
  readonly coverageHonestyLine?: string | null;
  readonly semanticSupportBandStampLine?: string | null;
  readonly semanticSupportFindingsSnapshotPresent?: boolean | undefined;
  readonly semanticSupportDecisionGradeCount?: number | null;
  readonly manifestVersionForGuard?: string | null;
  readonly meetingCaptureEntries?: readonly ReviewMeetingCaptureEntry[] | null;
  readonly transparencyTrail?: TransparencyTrail | null;
  readonly showQuietEnginesHint?: boolean;
  readonly quietEnginesHintKind?: "quiet-engines" | "actor-count-not-stored";
  readonly rehearsalHonestyStrip?: PackagePrintRehearsalHonestyStrip | null;
  readonly pipelineStageFlagsOmittedLine?: string | null;
};

function pipelineStageFlagIsKnown(value: boolean | null | undefined): boolean {
  return value !== null && value !== undefined;
}

export function packagePrintPipelineStageFlagsOmitted(summary: RunSummary): boolean {
  if (summary.hasGoldenManifest === true) {
    return false;
  }

  return (
    !pipelineStageFlagIsKnown(summary.hasContextSnapshot)
    && !pipelineStageFlagIsKnown(summary.hasGraphSnapshot)
    && !pipelineStageFlagIsKnown(summary.hasFindingsSnapshot)
  );
}

/** Resolves whether a findings snapshot is present without treating unknown flags as absent. */
export function resolvePackagePrintFindingsSnapshotPresent(
  summary: RunSummary,
  buyerFindingsSnapshot: unknown | undefined,
): boolean | undefined {
  if (buyerFindingsSnapshot != null) {
    return true;
  }

  if (summary.hasFindingsSnapshot === true) {
    return true;
  }

  if (summary.hasFindingsSnapshot === false) {
    return false;
  }

  return undefined;
}

function finiteCount(value: number | null | undefined): number | null {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return null;
  }

  return Math.trunc(value);
}

/** Overall package status for the print header (aligned with reviews hub labels). */
export function resolvePackagePrintStatusLabel(summary: RunSummary): PackagePrintStatusLabel {
  if (summary.isArchived === true) {
    return "Archived";
  }

  if (summary.hasGoldenManifest === true) {
    if (summary.hasGovernanceWarnings === true) {
      return "Finalized. Governance warnings were stored.";
    }

    if (summary.hasGovernanceWarnings === false) {
      return "Finalized. No governance warnings were stored.";
    }

    return "Finalized. Governance warning flags were not stored.";
  }

  if (
    summary.hasFindingsSnapshot === true
    || summary.hasGraphSnapshot === true
    || summary.hasContextSnapshot === true
  ) {
    return "Active";
  }

  const draftFlags = [
    summary.isArchived,
    summary.hasGoldenManifest,
    summary.hasFindingsSnapshot,
    summary.hasGraphSnapshot,
    summary.hasContextSnapshot,
  ];

  if (draftFlags.some((flag) => flag === undefined)) {
    return "Review status was not stored.";
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
    case "Finalized. Governance warnings were stored.":
    case "Finalized. No governance warnings were stored.":
    case "Finalized. Governance warning flags were not stored.":
      return "approved";
    case "Archived":
      return "neutral";
    case "Review status was not stored.":
      return "draft";
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
  } else {
    parts.push("Finding count was not stored.");
  }

  if (warnings !== null && warnings > 0) {
    parts.push(`${warnings} warning${warnings === 1 ? "" : "s"}`);
  } else if (summary.hasGovernanceWarnings === false) {
    parts.push("No governance warning flags were stored.");
  } else if (warnings === 0) {
    parts.push("0 warnings were stored.");
  } else if (warnings === null) {
    parts.push("Warning count was not stored.");
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
    if (findings === null || warnings === null) {
      return `${base}. Package is finalized.`;
    }

    return `${base}. Included in the finalized architecture review.`;
  }

  return `${base}. Package not finalized yet — counts may change before finalize.`;
}

/**
 * Short sponsor-facing synopsis when a finalized package exists.
 * Returns null when there is nothing honest to say (pre-finalize drafts).
 */
export function formatPackagePrintDraftSynopsisBody(paragraph: string | null | undefined): string {
  const trimmed = paragraph?.trim() ?? "";

  if (trimmed.length === 0) {
    return "Draft sponsor synopsis was not stored.";
  }

  return `${PACKAGE_PRINT_DRAFT_SYNOPSIS_NOT_PUBLISHED} ${trimmed}`;
}

export function resolvePackagePrintSynopsisHeading(statusLabel: PackagePrintStatusLabel): string {
  if (statusLabel === "Draft" || statusLabel === "Active" || statusLabel === "Awaiting approval") {
    return PACKAGE_PRINT_DRAFT_SYNOPSIS_HEADING;
  }

  return PACKAGE_PRINT_SYNOPSIS_HEADING;
}

export function resolvePackagePrintSynopsisBody(presentation: PackagePrintPresentation): string {
  const storedSynopsis = presentation.sponsorSynopsis?.trim() ?? "";

  if (storedSynopsis.length > 0) {
    return storedSynopsis;
  }

  const findings = finiteCount(presentation.findingsTotalCount ?? null);
  const warnings = finiteCount(presentation.warningsTotalCount ?? null);
  const findingsLine =
    findings === null
      ? "Finding count was not stored."
      : `${findings} finding${findings === 1 ? "" : "s"} recorded on this summary.`;
  const warningsLine =
    warnings === null
      ? "Warning count was not stored."
      : warnings === 0
        ? "0 approval-check warnings were stored on this summary."
        : `${warnings} approval-check warning${warnings === 1 ? "" : "s"} on this summary.`;

  return [
    "A stored sponsor synopsis was not on this print.",
    `Review title: ${presentation.title}`,
    findingsLine,
    warningsLine,
  ].join("\n");
}

export function buildPackagePrintSponsorSynopsis(_summary: RunSummary): string | null {
  return null;
}

export function formatPackagePrintSponsorSynopsisHonestyBody(summary: RunSummary): string {
  const title = buyerFacingReviewTitleFromSummary(summary);
  const findings = finiteCount(summary.findingCount);
  const warnings = finiteCount(summary.warningCount);
  const findingsLine =
    findings === null
      ? "Finding count was not stored."
      : `${findings} finding${findings === 1 ? "" : "s"} recorded on this summary.`;
  const warningsLine =
    warnings === null
      ? "Warning count was not stored."
      : `${warnings} approval-check warning${warnings === 1 ? "" : "s"} on this summary.`;

  return [
    "A stored sponsor synopsis was not on this print.",
    `Review title: ${title}`,
    findingsLine,
    warningsLine,
  ].join("\n");
}

export function resolvePackagePrintSemanticSupportBandDisplayLine(
  stampLine: string | null | undefined,
  options?: {
    readonly findingsSnapshotPresent?: boolean;
    readonly decisionGradeCount?: number | null;
  },
): string {
  const trimmedStamp = stampLine?.trim() ?? "";

  if (trimmedStamp.length > 0) {
    return trimmedStamp;
  }

  if (
    options?.findingsSnapshotPresent === true
    && options.decisionGradeCount !== null
    && options.decisionGradeCount !== undefined
    && options.decisionGradeCount === 0
  ) {
    return PACKAGE_PRINT_SEMANTIC_SUPPORT_NO_DECISION_GRADE_LINE;
  }

  return PACKAGE_PRINT_SEMANTIC_SUPPORT_STAMP_NOT_STORED_LINE;
}

/** Stamp line aligned with review-package semantic support counts (AS-071). */
export function resolvePackagePrintSemanticSupportBandStampLine(
  findings: readonly QuickDecisionFinding[],
  structuralExecutionMode?: StructuralExecutionModeInput,
): string | null {
  return buildSemanticSupportBandExportStamp(findings, structuralExecutionMode).stampLine;
}

/** Maps a run summary into the print view presentation model. */
export function buildPackagePrintPresentation(
  summary: RunSummary,
  options?: {
    readonly findingsListedCount?: number | null;
    readonly coverageHonestyLine?: string | null;
    readonly semanticSupportBandStampLine?: string | null;
    readonly semanticSupportFindingsSnapshotPresent?: boolean | undefined;
    readonly semanticSupportDecisionGradeCount?: number | null;
    readonly meetingCaptureEntries?: readonly ReviewMeetingCaptureEntry[] | null;
    readonly transparencyTrail?: TransparencyTrail | null;
    readonly showQuietEnginesHint?: boolean;
  readonly quietEnginesHintKind?: "quiet-engines" | "actor-count-not-stored";
    readonly rehearsalHonestyStrip?: PackagePrintRehearsalHonestyStrip | null;
    readonly draftWorkingSynopsisParagraph?: string | null;
  },
): PackagePrintPresentation {
  const statusLabel = resolvePackagePrintStatusLabel(summary);
  const findingsTotalCount = finiteCount(summary.findingCount);
  const warningsTotalCount = finiteCount(summary.warningCount);
  const findingsListedCount =
    options?.findingsListedCount === undefined
      ? findingsTotalCount
      : options.findingsListedCount === null
        ? null
        : finiteCount(options.findingsListedCount);
  const baseSummary = buildPackagePrintFindingsSummary(summary);
  const inventoryLine =
    findingsListedCount !== null &&
    findingsTotalCount !== null &&
    findingsListedCount < findingsTotalCount
      ? formatInventoryShowingLine(findingsListedCount, findingsTotalCount)
      : null;
  const listedCountOmissionLine =
    options?.findingsListedCount === null && findingsTotalCount !== null
      ? "Listed finding count was not stored."
      : null;

  return {
    title: buyerFacingReviewTitleFromSummary(summary),
    statusLabel,
    statusKind: resolvePackagePrintStatusKind(statusLabel),
    findingsSummary:
      listedCountOmissionLine !== null
        ? `${baseSummary} ${listedCountOmissionLine}`
        : inventoryLine !== null
          ? `${baseSummary} ${inventoryLine}.`
          : baseSummary,
    findingsListedCount,
    findingsTotalCount,
    warningsTotalCount,
    sponsorSynopsis: buildPackagePrintSponsorSynopsis(summary),
    draftWorkingSynopsisParagraph: options?.draftWorkingSynopsisParagraph ?? null,
    createdUtc: summary.createdUtc,
    runId: summary.runId,
    coverageHonestyLine: options?.coverageHonestyLine ?? null,
    semanticSupportBandStampLine: options?.semanticSupportBandStampLine ?? null,
    semanticSupportFindingsSnapshotPresent: options?.semanticSupportFindingsSnapshotPresent,
    semanticSupportDecisionGradeCount: options?.semanticSupportDecisionGradeCount ?? null,
    meetingCaptureEntries: options?.meetingCaptureEntries ?? null,
    transparencyTrail: options?.transparencyTrail ?? null,
    showQuietEnginesHint: options?.showQuietEnginesHint ?? false,
    quietEnginesHintKind: options?.quietEnginesHintKind ?? "quiet-engines",
    rehearsalHonestyStrip: options?.rehearsalHonestyStrip ?? null,
    pipelineStageFlagsOmittedLine: packagePrintPipelineStageFlagsOmitted(summary)
      ? PACKAGE_PRINT_PIPELINE_STAGE_FLAGS_OMITTED_LINE
      : null,
    manifestVersionForGuard:
      summary.currentManifestVersion?.trim()
      ?? summary.goldenManifestId?.trim()
      ?? (summary.hasGoldenManifest === true ? summary.runId : null),
  };
}
