/**
 * Shared buyer-polished copy — import here instead of scattering literals across pages.
 */

export const BUYER_EXAMPLE_WORKSPACE_TOOLTIP = "Example workspace using illustrative sample data only.";

export const BUYER_COMPARE_PAGE_TITLE = "Advanced review comparison";

export const BUYER_COMPARE_MANIFEST_DIFF_APPENDIX_LABEL = "Review change details";

export const BUYER_COMPARE_CHANGE_REVIEWS_SUMMARY = "Change compared reviews";

export const BUYER_HOME_SAMPLE_PACKAGE_SUBTITLE = "Example workspace using illustrative data.";

export const BUYER_HOME_SAMPLE_PACKAGE_LEAD =
  "Start at the executive summary, or open the full review package to explore signed manifest, evidence trail, governance approval, and audit trail.";

export const BUYER_RUNS_DASHBOARD_RECENT_LABEL = "Featured review package";

export const BUYER_RUNS_DASHBOARD_RECENT_SUMMARY =
  "One finalized review package is available: signed manifest, evidence trail, governance approval, and audit trail complete.";

export const BUYER_COMPARE_TECHNICAL_APPENDIX_LABEL = "Detailed comparison appendix";

export const BUYER_SEALED_MANIFEST_TOOLTIP =
  "Finalized signed manifest: hash-verified, write-locked record after governance approval — not informal draft text.";

export const BUYER_PRICING_FAIR_USE_OVERAGE_NOTE = "Higher volumes are handled through procurement terms.";

export const BUYER_GOVERNANCE_CHANGE_MANAGEMENT_FOOTNOTE =
  "Production execution remains controlled by the customer's enterprise change-management process.";

export const BUYER_GOVERNANCE_APPROVAL_RECORD_LEAD =
  "Governance approval record — approved for governed use with monitored PHI minimization control.";

export const BUYER_GOVERNANCE_GOVERNED_USE_SCOPE =
  "Approved as the governed architecture record for diligence, architecture review, and implementation planning.";

export const BUYER_GOVERNANCE_FINDINGS_PAGE_LEAD =
  "Review records and dispositions — monitored risks, recorded decisions, and follow-up monitors tied to the selected review package. Open a row for evidence and rationale.";

export const BUYER_GOVERNANCE_FINDINGS_RISKS_SECTION_TITLE = "Monitored risks and observations";

export const BUYER_GOVERNANCE_FINDINGS_VIEW_OBSERVATION_CTA = "View risk observation and evidence";

export const BUYER_GOVERNANCE_FINDINGS_VIEW_EVIDENCE_TRAIL_CTA = "View evidence trail";

export const BUYER_ASK_GROUNDING_ONCE =
  "Example answers are illustrative. In connected workspaces, answers are scoped to selected review evidence and source anchors.";

export const BUYER_ASK_SHOWCASE_ANCHORS_LINE =
  "On the Claims Intake sample review, replies include quick links to executive summary, manifest, policy basis, evidence trail, and audit anchors where available.";

export const BUYER_COMPARE_SECONDARY_PAGE_LEAD =
  "Advanced review comparison is a secondary diligence view. Start from the finalized review package, then load a prior vs later pair when you need an explicit delta.";

export const BUYER_REVIEW_MONITORED_RISK_COUNT_CLARIFIER =
  "The monitored risk is included in the findings count and is non-blocking.";

export const BUYER_MANIFEST_BUNDLE_DOWNLOAD_DETAILS_SUMMARY = "Download finalized review package";

export const BUYER_MANIFEST_BUNDLE_DOWNLOAD_ZIP_NOTE = "Delivered as a ZIP archive for diligence and archiving.";

export const BUYER_PRICING_ARCHITECTURE_PROOF_ENGINE_CLAUSE =
  "for governed architecture review, evidence traceability, and audit-ready decision records";

export const BUYER_FINDINGS_COUNT_WITH_MONITORED_RISK = (findingCount: number, warningCount: number): string => {
  const findingsWord = findingCount === 1 ? "finding" : "findings";
  const riskWord = warningCount === 1 ? "risk" : "risks";

  return `${findingCount} ${findingsWord}, including ${warningCount} non-blocking monitored ${riskWord}.`;
};

export const BUYER_COMPARE_OPEN_FULL_LINK_LABEL = "View review change comparison";

export const BUYER_MARKETING_PRICING_PAGE_INTRO =
  "Compare Team, Professional, and Enterprise packaging. Professional is the typical procurement path; detailed terms and diligence artifacts are finalized through your vendor review process.";

export const BUYER_ASK_UNSTRUCTURED_EXECUTIVE_FALLBACK_LEAD =
  "The answer below is scoped to this review package's indexed evidence.";
