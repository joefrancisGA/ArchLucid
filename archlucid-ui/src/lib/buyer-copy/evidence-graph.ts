/**
 * Evidence trail and evidence graph copy — buyer and operator graph surfaces.
 *
 * Re-exported by `./index.ts`; import from `@/lib/buyer/buyer-polish-copy` or `@/lib/buyer-copy`.
 */

export const BUYER_EVIDENCE_CHAIN_SOURCE_LINE =
  "Persisted evidence chain pointers for this finding (review record version, snapshots, and trace ids).";

export const BUYER_GRAPH_WHAT_THIS_PROVES =
  "Trace any accepted risk to its supporting evidence — from source context through policy basis, decision, approval, signed review record, and audit record.";

export const BUYER_GRAPH_TECHNICAL_CONTROLS_DISCLOSURE = "Graph options and filters";

export const BUYER_GRAPH_FILTER_SUMMARY = "Filter by evidence type, decision, or risk";

export const BUYER_EVIDENCE_TRAIL_PAGE_TITLE = "Evidence graph";

export const BUYER_EVIDENCE_TRAIL_PAGE_SUBTITLE =
  "Trace how evidence supports findings, decisions, approvals, and the final review.";

export const BUYER_EVIDENCE_TRAIL_LAYER_DISCLOSURE = "What is the evidence graph?";

export const BUYER_EVIDENCE_TRAIL_LAYER_DISCLOSURE_LEAD =
  "Use this page to trace review evidence — see how architecture inputs, findings, decisions, approvals, and audit records connect for a finalized review.";

export const BUYER_EVIDENCE_TRAIL_REVIEWS_LOAD_PLACEHOLDER = "Reviews unavailable";

export const BUYER_EVIDENCE_TRAIL_REVIEWS_LOAD_HINT =
  "Reviews could not be loaded right now. Start a new review or explore the illustrative Claims Intake sample graph (not your tenant data).";

export const BUYER_EVIDENCE_TRAIL_LOAD_BUTTON = "Load evidence graph";

export const BUYER_EVIDENCE_TRAIL_SAMPLE_BUTTON = "Open Claims Intake sample graph";

export const BUYER_EVIDENCE_TRAIL_OPEN_PACKAGE = "Open review";

export const BUYER_EVIDENCE_TRAIL_EMPTY_TITLE = "No review selected";

export const BUYER_EVIDENCE_TRAIL_EMPTY_BODY =
  "Choose a finalized review from your workspace, or explore the illustrative Claims Intake sample graph (not your tenant data).";

export const BUYER_EVIDENCE_TRAIL_NO_REVIEWS_TITLE = "No completed reviews yet";

export const BUYER_EVIDENCE_TRAIL_NO_REVIEWS_BODY =
  "Start a new review, or explore the illustrative Claims Intake sample graph (not your tenant data) to see how findings link to evidence, decisions, and audit records.";

export const BUYER_EVIDENCE_TRAIL_ERROR_HEADING = "Workspace data unavailable";

export const BUYER_EVIDENCE_TRAIL_ERROR_BODY =
  "ArchLucid could not load review data for this workspace.";

export const BUYER_EVIDENCE_TRAIL_ERROR_TRY_NEXT =
  "Try again, open troubleshooting, or explore the illustrative Claims Intake sample graph (not your tenant data) while you set up your first review.";

export const BUYER_EVIDENCE_TRAIL_VIEW_TRACE = "Trace table";

export const BUYER_EVIDENCE_TRAIL_VIEW_GRAPH = "Graph view";

export const BUYER_EVIDENCE_TRAIL_GRAPH_MODE_FINDING = "Evidence provenance";

export const BUYER_EVIDENCE_TRAIL_GRAPH_MODE_DECISION = "Decision traceability";

export const BUYER_EVIDENCE_TRAIL_GRAPH_MODE_ARCHITECTURE = "Architecture context";

export const BUYER_EVIDENCE_GRAPH_SAMPLE_BANNER_TITLE = "Claims Intake sample (not your workspace)";

export const BUYER_EVIDENCE_GRAPH_SAMPLE_BANNER_BODY =
  "This is the illustrative Healthcare Claims Intake demo package — not a review from your tenant. Use it to see how findings link to evidence, decisions, and audit records, then load one of your finalized reviews.";

/** Short link label for CTAs that open the showcase evidence graph (TB-1363). */
export const BUYER_EVIDENCE_GRAPH_SAMPLE_LINK_LABEL = "Claims Intake sample graph";

export const BUYER_EVIDENCE_GRAPH_USE_MY_REVIEW_CTA = "Use my review";

export const BUYER_EVIDENCE_GRAPH_UPLOAD_EVIDENCE_CTA = "Upload evidence";

export const BUYER_EVIDENCE_GRAPH_PICKER_LOADING = "Loading reviews…";

export const BUYER_EVIDENCE_GRAPH_PICKER_NO_PACKAGES =
  "No completed reviews in this workspace yet.";

export const BUYER_EVIDENCE_GRAPH_PICKER_NO_SELECTION = "Select a review to load its evidence graph.";

export const BUYER_EVIDENCE_GRAPH_PICKER_SAMPLE_REVIEW =
  "Showing Claims Intake sample (not your workspace)";

export const BUYER_EVIDENCE_GRAPH_PICKER_REAL_REVIEW = "Selected review";

export const BUYER_EVIDENCE_GRAPH_SYNTHETIC_SAMPLE_HINT = "Sample review";

export const BUYER_EVIDENCE_GRAPH_SYNTHETIC_LOAD_ERROR_HINT =
  "Reviews could not be loaded. Showing the Claims Intake sample (not your workspace).";

export const BUYER_EVIDENCE_GRAPH_EMPTY_LIST_PLACEHOLDER = "No completed reviews yet";

export const BUYER_EVIDENCE_GRAPH_EMPTY_LIST_HINT =
  "No completed reviews yet. Start a new review or open the Claims Intake sample graph (not your tenant data).";

export const BUYER_EVIDENCE_GRAPH_FIT_GRAPH_CTA = "Fit";

export const BUYER_EVIDENCE_GRAPH_ZOOM_100_CTA = "100%";

export const BUYER_EVIDENCE_GRAPH_RESET_VIEW_CTA = "Reset";

export const BUYER_EVIDENCE_GRAPH_TRACE_PATH_CTA = "Highlight path";

export const BUYER_EVIDENCE_GRAPH_SHOW_SELECTED_PATH_CTA = "Focus selection";

export const BUYER_EVIDENCE_GRAPH_SHOW_ALL_NODES_CTA = "Show all";

export const BUYER_EVIDENCE_GRAPH_SELECTED_NODE_PANEL_LABEL = "Selected graph node";

export const BUYER_EVIDENCE_GRAPH_OPEN_FINDING_DETAIL_CTA = "Open finding detail";

export const BUYER_EVIDENCE_GRAPH_OPEN_DECISION_RECORD_CTA = "Open decision";

export const BUYER_EVIDENCE_GRAPH_VIEW_EVIDENCE_CHAIN_CTA = "View evidence chain";

/** Opens the Trace table presentation (`presentation=trace`) — not a file download. */
export const BUYER_EVIDENCE_GRAPH_EXPORT_EVIDENCE_TRAIL_CTA = "Export trace table";

export const BUYER_GRAPH_PAGE_LEAD = BUYER_EVIDENCE_TRAIL_PAGE_SUBTITLE;

export const BUYER_GRAPH_LOAD_ERROR = BUYER_EVIDENCE_TRAIL_ERROR_BODY;

export const BUYER_GRAPH_IDLE_DESCRIPTION = BUYER_EVIDENCE_TRAIL_EMPTY_BODY;

/** Operator evidence graph page — IA pass (progressive disclosure, not buyer-polished shell). */
export const OPERATOR_GRAPH_PAGE_SUBTITLE =
  "Trace architecture inputs, findings, decisions, and audit records for a finalized review.";

export const OPERATOR_GRAPH_SCOPE_LABEL = "Graph scope";

export const OPERATOR_GRAPH_SELECT_REVIEW_FIRST_HINT = "Select a review first.";

export const OPERATOR_GRAPH_LOAD_ERROR_HEADING = "Graph could not be loaded";

export const OPERATOR_GRAPH_LOAD_ERROR_BODY =
  "ArchLucid could not load the evidence graph for this review.";

export const OPERATOR_GRAPH_LOAD_ERROR_TRY_NEXT =
  "Try retrying, or open the review to confirm it is finalized.";

export const OPERATOR_GRAPH_IDLE_TITLE = "No completed reviews yet";

export const OPERATOR_GRAPH_IDLE_BODY =
  "Create a review or open the Claims Intake sample graph (not your tenant workspace) to explore how evidence connects to findings and decisions.";

export const OPERATOR_GRAPH_WHAT_YOU_WILL_SEE =
  "The graph connects review inputs, evidence, policy references, findings, decisions, and signed review records.";

export const BUYER_FINDING_EVIDENCE_TRACE_LABEL = "Evidence trace";

export const BUYER_FINDING_SUPPORTING_EVIDENCE_TRACE = "Supporting evidence trace";

export const BUYER_GRAPH_GOVERNANCE_NEXT_APPROVED = "View governance workflow";

export const BUYER_GRAPH_GOVERNANCE_NEXT_PENDING = "Continue to governance approval";
