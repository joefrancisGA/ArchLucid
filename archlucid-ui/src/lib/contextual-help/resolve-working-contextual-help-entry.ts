import {
  ARCHITECTURES_LIST_PATH,
  ARCHITECTURES_NEW_PATH,
  REVIEWS_LIST_PATH,
  REVIEWS_NEW_PATH,
} from "@/lib/architecture/architecture-routes";
import { WORKING_NEW_REVIEW_LABEL } from "@/lib/architecture/architecture-workflow-labels";
import { ASK_REVIEW_QUESTIONS_PATH } from "@/lib/ask-review-questions-route";
import { COMPARE_CANONICAL_PATH } from "@/lib/compare-evidence-copy";
import type { PageContextualHelpAction, PageContextualHelpEntry } from "@/lib/contextual-help/types";
import { EVIDENCE_GRAPH_CANONICAL_PATH } from "@/lib/evidence-graph-evidence-copy";
import { WORKING_REVIEWS_INBOX_NAV_LABEL } from "@/lib/operator/operator-nav-labels";

const PEER_INSIGHTS_DESK_TOOL_HREFS: readonly string[] = [
  ASK_REVIEW_QUESTIONS_PATH,
  COMPARE_CANONICAL_PATH,
  EVIDENCE_GRAPH_CANONICAL_PATH,
];

const HELP_GETTING_STARTED_WORKING_ENTRY: PageContextualHelpEntry = {
  whatIsThisPage:
    "Getting started guide — how ArchLucid helps you work from named architecture identities through review jobs to export-ready outputs.",
  whatToDoNext:
    "Open an architecture identity, resume a child draft, inspect a package in Inbox, or start a new review when evidence is ready.",
  whyEmpty: "This guide is always available; review metrics appear after you create or finalize reviews.",
  whereToConfigurePrerequisite:
    "Choose a workspace in the header scope switcher before starting a real review job.",
  whatToDoNextAction: {
    label: WORKING_NEW_REVIEW_LABEL,
    href: ARCHITECTURES_NEW_PATH,
  },
  whereToConfigureAction: {
    label: WORKING_REVIEWS_INBOX_NAV_LABEL,
    href: REVIEWS_LIST_PATH,
  },
  taskSteps: [
    "Choose workspace scope in the header switcher.",
    "Open Architectures for named identity desks or Inbox for cross-architecture triage.",
    "Start a new review from the architecture desk when evidence is ready.",
  ],
};

function isPeerInsightsDeskToolHref(href: string): boolean {
  const trimmed = href.trim();

  return PEER_INSIGHTS_DESK_TOOL_HREFS.some(
    (peerHref) => trimmed === peerHref || trimmed.startsWith(`${peerHref}/`),
  );
}

/** SY-87 — remap peer review and bare Insights desk-tool hrefs for Working contextual help. */
export function resolveWorkingContextualHelpHref(href: string): string {
  const trimmed = href.trim();

  if (trimmed === REVIEWS_NEW_PATH) {
    return ARCHITECTURES_NEW_PATH;
  }

  if (isPeerInsightsDeskToolHref(trimmed)) {
    return ARCHITECTURES_LIST_PATH;
  }

  return trimmed;
}

function resolveWorkingContextualHelpAction(action: PageContextualHelpAction): PageContextualHelpAction {
  const href = resolveWorkingContextualHelpHref(action.href);
  let label = action.label;

  if (href === ARCHITECTURES_NEW_PATH && /start a review|start review|new review/i.test(label)) {
    label = WORKING_NEW_REVIEW_LABEL;
  }

  if (href === ARCHITECTURES_LIST_PATH && /compare|ask|graph|evidence graph/i.test(label)) {
    label = "Open architectures";
  }

  if (href === REVIEWS_LIST_PATH || /browse reviews/i.test(label)) {
    label = WORKING_REVIEWS_INBOX_NAV_LABEL;
  }

  return { href, label };
}

function patchWorkingContextualHelpCopy(text: string): string {
  return text
    .replace(/reviews hub/gi, WORKING_REVIEWS_INBOX_NAV_LABEL)
    .replace(/package hubs/gi, `${WORKING_REVIEWS_INBOX_NAV_LABEL} triage`)
    .replace(/Start a review/g, WORKING_NEW_REVIEW_LABEL);
}

function patchWorkingContextualHelpEntry(entry: PageContextualHelpEntry): PageContextualHelpEntry {
  return {
    ...entry,
    whatIsThisPage: patchWorkingContextualHelpCopy(entry.whatIsThisPage),
    whatToDoNext: patchWorkingContextualHelpCopy(entry.whatToDoNext),
    whyEmpty: entry.whyEmpty ? patchWorkingContextualHelpCopy(entry.whyEmpty) : undefined,
    whereToConfigurePrerequisite: entry.whereToConfigurePrerequisite
      ? patchWorkingContextualHelpCopy(entry.whereToConfigurePrerequisite)
      : undefined,
    whatToDoNextAction: entry.whatToDoNextAction
      ? resolveWorkingContextualHelpAction(entry.whatToDoNextAction)
      : undefined,
    whereToConfigureAction: entry.whereToConfigureAction
      ? resolveWorkingContextualHelpAction(entry.whereToConfigureAction)
      : undefined,
    taskSteps: entry.taskSteps?.map(patchWorkingContextualHelpCopy),
  };
}

/** SY-87 — Working contextual help uses architecture desk URLs, not peer review or bare Insights Home. */
export function resolveWorkingContextualHelpEntry(
  prefix: string,
  entry: PageContextualHelpEntry,
): PageContextualHelpEntry {
  if (prefix === "/help/getting-started") {
    return HELP_GETTING_STARTED_WORKING_ENTRY;
  }

  return patchWorkingContextualHelpEntry(entry);
}
