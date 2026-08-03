import { CREATE_ARCHITECTURE_LABEL } from "@/lib/architecture-workflow-labels";
import { AZURE_REFERENCE_SAMPLE_GRAPH_CTA_LABEL } from "@/lib/empty-state-presets";

export const EVIDENCE_GRAPH_PAGE_TITLE = "Evidence graph";

export const EVIDENCE_GRAPH_PAGE_SUBTITLE =
  "Inspect how evidence connects to findings, decisions, approvals, and audit records.";

export const EVIDENCE_GRAPH_BANNER_TITLE = "Review lifecycle";

export const EVIDENCE_GRAPH_BANNER_BODY = "Evidence trail for this review.";

export const EVIDENCE_GRAPH_VIEW_SIGNED_RECORD = "View signed review record";

export const EVIDENCE_GRAPH_VIEW_GOVERNANCE_APPROVAL = "View governance approval";

export const EVIDENCE_GRAPH_VIEW_AUDIT_TRAIL = "View audit trail";

export const EVIDENCE_GRAPH_TABS_HELPER =
  "Two views of the same evidence relationships — table or graph.";

export const EVIDENCE_GRAPH_EMPTY_TITLE = "No completed reviews yet";

export const EVIDENCE_GRAPH_EMPTY_BODY =
  "Complete a review to generate an evidence graph, or open the sample graph to see how evidence relationships work.";

export const EVIDENCE_GRAPH_AWAITING_SELECTION_TITLE = "Select a review";

export const EVIDENCE_GRAPH_AWAITING_SELECTION_BODY =
  "Choose a completed review to visualize how evidence connects to findings, decisions, approvals, and audit records.";

export const EVIDENCE_GRAPH_IDLE_PREVIEW_TITLE = "What you’ll see";

export const EVIDENCE_GRAPH_IDLE_PREVIEW_STEPS = [
  "Evidence",
  "Findings",
  "Decisions",
  "Approvals",
  "Audit trail",
] as const;

export const EVIDENCE_GRAPH_EMPTY_PRIMARY_ACTION = AZURE_REFERENCE_SAMPLE_GRAPH_CTA_LABEL;

export const EVIDENCE_GRAPH_EMPTY_SECONDARY_START = CREATE_ARCHITECTURE_LABEL;

export const EVIDENCE_GRAPH_EMPTY_SECONDARY_UPLOAD = "Upload evidence";
