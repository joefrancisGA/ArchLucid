import { CREATE_ARCHITECTURE_LABEL } from "@/lib/architecture/architecture-workflow-labels";
import { AZURE_REFERENCE_SAMPLE_GRAPH_CTA_LABEL } from "@/lib/empty-state-presets";

export const EVIDENCE_GRAPH_PAGE_TITLE = "Evidence graph";

export const EVIDENCE_GRAPH_PAGE_SUBTITLE =
  "Inspect how evidence connects to findings, decisions, approvals, and audit records.";

export const EVIDENCE_GRAPH_EMPTY_TITLE = "No completed reviews yet";

export const EVIDENCE_GRAPH_EMPTY_BODY =
  "Complete a review to generate an evidence graph, or open the sample graph to see how evidence relationships work.";

export const EVIDENCE_GRAPH_AWAITING_SELECTION_TITLE = "Select a review";

export const EVIDENCE_GRAPH_AWAITING_SELECTION_BODY =
  "Choose a completed review to visualize how evidence connects to findings, decisions, approvals, and audit records.";

export const EVIDENCE_GRAPH_IDLE_PREVIEW_TITLE = "What you'll see";

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
