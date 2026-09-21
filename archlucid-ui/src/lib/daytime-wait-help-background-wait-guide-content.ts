import type { HelpMarkdownHeading } from "@/lib/help/help-markdown-headings";
import { REVIEW_PIPELINE_OPEN_IN_FLIGHT_STRIP_LABEL } from "@/lib/review-execution-background-safety-copy";
import { DAYTIME_WAIT_WORKING_BACKGROUND_WAIT_HELPER } from "@/lib/daytime-wait-never-stay-on-page-working";
import {
  DAYTIME_WAIT_ADR_0096_RELATIVE_PATH,
  DAYTIME_WAIT_FORBIDDEN_RUN_PROGRESS_URL_FRAGMENT,
} from "@/lib/daytime-wait-adr-inventory";
import { DAYTIME_WAIT_FORBIDDEN_PERCENT_COMPLETE_PROPERTY } from "@/lib/daytime-wait-no-fake-percent-complete-ratchet";
import { buildCancelAbandonInFlightClarity } from "@/lib/operations/cancel-abandon-in-flight-clarity";
import type { OperationState } from "@/lib/operations/operation-state";
import { KEYBOARD_SHORTCUTS_OPEN_PARAM } from "@/lib/operator/keyboard-shortcuts-dialog-url";
import { KEYBOARD_SHORTCUTS_SECTION_PARAM } from "@/lib/operator/keyboard-shortcuts-section-url";
import {
  ARCHITECTURE_DESK_PAGE_SHORTCUTS,
  registryKeyToAriaKeyShortcuts,
} from "@/lib/shortcut-registry";
import { inAppHelpHref } from "@/lib/product-documentation-registry";
import { HELP_HUB_CANONICAL_PATH, HELP_TOPIC_BREADCRUMB_HUB_LABEL } from "@/lib/help/help-hub-evidence-copy";
import { DAYTIME_WAIT_HELP_BACKGROUND_WAIT_PATH } from "@/lib/daytime-wait-help-background-wait-route";
import { REVIEW_PIPELINE_ENABLE_NOTIFICATIONS_LABEL } from "@/lib/review-execution-background-safety-copy";
import { LONG_OPERATION_HOME_PAGE_STATUS_HINT } from "@/lib/operations/long-operation-wait-copy";

/** DW-015 — help: background wait on Working (ADR 0096 / PC-08). */
export const DAYTIME_WAIT_HELP_BACKGROUND_WAIT_SLUG = "background-wait" as const;

export const DAYTIME_WAIT_HELP_BACKGROUND_WAIT_TITLE = "Work continues in the background" as const;

export const DAYTIME_WAIT_HELP_BACKGROUND_WAIT_PAGE_SUBTITLE =
  "Daytime wait on Working — resume from the shell in-flight strip, not a stay-on-this-page tab." as const;

export const DAYTIME_WAIT_HELP_BACKGROUND_WAIT_OVERVIEW_LEAD =
  "On Working seats, long-running analysis does not require babysitting one browser tab. Track named stages from the shell header, open Activity on the child review when you need package context, and use cooperative Cancel when you intend to stop — not when you only navigate away." as const;

/** Desk + review-detail helper (PC-08) — single source with SN-030 surfaces. */
export const DAYTIME_WAIT_HELP_BACKGROUND_WAIT_DESK_HELPER = DAYTIME_WAIT_WORKING_BACKGROUND_WAIT_HELPER;

export const DAYTIME_WAIT_HELP_BACKGROUND_WAIT_SEAT_APPLICABILITY_WORKING =
  "Working seats use background wait: the shell in-flight strip (header in-progress control) is the resume path across pages. Career Real execute follows the async operations pattern in ADR 0096 — poll GET /v1/operations/{operationId}, not a fictional run-progress URL." as const;

export const DAYTIME_WAIT_HELP_BACKGROUND_WAIT_SEAT_APPLICABILITY_GUIDED =
  "Guided, demo, and trial seats may still teach stay-on-this-page or buyer-polished wait chrome. That teaching copy does not apply to all-day Working production seats." as const;

export const DAYTIME_WAIT_HELP_BACKGROUND_WAIT_RESUME_PATH_INTRO =
  `Use the shell in-flight strip as your resume path: the header ${REVIEW_PIPELINE_OPEN_IN_FLIGHT_STRIP_LABEL.toLowerCase()} opens the in-progress popover with one row per tracked operation, named stage labels, and elapsed time. On a nested review, the in-pipeline banner offers the same ${REVIEW_PIPELINE_OPEN_IN_FLIGHT_STRIP_LABEL} control — it does not replace the shell strip.` as const;

export const DAYTIME_WAIT_HELP_BACKGROUND_WAIT_CANCEL_CLARITY =
  buildCancelAbandonInFlightClarity();

export type DaytimeWaitHelpBackgroundWaitOperationStateRow = {
  readonly state: OperationState;
  readonly meaning: string;
};

export const DAYTIME_WAIT_HELP_BACKGROUND_WAIT_OPERATION_STATE_ROWS: readonly DaytimeWaitHelpBackgroundWaitOperationStateRow[] =
  [
    { state: "Pending", meaning: "Accepted on the server; waiting to start or refresh in the strip." },
    { state: "Running", meaning: "Active work — stage label and elapsed time update in the shell strip." },
    { state: "CancelRequested", meaning: "Cancel was requested — cooperative stop may take a moment." },
    { state: "Succeeded", meaning: "Terminal success — open Activity or findings on the child review." },
    { state: "Failed", meaning: "Terminal failure — recovery copy on the review or strip; nothing was silently discarded." },
    { state: "Canceled", meaning: "Terminal cancel — server acknowledged stop; do not assume partial artifacts are sealed." },
  ] as const;

export const DAYTIME_WAIT_HELP_BACKGROUND_WAIT_NO_PERCENTAGE_BODY =
  `Working UI shows named lifecycle stages and elapsed time only — not an authoritative ${DAYTIME_WAIT_FORBIDDEN_PERCENT_COMPLETE_PROPERTY} bar. ${DAYTIME_WAIT_FORBIDDEN_RUN_PROGRESS_URL_FRAGMENT} does not exist; progress truth is the operations API and shell strip rows.` as const;

export const DAYTIME_WAIT_HELP_BACKGROUND_WAIT_COMPLETION_CHECK_BACK_BODY =
  `When analysis finishes, check back on the child review (Activity and findings), the shell in-flight strip until the row reaches a terminal state, and workspace home — ${LONG_OPERATION_HOME_PAGE_STATUS_HINT} Optional ${REVIEW_PIPELINE_ENABLE_NOTIFICATIONS_LABEL.toLowerCase()} may surface a browser toast when you are on another tab; ArchLucid does not promise email or push delivery for every completion.` as const;

const architectureDeskInFlightShortcut = ARCHITECTURE_DESK_PAGE_SHORTCUTS.find(
  (entry) => entry.label === "Resume in-flight",
);

export const DAYTIME_WAIT_HELP_BACKGROUND_WAIT_DESK_IN_FLIGHT_SHORTCUT =
  architectureDeskInFlightShortcut ?? null;

export const DAYTIME_WAIT_HELP_BACKGROUND_WAIT_KEYBOARD_SHORTCUTS_HREF =
  `${DAYTIME_WAIT_HELP_BACKGROUND_WAIT_PATH}?${KEYBOARD_SHORTCUTS_OPEN_PARAM}=1&${KEYBOARD_SHORTCUTS_SECTION_PARAM}=review` as const;

export const DAYTIME_WAIT_HELP_BACKGROUND_WAIT_KEYBOARD_SHORTCUTS_BODY =
  architectureDeskInFlightShortcut === undefined
    ? "Open the keyboard shortcuts dialog (Shift+?) and review the Review section for desk and review-detail shortcuts."
    : `On an architecture desk, ${registryKeyToAriaKeyShortcuts(architectureDeskInFlightShortcut.key)} (${architectureDeskInFlightShortcut.label}) ${architectureDeskInFlightShortcut.description.toLowerCase()}. Open the shortcuts dialog from any page for the full Review section map.` as const;

export const DAYTIME_WAIT_HELP_BACKGROUND_WAIT_ADR_0096_DOC_PATH = DAYTIME_WAIT_ADR_0096_RELATIVE_PATH;

export type DaytimeWaitHelpBackgroundWaitRelatedLink = {
  readonly label: string;
  readonly href: string;
};

export const DAYTIME_WAIT_HELP_BACKGROUND_WAIT_RELATED_TOPICS_HEADING_ID = "related-topics" as const;

export const DAYTIME_WAIT_HELP_BACKGROUND_WAIT_RELATED_TOPICS_HEADING = "Related topics" as const;

export const DAYTIME_WAIT_HELP_BACKGROUND_WAIT_RELATED_TOPICS: readonly DaytimeWaitHelpBackgroundWaitRelatedLink[] =
  [
    {
      label: "Record vs Practice on the Working desk",
      href: inAppHelpHref("career-vs-rehearsal"),
    },
    {
      label: "Proxy timeout vs Real execute",
      href: inAppHelpHref("proxy-timeout-real-execute"),
    },
    {
      label: "Architecture desk — system, not job",
      href: inAppHelpHref("architecture-desk"),
    },
    {
      label: "Which mode am I in?",
      href: inAppHelpHref("which-mode-am-i-in"),
    },
  ] as const;

export const DAYTIME_WAIT_HELP_BACKGROUND_WAIT_HELP_RETURN = {
  label: HELP_TOPIC_BREADCRUMB_HUB_LABEL,
  href: HELP_HUB_CANONICAL_PATH,
} as const;

export const DAYTIME_WAIT_HELP_BACKGROUND_WAIT_GUIDE_HEADINGS: readonly HelpMarkdownHeading[] = [
  { level: 2, id: "working-vs-guided-seats", title: "Working vs Guided seats" },
  { level: 2, id: "shell-in-flight-resume-path", title: "Shell in-flight strip (resume path)" },
  { level: 2, id: "wait-leave-or-stop", title: DAYTIME_WAIT_HELP_BACKGROUND_WAIT_CANCEL_CLARITY.heading },
  { level: 2, id: "named-stages-not-percentages", title: "Named stages, not percentages" },
  { level: 2, id: "when-analysis-finishes", title: "When analysis finishes" },
  { level: 2, id: "keyboard-shortcuts", title: "Keyboard shortcuts" },
  {
    level: 2,
    id: DAYTIME_WAIT_HELP_BACKGROUND_WAIT_RELATED_TOPICS_HEADING_ID,
    title: DAYTIME_WAIT_HELP_BACKGROUND_WAIT_RELATED_TOPICS_HEADING,
  },
] as const;

/** @deprecated Use {@link DAYTIME_WAIT_HELP_BACKGROUND_WAIT_OVERVIEW_LEAD} — kept for drift guards. */
export const DAYTIME_WAIT_HELP_BACKGROUND_WAIT_OVERVIEW = [
  DAYTIME_WAIT_HELP_BACKGROUND_WAIT_OVERVIEW_LEAD,
  DAYTIME_WAIT_HELP_BACKGROUND_WAIT_DESK_HELPER,
  DAYTIME_WAIT_HELP_BACKGROUND_WAIT_SEAT_APPLICABILITY_WORKING,
].join(" ");
