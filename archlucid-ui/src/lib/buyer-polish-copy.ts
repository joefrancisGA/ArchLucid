/**
 * Shared buyer-polished copy — import here instead of scattering literals across pages.
 */

export const BUYER_WORKSPACE_DISPLAY_NAME = "Claims Intake Workspace";

export const BUYER_EXAMPLE_WORKSPACE_TOOLTIP =
  "Claims Intake workspace — demonstration data for architecture review walkthroughs.";

export const BUYER_COMPARE_PAGE_TITLE = "Advanced review comparison";

export const BUYER_COMPARE_MANIFEST_DIFF_APPENDIX_LABEL = "Review change details";

export const BUYER_COMPARE_CHANGE_REVIEWS_SUMMARY = "Change compared reviews";

export const BUYER_HOME_SAMPLE_PACKAGE_SUBTITLE =
  "Completed architecture review package with signed manifest, evidence trail, and audit record.";

export const BUYER_HOME_SAMPLE_PACKAGE_LEAD =
  "Open the executive summary for board-ready outcomes, or explore the full review package including signed manifest, evidence trail, governance approval, and audit trail.";

export const BUYER_HOME_PRIMARY_CTA = "Open executive summary";

export const BUYER_HOME_SECONDARY_CTA = "View full review package";

export const BUYER_HOME_SETUP_SECTION_HEADING = "Start a new review";

export const BUYER_RUNS_DASHBOARD_RECENT_LABEL = "Featured finalized review package";

export const BUYER_RUNS_DASHBOARD_RECENT_SUMMARY =
  "Featured finalized review package: signed manifest, evidence trail, governance approval, and audit trail complete.";

export const BUYER_COMPARE_TECHNICAL_APPENDIX_LABEL = "Detailed comparison appendix";

export const BUYER_SEALED_MANIFEST_TOOLTIP =
  "Finalized signed manifest: hash-verified, write-locked record after governance approval — not informal draft text.";

export const BUYER_PRICING_FAIR_USE_OVERAGE_NOTE = "Higher volumes are handled through procurement terms.";

export const BUYER_GOVERNANCE_CHANGE_MANAGEMENT_FOOTNOTE =
  "Production execution remains controlled by the customer's enterprise change-management process.";

export const BUYER_GOVERNANCE_APPROVAL_RECORD_LEAD =
  "Governance decision record — approved as architecture decision record with monitored PHI minimization control.";

export const BUYER_GOVERNANCE_GOVERNED_USE_SCOPE =
  "Approved for implementation planning, subject to enterprise change control — not a production deployment authorization.";

export const BUYER_ASK_PAGE_TITLE = "Evidence-backed review questions";

export const BUYER_GOVERNANCE_PAGE_TITLE = "Governance decision record";

export const BUYER_GOVERNANCE_FINDINGS_PAGE_TITLE = "Review records and dispositions";

export const BUYER_GOVERNANCE_FINDINGS_PAGE_LEAD =
  "Architecture risks across reviews — disposition, owner, and evidence links.";

export const BUYER_GOVERNANCE_FINDINGS_RISKS_SECTION_TITLE = "Monitored risks";

export const BUYER_GOVERNANCE_DECISION_REGISTER_TITLE = "Decision register";

export const BUYER_GOVERNANCE_DECISION_REGISTER_LEAD =
  "Signed decisions across reviews — category, supporting findings, and lineage.";

export const BUYER_GOVERNANCE_FINDINGS_VIEW_OBSERVATION_CTA = "View finding and evidence";

export const BUYER_GOVERNANCE_FINDINGS_VIEW_EVIDENCE_TRAIL_CTA = "View evidence trail";

export const BUYER_ASK_GROUNDING_ONCE =
  "Answers are scoped to selected review evidence. Validate conclusions against the finalized signed manifest — Ask does not replace formal governance records.";

export const BUYER_ASK_SHOWCASE_ANCHORS_LINE =
  "On the Claims Intake review package, replies include quick links to executive summary, manifest, policy basis, evidence trail, and audit anchors where available.";

export const BUYER_COMPARE_SECONDARY_PAGE_LEAD =
  "Load a prior vs. later review pair to see an explicit delta between signed decision records.";

export const BUYER_REVIEW_MONITORED_RISK_COUNT_CLARIFIER =
  "The monitored PHI risk is counted among findings but does not block approval — it remains under active oversight.";

export const BUYER_MANIFEST_BUNDLE_DOWNLOAD_DETAILS_SUMMARY = "Download finalized review package";

export const BUYER_MANIFEST_BUNDLE_DOWNLOAD_ZIP_NOTE = "Delivered as a ZIP archive for diligence and archiving.";

export const BUYER_PRICING_ARCHITECTURE_PROOF_ENGINE_CLAUSE =
  "for governed architecture review, evidence traceability, and audit-ready decision records";

export const BUYER_FINDINGS_COUNT_WITH_MONITORED_RISK = (findingCount: number, warningCount: number): string => {
  const findingsWord = findingCount === 1 ? "finding" : "findings";
  const riskWord = warningCount === 1 ? "risk" : "risks";

  return `${findingCount} ${findingsWord}, including ${warningCount} monitored ${riskWord} under active review (non-blocking).`;
};

export const BUYER_COMPARE_OPEN_FULL_LINK_LABEL = "View review change comparison";

export const BUYER_MARKETING_PRICING_PAGE_INTRO =
  "Compare Team, Professional, and Enterprise packaging. Professional is the typical procurement path; detailed terms and diligence artifacts are finalized through your vendor review process.";

/** Sales-led V1: no self-serve checkout; quote and order form finalize commercial terms. */
export const BUYER_SALES_LED_V1_PRICING_NOTE =
  "V1 is sold through guided evaluation and procurement — request a quote for packaging, fair-use limits, and diligence artifacts. List tiers illustrate scope; they are not a live marketplace checkout.";

/** Outcome-led value proposition for marketing/demo surfaces (one problem, one proof package). */
export const BUYER_OUTCOME_LED_VALUE_PROPOSITION =
  "Cut architecture review cycle time with an evidence-backed proof package — signed manifest, findings, audit trail, and sponsor-ready readout — not a chat transcript.";

export const BUYER_ASK_UNSTRUCTURED_EXECUTIVE_FALLBACK_LEAD =
  "The answer below is scoped to this review package's indexed evidence.";

/** Residual-risk monitoring metadata for the Claims Intake showcase package. */
export const BUYER_SHOWCASE_RESIDUAL_RISK_OWNER = "Taylor Morgan (Request owner)";

export const BUYER_SHOWCASE_RESIDUAL_RISK_MONITORING_CADENCE = "Weekly exception-volume sampling";

export const BUYER_SHOWCASE_RESIDUAL_RISK_NEXT_REVIEW = "2026-02-14";

export const BUYER_SHOWCASE_APPROVER_ROLE = "Architecture approver";

export const BUYER_SHOWCASE_REQUEST_OWNER_ROLE = "Request owner";

export const BUYER_SHOWCASE_POLICY_PACK_LABEL = "Healthcare Claims Policy Pack v3.4.1";

export const BUYER_SHOWCASE_APPROVAL_UTC = "2026-01-14T22:05:00.000Z";

/** Post-approval finding lead when the parent package is finalized. */
export const BUYER_FINDING_POST_APPROVAL_LEAD =
  "Residual PHI minimization risk accepted with monitoring as part of the finalized Claims Intake review package.";

export const BUYER_FINDING_POST_APPROVAL_VALIDATION =
  "Recorded acceptance: ingress classification validated, adapter boundaries bounded, OCR bypass monitoring active, and weekly exception-volume review assigned to the residual-risk owner.";

export const BUYER_AUDIT_TIMELINE_INTRO = "Recorded timeline for this review package.";

export const BUYER_AUDIT_TRAIL_COMPLETE_HEADING = "Audit trail complete";

export const BUYER_AUDIT_SYSTEM_EVENTS_EXPLANATION =
  "System-recorded events capture automated lifecycle steps.";

export const BUYER_AUDIT_DOWNLOAD_CTA = "Download governance evidence package";

export const BUYER_VIEWING_AS_DEMO_ROLE = "Role: Architecture reviewer";

export const BUYER_SCOPE_SAMPLE_WORKSPACE_LABEL = "Sample workspace";

export const BUYER_APPROVED_WITH_MONITORING_DEFINITION =
  "Approved for implementation planning; one residual risk accepted with active monitoring; no blocking issues.";

export const BUYER_FINDING_EVALUATION_CONFIDENCE_EXPLANATION =
  "Finding evaluation confidence — how strongly cited policy rules and evidence support this specific finding (not overall product accuracy).";

export const BUYER_GRAPH_WHAT_THIS_PROVES =
  "A reviewer can trace the accepted PHI minimization risk from source context through policy basis, decision, approval, signed manifest, and audit record.";

export const BUYER_GRAPH_FILTER_SUMMARY = "Filter by evidence type, decision, or risk";

export const BUYER_RUNS_DASHBOARD_SECTION_HEADING = "Review packages";

export const BUYER_RUNS_DASHBOARD_TAB_APPROVED = "Approved";

export const BUYER_RUNS_DASHBOARD_TAB_UNDER_MONITORING = "Approved with monitoring";

export const BUYER_RUNS_DASHBOARD_TAB_NEEDS_ATTENTION = "Needs attention";

export const BUYER_ASK_INPUT_PLACEHOLDER = "Ask about this review package…";

export const BUYER_ASK_GROUNDING_SOURCES_LABEL = "cited evidence";

export const BUYER_SIGNED_DECISION_RECORD_LABEL = "Signed decision record";

export const BUYER_MANIFEST_SECTION_DECISION = "Decision";

export const BUYER_MANIFEST_SECTION_EVIDENCE = "Evidence";

export const BUYER_MANIFEST_SECTION_DOWNLOADS = "Downloads";

export const BUYER_MANIFEST_SECTION_DILIGENCE = "Diligence";

export const BUYER_EXECUTIVE_BRIEFING_PACKAGE_LABEL = "Executive briefing package";

export const BUYER_ASK_GROUNDING_PRIMARY_SOURCE_LIMIT = 4;

export const BUYER_TECHNICAL_APPENDIX_LABEL = "Technical appendix";

export const BUYER_DECISION_KEY_SUMMARY = "Decision key";
