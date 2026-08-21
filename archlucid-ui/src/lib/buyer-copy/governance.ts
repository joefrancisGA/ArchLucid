/**
 * Governance workflow, findings, risk register, and exceptions copy.
 *
 * Re-exported by `./index.ts`; import from `@/lib/buyer/buyer-polish-copy` or `@/lib/buyer-copy`.
 */

import { CREATE_ARCHITECTURE_LABEL } from "@/lib/architecture/architecture-workflow-labels";
import { RISK_EXCEPTIONS_EMPTY_BODY, RISK_EXCEPTIONS_PAGE_SUBTITLE } from "@/lib/risk-exceptions-page";

export const BUYER_GOVERNANCE_CHANGE_MANAGEMENT_FOOTNOTE =
  "Production execution remains controlled by the customer's enterprise change-management process.";

export const BUYER_GOVERNANCE_APPROVAL_RECORD_LEAD =
  "Governance approval — sealed review record approved with monitored PHI minimization control.";

export const BUYER_GOVERNANCE_GOVERNED_USE_SCOPE =
  "Approved for implementation planning, subject to enterprise change control — not a production deployment authorization.";

export const BUYER_GOVERNANCE_PAGE_TITLE = "Governance workflow";

export const BUYER_GOVERNANCE_STATUS_BANNER_TITLE = "Governance approval record";

export const BUYER_GOVERNANCE_STATUS_BANNER_BODY =
  "Approved for planning use with monitored PHI minimization control. Production deployments remain controlled by enterprise change management.";

export const BUYER_GOVERNANCE_STATUS_BANNER_VIEW_APPROVAL = "View approval record";

export const BUYER_GOVERNANCE_STATUS_BANNER_VIEW_DISPOSITIONS = "View resolve outcomes";

export const BUYER_GOVERNANCE_STATUS_BANNER_VIEW_AUDIT = "View audit trail";

export const BUYER_GOVERNANCE_FINDINGS_PAGE_TITLE = "Findings";

export const BUYER_GOVERNANCE_FINDINGS_PAGE_LEAD =
  "Track architecture risks created from findings, waivers, exceptions, and governance decisions for this review.";

export const BUYER_RISK_REGISTER_EMPTY_TITLE = "No risks recorded for this review";

export const BUYER_RISK_REGISTER_EMPTY_BODY =
  "Risks appear here when accepted findings, waivers, exceptions, or governance decisions create follow-up risk items.";

export const BUYER_RISK_REGISTER_EMPTY_SECONDARY_ACTION = "View resolve outcomes";

export const BUYER_RISK_EXCEPTIONS_PAGE_TITLE = "Exceptions";

export const BUYER_RISK_EXCEPTIONS_PAGE_LEAD = RISK_EXCEPTIONS_PAGE_SUBTITLE;

export const BUYER_RISK_EXCEPTIONS_EMPTY_TITLE = "No active risk exceptions";

export const BUYER_RISK_EXCEPTIONS_EMPTY_BODY = RISK_EXCEPTIONS_EMPTY_BODY;

export const BUYER_RISK_EXCEPTIONS_EMPTY_TERTIARY_ACTION = CREATE_ARCHITECTURE_LABEL;

export const BUYER_GOVERNANCE_FINDINGS_RISKS_SECTION_TITLE = "Monitored risks";

export const BUYER_GOVERNANCE_DECISION_REGISTER_TITLE = "Decision register";

export const BUYER_GOVERNANCE_DECISION_REGISTER_LEAD =
  "Browse architecture decisions locked with each sealed review record — category, supporting findings, confidence, and lineage.";

export const BUYER_GOVERNANCE_FINDINGS_VIEW_OBSERVATION_CTA = "View finding and evidence";

export const BUYER_GOVERNANCE_FINDINGS_VIEW_EVIDENCE_TRAIL_CTA = "View evidence trail";

export const BUYER_REVIEW_MONITORED_RISK_COUNT_CLARIFIER =
  "The monitored PHI risk is counted among findings but does not block approval — it remains under active oversight.";

export const BUYER_FINDINGS_COUNT_WITH_MONITORED_RISK = (findingCount: number, warningCount: number): string => {
  const findingsWord = findingCount === 1 ? "finding" : "findings";
  const riskWord = warningCount === 1 ? "risk" : "risks";

  return `${findingCount} ${findingsWord}, including ${warningCount} monitored ${riskWord} under active review (non-blocking).`;
};

export const BUYER_APPROVED_WITH_MONITORING_DEFINITION =
  "Approved for implementation planning; one residual risk accepted with active monitoring; no blocking issues.";

export const BUYER_FINDING_EVALUATION_CONFIDENCE_EXPLANATION =
  "Finding evaluation confidence — how strongly cited policy rules and evidence support this specific finding (not overall product accuracy).";

export const BUYER_FINDING_SUMMARY_DECISION_IMPACT_LABEL = "Decision impact";

export const BUYER_FINDING_SUMMARY_NEXT_STEP_LABEL = "What to do next";

export const BUYER_GOVERNANCE_GOVERNED_USE_NOTES =
  "Official use record aligned with this architecture review.";

export const BUYER_GOVERNANCE_WORKFLOW_LIVE_INTRO =
  "Authorized roles submit approval requests, record decisions, and attach evidence before changes move to implementation planning.";

export const BUYER_GOVERNANCE_SEGREGATION_OF_DUTIES =
  "Requesters cannot approve their own reviews (segregation of duties).";

export const BUYER_GOVERNANCE_QUICK_APPROVE_LABEL = "Approve (no critical/high findings)";

export const BUYER_GOVERNANCE_FINDINGS_EMPTY = "Start from a review.";

export const BUYER_GOVERNANCE_WORKFLOW_CTA = "Open resolve outcomes";

export const BUYER_POLICY_PACK_LEAD =
  "This pack encodes PHI minimization, audit-friendly artifact retention, and segregation expectations for regulated intake paths.";
