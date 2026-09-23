/** Working nested architecture tool chrome — resume, wayfinding, keyboard (ADR 0079 / AO-34). */

import { ASK_REVIEW_QUESTIONS_CLAIM_DISCIPLINE } from "@/lib/ask-review-questions-evidence-copy";
import { ARCHITECTURES_DRAFT_CLAIM_DISCIPLINE } from "@/lib/architectures-draft-evidence-copy";
import { COMPARE_CLAIM_DISCIPLINE } from "@/lib/compare-evidence-copy";
import { EVIDENCE_GRAPH_CLAIM_DISCIPLINE } from "@/lib/evidence-graph-evidence-copy";
import { IMPACT_PREVIEW_CLAIM_DISCIPLINE } from "@/lib/impact-preview-evidence-copy";
import { REVIEW_WORKSPACE_CLAIM_DISCIPLINE } from "@/lib/review-workspace-evidence-copy";
import { REVIEWS_NEW_CLAIM_DISCIPLINE } from "@/lib/reviews-new-evidence-copy";
import { SEARCH_REVIEW_EVIDENCE_CLAIM_DISCIPLINE } from "@/lib/search-review-evidence-evidence-copy";
import { SYSTEM_NOT_JOB_WORKING_NESTED_FINDINGS_CLAIM_DISCIPLINE } from "@/lib/system-not-job-findings-are-verbs-on-the-system";

export const WORKING_ARCHITECTURE_NESTED_BREADCRUMB_ARCHITECTURES_LABEL = "Architectures" as const;

export const WORKING_ARCHITECTURE_NESTED_BREADCRUMB_DESK_LABEL = "Architecture desk" as const;

export const WORKING_ARCHITECTURE_NESTED_ARCHITECTURE_SLUG_LABEL = "Architecture slug" as const;

export const WORKING_ARCHITECTURE_NESTED_KEYBOARD_HINT_BASE =
  "Ctrl+K jump · F1 shortcuts · Back to desk link above" as const;

export const WORKING_ARCHITECTURE_NESTED_RESUME_DRAFT_HEADING = "Continue open draft" as const;

export const WORKING_ARCHITECTURE_NESTED_RESUME_REVIEW_HEADING = "Continue in-progress review" as const;

export const WORKING_ARCHITECTURE_NESTED_RESUME_LOADING_LABEL = "Loading resume context" as const;

export const WORKING_ARCHITECTURE_NESTED_IDENTITY_LOADING_LABEL = "Loading architecture" as const;

export const WORKING_ARCHITECTURE_NESTED_IDENTITY_UNAVAILABLE_LABEL = "Architecture unavailable" as const;

export const WORKING_ARCHITECTURE_NESTED_PRIMARY_CONTENT_ID =
  "working-architecture-nested-primary-content" as const;

export const WORKING_ARCHITECTURE_NESTED_CONTEXT_STRIP_TEST_ID =
  "working-architecture-nested-tool-context-strip" as const;

export type WorkingArchitectureNestedToolLabel =
  | "Ask"
  | "Compare"
  | "Draft"
  | "Findings"
  | "Graph"
  | "Impact preview"
  | "Review"
  | "Start review"
  | "Search";

function toolLabelSlug(toolLabel: WorkingArchitectureNestedToolLabel): string {
  switch (toolLabel) {
    case "Ask":
      return "ask";
    case "Compare":
      return "compare";
    case "Draft":
      return "draft";
    case "Findings":
      return "findings";
    case "Graph":
      return "graph";
    case "Impact preview":
      return "impact-preview";
    case "Review":
      return "review";
    case "Start review":
      return "start-review";
    case "Search":
      return "search";
  }
}

export function workingArchitectureNestedDocumentTitleSuffix(
  toolLabel: WorkingArchitectureNestedToolLabel,
): string {
  return ` · ${toolLabel}`;
}

export function workingArchitectureNestedSkipLinkLabel(
  toolLabel: WorkingArchitectureNestedToolLabel,
): string {
  switch (toolLabel) {
    case "Ask":
      return "Skip to ask workspace";
    case "Compare":
      return "Skip to compare workspace";
    case "Draft":
      return "Skip to architecture draft workspace";
    case "Findings":
      return "Skip to findings list";
    case "Graph":
      return "Skip to evidence graph";
    case "Impact preview":
      return "Skip to impact preview workspace";
    case "Review":
      return "Skip to review workspace";
    case "Start review":
      return "Skip to start review intake";
    case "Search":
      return "Skip to search workspace";
  }
}

export function workingArchitectureNestedContextStrip(
  toolLabel: WorkingArchitectureNestedToolLabel,
): string {
  switch (toolLabel) {
    case "Ask":
      return "Resume grounded Q&A for this architecture — answers cite evidence from finalized reviews on this system.";
    case "Compare":
      return "Resume structured diffs between finalized reviews scoped to this architecture.";
    case "Draft":
      return "Resume drafting this architecture — saving here does not start a review.";
    case "Findings":
      return "Resume disposition work for this architecture — findings here are verbs on this system, not a cross-architecture register.";
    case "Graph":
      return "Resume evidence graph exploration for finalized reviews on this architecture.";
    case "Impact preview":
      return "Resume cheap what-if analysis against finalized baselines for this architecture.";
    case "Review":
      return "Resume this in-flight architecture review — findings, evidence, and finalize actions stay scoped to this package.";
    case "Start review":
      return "Start review intake for this architecture — capture context before evidence analysis begins.";
    case "Search":
      return "Resume evidence search across findings, decisions, and finalized review records on this architecture.";
  }
}

export function workingArchitectureNestedClaimDiscipline(
  toolLabel: WorkingArchitectureNestedToolLabel,
): string {
  switch (toolLabel) {
    case "Ask":
      return ASK_REVIEW_QUESTIONS_CLAIM_DISCIPLINE;
    case "Compare":
      return COMPARE_CLAIM_DISCIPLINE;
    case "Draft":
      return ARCHITECTURES_DRAFT_CLAIM_DISCIPLINE;
    case "Findings":
      return SYSTEM_NOT_JOB_WORKING_NESTED_FINDINGS_CLAIM_DISCIPLINE;
    case "Graph":
      return EVIDENCE_GRAPH_CLAIM_DISCIPLINE;
    case "Impact preview":
      return IMPACT_PREVIEW_CLAIM_DISCIPLINE;
    case "Review":
      return REVIEW_WORKSPACE_CLAIM_DISCIPLINE;
    case "Start review":
      return REVIEWS_NEW_CLAIM_DISCIPLINE;
    case "Search":
      return SEARCH_REVIEW_EVIDENCE_CLAIM_DISCIPLINE;
  }
}

export function workingArchitectureNestedClaimDisciplineTestId(
  toolLabel: WorkingArchitectureNestedToolLabel,
): string {
  return `working-architecture-nested-${toolLabelSlug(toolLabel)}-claim-discipline`;
}

export function workingArchitectureNestedKeyboardHint(
  toolLabel: WorkingArchitectureNestedToolLabel,
): string {
  switch (toolLabel) {
    case "Ask":
      return `Alt+A · ${WORKING_ARCHITECTURE_NESTED_KEYBOARD_HINT_BASE}`;
    case "Compare":
      return `Alt+C · ${WORKING_ARCHITECTURE_NESTED_KEYBOARD_HINT_BASE}`;
    case "Draft":
      return `Ctrl+Shift+S save draft · ${WORKING_ARCHITECTURE_NESTED_KEYBOARD_HINT_BASE}`;
    case "Findings":
      return `Alt+G · Alt+1–3 disposition · ${WORKING_ARCHITECTURE_NESTED_KEYBOARD_HINT_BASE}`;
    case "Graph":
      return `Alt+Y · ${WORKING_ARCHITECTURE_NESTED_KEYBOARD_HINT_BASE}`;
    case "Impact preview":
      return WORKING_ARCHITECTURE_NESTED_KEYBOARD_HINT_BASE;
    case "Review":
      return `Alt+C compare · Alt+1–3 findings tab · ${WORKING_ARCHITECTURE_NESTED_KEYBOARD_HINT_BASE}`;
    case "Start review":
      return `Alt+N · ${WORKING_ARCHITECTURE_NESTED_KEYBOARD_HINT_BASE}`;
    case "Search":
      return `/ search · ${WORKING_ARCHITECTURE_NESTED_KEYBOARD_HINT_BASE}`;
  }
}

/** @deprecated Prefer {@link workingArchitectureNestedKeyboardHint}. */
export const WORKING_ARCHITECTURE_NESTED_KEYBOARD_HINT = WORKING_ARCHITECTURE_NESTED_KEYBOARD_HINT_BASE;
