/**
 * TB-2318 — Report a problem (dialog) ≠ Help hub vocabulary rail.
 *
 * Why two surfaces exist:
 * - Report a problem dialog submits a structured defect report with route,
 *   correlation, and consent context from the current operator surface.
 * - Help hub (`/help`) is the procedural help landing for how-to topics,
 *   guides, and runbooks.
 *
 * They stay separate because filing a defect from the dialog is not the same
 * task as browsing Help. Distinct from Report a problem ≠ Support workspace
 * (TB-2306), Report a problem ≠ Audit trail (TB-2267), and Glossary ≠
 * procedural Help (TB-2308).
 */

import { HELP_HUB_CANONICAL_PATH } from "@/lib/help/help-hub-evidence-copy";
import { REPORT_PROBLEM_DIALOG_TITLE } from "@/lib/report-problem-copy";

/**
 * Dialog has no dedicated route.
 * Hash documents the modal surface (`data-testid="report-problem-dialog"`).
 */
export const REPORT_PROBLEM_DIALOG_SURFACE_HREF = "#report-problem-dialog" as const;

export type ReportProblemDialogHelpHubSurfaceId =
  | "report-problem-dialog"
  | "help-hub";

export type ReportProblemDialogHelpHubLink = {
  readonly id: ReportProblemDialogHelpHubSurfaceId;
  readonly label: string;
  readonly href: string;
  readonly whenToUse: string;
};

export type ReportProblemDialogHelpHubVocabularyModel = {
  readonly heading: string;
  readonly whyTwo: string;
  readonly compactLine: string;
  readonly reportProblemDialogLink: ReportProblemDialogHelpHubLink;
  readonly helpHubLink: ReportProblemDialogHelpHubLink;
};

export const REPORT_PROBLEM_DIALOG_HELP_HUB_HEADING =
  "Report a problem and Help serve different purposes" as const;

export const REPORT_PROBLEM_DIALOG_HELP_HUB_WHY_TWO =
  "Report a problem is the dialog that submits a structured defect report with route, correlation, and consent context from the current surface. Help is the hub for how-to topics, guides, and runbooks. Filing a defect is not the same as browsing procedural Help." as const;

export const REPORT_PROBLEM_DIALOG_HELP_HUB_COMPACT_LINE =
  "Report a problem files a defect from this surface; Help browses how-to topics." as const;

export const REPORT_PROBLEM_DIALOG_HELP_HUB_DIALOG_LINK: ReportProblemDialogHelpHubLink =
  {
    id: "report-problem-dialog",
    label: REPORT_PROBLEM_DIALOG_TITLE,
    href: REPORT_PROBLEM_DIALOG_SURFACE_HREF,
    whenToUse:
      "Submit a structured defect report with correlation identifiers from the current surface.",
  };

export const REPORT_PROBLEM_DIALOG_HELP_HUB_HELP_LINK: ReportProblemDialogHelpHubLink =
  {
    id: "help-hub",
    label: "Help",
    href: HELP_HUB_CANONICAL_PATH,
    whenToUse: "Browse how-to topics, guides, and runbooks from the Help hub.",
  };

/** Full vocabulary model (heading, why-two copy, and deep links). */
export function buildReportProblemDialogHelpHubVocabulary(): ReportProblemDialogHelpHubVocabularyModel {
  return {
    heading: REPORT_PROBLEM_DIALOG_HELP_HUB_HEADING,
    whyTwo: REPORT_PROBLEM_DIALOG_HELP_HUB_WHY_TWO,
    compactLine: REPORT_PROBLEM_DIALOG_HELP_HUB_COMPACT_LINE,
    reportProblemDialogLink: REPORT_PROBLEM_DIALOG_HELP_HUB_DIALOG_LINK,
    helpHubLink: REPORT_PROBLEM_DIALOG_HELP_HUB_HELP_LINK,
  };
}

/** Peer deep-link for the surface you are not currently on. */
export function resolveReportProblemDialogHelpHubPeerLink(
  currentSurfaceId: ReportProblemDialogHelpHubSurfaceId,
): ReportProblemDialogHelpHubLink {
  if (currentSurfaceId === "report-problem-dialog") {
    return REPORT_PROBLEM_DIALOG_HELP_HUB_HELP_LINK;
  }

  return REPORT_PROBLEM_DIALOG_HELP_HUB_DIALOG_LINK;
}
