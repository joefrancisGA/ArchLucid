/**
 * TB-2306 — Report a problem ≠ Support workspace vocabulary rail.
 *
 * Why two surfaces exist:
 * - Report a problem (`/help/report-a-problem`) orients operators on *support
 *   intake* — structured defect reporting with correlation identifiers and a
 *   next-business-day response commitment.
 * - Support workspace (`/administration/support`) is the *administrator support
 *   workspace* for contact workflows, redacted support bundles, and guided
 *   troubleshooting shortcuts.
 *
 * They stay separate because reading the intake help topic is not the same task
 * as gathering diagnostics in Administration → Support. Distinct from Report a
 * problem ≠ Audit trail (TB-2267).
 */

import { SETTINGS_SUPPORT_PATH } from "@/lib/settings-admin-route-paths";
import { SUPPORT_REPORT_PROBLEM_HELP_HREF } from "@/lib/support-workspace-present";
import type { PairwiseVocabularyRailModel } from "@/lib/vocabulary/create-pairwise-vocabulary-rail";

export type ReportProblemSupportWorkspaceSurfaceId =
  | "report-a-problem"
  | "support-workspace";

export type ReportProblemSupportWorkspaceLink = {
  readonly id: ReportProblemSupportWorkspaceSurfaceId;
  readonly label: string;
  readonly href: string;
  readonly whenToUse: string;
};

export type ReportProblemSupportWorkspaceVocabularyModel = {
  readonly heading: string;
  readonly whyTwo: string;
  readonly compactLine: string;
  readonly reportAProblemLink: ReportProblemSupportWorkspaceLink;
  readonly supportWorkspaceLink: ReportProblemSupportWorkspaceLink;
};

export const REPORT_PROBLEM_SUPPORT_WORKSPACE_HEADING =
  "Report a problem and Support workspace serve different purposes" as const;

export const REPORT_PROBLEM_SUPPORT_WORKSPACE_WHY_TWO =
  "Report a problem is the help topic for support intake — structured defect reporting with correlation identifiers and a next-business-day response commitment. Support workspace is Administration → Support for contact workflows, redacted support bundles, and guided troubleshooting. Reading intake guidance is not the same as gathering diagnostics in the support workspace." as const;

export const REPORT_PROBLEM_SUPPORT_WORKSPACE_COMPACT_LINE =
  "Report a problem is support intake help; Support workspace gathers bundles and contact paths." as const;

export const REPORT_PROBLEM_SUPPORT_WORKSPACE_REPORT_A_PROBLEM_LINK: ReportProblemSupportWorkspaceLink =
  {
    id: "report-a-problem",
    label: "Report a problem",
    href: SUPPORT_REPORT_PROBLEM_HELP_HREF,
    whenToUse:
      "Learn how structured support intake captures context and correlation identifiers.",
  };

export const REPORT_PROBLEM_SUPPORT_WORKSPACE_SUPPORT_LINK: ReportProblemSupportWorkspaceLink =
  {
    id: "support-workspace",
    label: "Support workspace",
    href: SETTINGS_SUPPORT_PATH,
    whenToUse:
      "Contact support, download a redacted support bundle, and follow troubleshooting shortcuts.",
  };

/** Pairwise model for Report a problem ↔ Support workspace (fixed routes). */
export function buildReportProblemSupportWorkspacePairwiseRail(): PairwiseVocabularyRailModel<ReportProblemSupportWorkspaceSurfaceId> {
  return {
    heading: REPORT_PROBLEM_SUPPORT_WORKSPACE_HEADING,
    whyTwo: REPORT_PROBLEM_SUPPORT_WORKSPACE_WHY_TWO,
    compactLine: REPORT_PROBLEM_SUPPORT_WORKSPACE_COMPACT_LINE,
    currentLink: REPORT_PROBLEM_SUPPORT_WORKSPACE_REPORT_A_PROBLEM_LINK,
    peerLink: REPORT_PROBLEM_SUPPORT_WORKSPACE_SUPPORT_LINK,
  };
}

/** Full vocabulary model (heading, why-two copy, and deep links). */
export function buildReportProblemSupportWorkspaceVocabulary(): ReportProblemSupportWorkspaceVocabularyModel {
  const rail = buildReportProblemSupportWorkspacePairwiseRail();

  return {
    heading: rail.heading,
    whyTwo: rail.whyTwo,
    compactLine: rail.compactLine,
    reportAProblemLink: rail.currentLink,
    supportWorkspaceLink: rail.peerLink,
  };
}

/** Peer deep-link for the surface you are not currently on. */
export function resolveReportProblemSupportWorkspacePeerLink(
  currentSurfaceId: ReportProblemSupportWorkspaceSurfaceId,
): ReportProblemSupportWorkspaceLink {
  if (currentSurfaceId === "report-a-problem") {
    return REPORT_PROBLEM_SUPPORT_WORKSPACE_SUPPORT_LINK;
  }

  return REPORT_PROBLEM_SUPPORT_WORKSPACE_REPORT_A_PROBLEM_LINK;
}
