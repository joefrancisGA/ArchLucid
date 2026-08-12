/**
 * TB-2267 — Report a problem ≠ Audit trail vocabulary rail.
 *
 * Why two surfaces exist:
 * - Report a problem (`/help/report-a-problem`) orients operators on *support
 *   intake* — structured defect reporting with correlation identifiers and a
 *   next-business-day response commitment.
 * - Audit trail (`/governance/audit`) is the *governance audit trail* for
 *   governance and review events (filters, integrity export/verify).
 *
 * They stay separate because opening support intake is not the same job as
 * searching the governance audit trail. Distinct from TB-2255 (Audit ≠
 * evidence trail surfaces).
 */

import { GOVERNANCE_AUDIT_PATH } from "@/lib/governance-route-paths";
import { SUPPORT_REPORT_PROBLEM_HELP_HREF } from "@/lib/support-workspace-present";

export type ReportProblemAuditSurfaceId = "report-problem" | "audit";

export type ReportProblemAuditLink = {
  readonly id: ReportProblemAuditSurfaceId;
  readonly label: string;
  readonly href: string;
  readonly whenToUse: string;
};

export type ReportProblemAuditVocabularyModel = {
  readonly heading: string;
  readonly whyTwo: string;
  readonly compactLine: string;
  readonly reportProblemLink: ReportProblemAuditLink;
  readonly auditLink: ReportProblemAuditLink;
};

export const REPORT_PROBLEM_AUDIT_HEADING =
  "Report a problem and Audit trail do different jobs" as const;

export const REPORT_PROBLEM_AUDIT_WHY_TWO =
  "Report a problem is support intake — structured defect reporting with correlation identifiers and a next-business-day response commitment. Audit trail is the governance audit trail for governance and review events. Opening support intake is not the same as searching the audit trail." as const;

export const REPORT_PROBLEM_AUDIT_COMPACT_LINE =
  "Report a problem is support intake; Audit trail is the governance audit trail — open the other when you need both." as const;

export const REPORT_PROBLEM_AUDIT_REPORT_PROBLEM_LINK: ReportProblemAuditLink = {
  id: "report-problem",
  label: "Report a problem",
  href: SUPPORT_REPORT_PROBLEM_HELP_HREF,
  whenToUse: "Learn how structured support intake captures context and correlation identifiers.",
};

export const REPORT_PROBLEM_AUDIT_AUDIT_LINK: ReportProblemAuditLink = {
  id: "audit",
  label: "Audit trail",
  href: GOVERNANCE_AUDIT_PATH,
  whenToUse: "Search and export the governance audit trail for governance and review events.",
};

/** Full vocabulary model (heading, why-two copy, and deep links). */
export function buildReportProblemAuditVocabulary(): ReportProblemAuditVocabularyModel {
  return {
    heading: REPORT_PROBLEM_AUDIT_HEADING,
    whyTwo: REPORT_PROBLEM_AUDIT_WHY_TWO,
    compactLine: REPORT_PROBLEM_AUDIT_COMPACT_LINE,
    reportProblemLink: REPORT_PROBLEM_AUDIT_REPORT_PROBLEM_LINK,
    auditLink: REPORT_PROBLEM_AUDIT_AUDIT_LINK,
  };
}

/** Peer deep-link for the surface you are not currently on. */
export function resolveReportProblemAuditPeerLink(
  currentSurfaceId: ReportProblemAuditSurfaceId,
): ReportProblemAuditLink {
  if (currentSurfaceId === "report-problem") {
    return REPORT_PROBLEM_AUDIT_AUDIT_LINK;
  }

  return REPORT_PROBLEM_AUDIT_REPORT_PROBLEM_LINK;
}
