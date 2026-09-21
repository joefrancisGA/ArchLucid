/** AS-082 — `/help/career-vs-rehearsal` Working desk Record vs Practice orientation (ADR 0086 / 0091 / 0097). */
import type { HelpMarkdownHeading } from "@/lib/help/help-markdown-headings";
import { ARCHITECTURE_SPINE_ADR_0086_RELATIVE_PATH } from "@/lib/architecture-spine-adr-inventory";
import { CAREER_GRAVITY_ADR_0091_RELATIVE_PATH } from "@/lib/career-gravity-adr-inventory";
import {
  WORKING_CAREER_DOOR_DETAIL,
  WORKING_CAREER_DOOR_LABEL,
  WORKING_REHEARSAL_DOOR_DETAIL,
  WORKING_REHEARSAL_DOOR_LABEL,
} from "@/lib/governance/working-career-rehearsal-door-copy";
import { resolveWorkingCareerRehearsalDoorChangeConfirmCopy } from "@/lib/governance/working-career-rehearsal-door-mid-review-confirm";
import {
  WORKING_CAREER_REHEARSAL_DOOR_SHORTCUT_KEY,
  WORKING_CAREER_REHEARSAL_DOOR_SHORTCUTS,
} from "@/lib/governance/working-career-rehearsal-door-shortcuts";
import {
  WORKING_CAREER_REHEARSAL_INTENT_LABELS,
} from "@/lib/governance/working-career-rehearsal-intent";
import { SIMULATOR_REHEARSAL_GUIDED_WARNING } from "@/lib/governance/simulator-career-honesty";
import { WORKING_CAREER_REHEARSAL_HELP_PATH } from "@/lib/governance/working-career-rehearsal-help-route";
import { HELP_HUB_CANONICAL_PATH, HELP_TOPIC_BREADCRUMB_HUB_LABEL } from "@/lib/help/help-hub-evidence-copy";
import { RECORD_PRACTICE_ADR_0097_RELATIVE_PATH } from "@/lib/record-practice-adr-inventory";
import { inAppHelpHref } from "@/lib/product-documentation-registry";
import { registryKeyToAriaKeyShortcuts } from "@/lib/shortcut-registry";
import { CAREER_REHEARSAL_HELP_CLAIM_HEADING_ID } from "@/lib/career-rehearsal-help-evidence-copy";

export const CAREER_REHEARSAL_HELP_PAGE_TITLE = "Record vs Practice on the Working desk" as const;

export const CAREER_REHEARSAL_HELP_PAGE_SUBTITLE =
  "Pick the review type that matches whether you are building sealed-record evidence or running a labeled practice session." as const;

export const CAREER_REHEARSAL_HELP_OVERVIEW =
  "The Working top bar exposes a labeled review-type chooser on Architecture Working seats. Record and Practice are product review types — they do not flip host execution mode by themselves." as const;

export const CAREER_REHEARSAL_HELP_APPLICABILITY_WORKING =
  "Working seats show the Record / Practice chooser in the top bar. Use it before you spawn or continue analysis when livelihood intent matters." as const;

export const CAREER_REHEARSAL_HELP_APPLICABILITY_GUIDED =
  "Guided, demo, and trial seats keep teaching chrome and do not show the Record / Practice chooser. Switch to Working when you need explicit review-type intent on the paying desk." as const;

export const CAREER_REHEARSAL_HELP_APPLICABILITY_SECURENOW =
  "The SecureNow (Security) product shell does not include Record / Practice review types — that Working execution intent applies to Architecture review workflows only." as const;

export type CareerRehearsalHelpDoorCard = {
  readonly doorId: "career" | "rehearsal";
  readonly title: string;
  readonly body: string;
};

export const CAREER_REHEARSAL_HELP_DOOR_CARDS: readonly CareerRehearsalHelpDoorCard[] = [
  {
    doorId: "career",
    title: WORKING_CAREER_REHEARSAL_INTENT_LABELS.career,
    body:
      "Use Record when you are building evidence for finalize, export, and sponsor review. Record-complete artifacts require Real execution and honest citation coverage.",
  },
  {
    doorId: "rehearsal",
    title: WORKING_CAREER_REHEARSAL_INTENT_LABELS.rehearsal,
    body:
      "Use Practice when you are rehearsing the flow, practicing objections, or validating UI behavior without claiming sponsor proof.",
  },
] as const;

export type CareerRehearsalHelpComparisonRow = {
  readonly aspect: string;
  readonly record: string;
  readonly practice: string;
};

export const CAREER_REHEARSAL_HELP_COMPARISON_ROWS: readonly CareerRehearsalHelpComparisonRow[] = [
  {
    aspect: "User label",
    record: WORKING_CAREER_DOOR_LABEL,
    practice: WORKING_REHEARSAL_DOOR_LABEL,
  },
  {
    aspect: "Technical id",
    record: "career",
    practice: "rehearsal",
  },
  {
    aspect: "Typical intent",
    record: WORKING_CAREER_DOOR_DETAIL,
    practice: WORKING_REHEARSAL_DOOR_DETAIL,
  },
  {
    aspect: "Sponsor proof",
    record: "Sealed-record path when live execute and citation coverage are honest.",
    practice: "Practice labeling on artifacts — not procurement proof.",
  },
  {
    aspect: "Host Mode flip",
    record: "No silent flip — chooser labels intent; host Mode stays honest.",
    practice: "Same — Practice does not rewrite host configuration.",
  },
] as const;

export const CAREER_REHEARSAL_HELP_SIMULATOR_HONESTY_TITLE = "Simulator is not sponsor proof" as const;

export const CAREER_REHEARSAL_HELP_SIMULATOR_HONESTY =
  `${SIMULATOR_REHEARSAL_GUIDED_WARNING} Simulator output is not sponsor proof and does not satisfy record-complete gates.`;

export const CAREER_REHEARSAL_HELP_SIMULATOR_STATUS_TAG = "Practice labeling required" as const;

const doorShortcut = WORKING_CAREER_REHEARSAL_DOOR_SHORTCUTS[0];

export const CAREER_REHEARSAL_HELP_KEYBOARD_SHORTCUT_BODY =
  doorShortcut === undefined
    ? "Open the keyboard shortcuts dialog (Shift+?) for review-type controls on Working."
    : `${registryKeyToAriaKeyShortcuts(WORKING_CAREER_REHEARSAL_DOOR_SHORTCUT_KEY)} cycles review type (${doorShortcut.label}) — ${doorShortcut.description.toLowerCase()}.`;

export const CAREER_REHEARSAL_HELP_MID_ANALYSIS_BODY = resolveWorkingCareerRehearsalDoorChangeConfirmCopy({
  currentDoor: "career",
  nextDoor: "rehearsal",
}).description;

export const CAREER_REHEARSAL_HELP_SIBLING_TOPIC_TITLE = "Sibling help topic" as const;

export const CAREER_REHEARSAL_HELP_SIBLING_TOPIC_BODY =
  "This page (`/help/career-vs-rehearsal`) orients Working operators on Record vs Practice for architecture reviews. The sibling topic Record and Practice (`/help/career-rehearsal-doors`) adds door tiles, Guided vs Working split, and SecureNow product-line omission in one walkthrough." as const;

export const CAREER_REHEARSAL_HELP_SIBLING_TOPIC_HREF = WORKING_CAREER_REHEARSAL_HELP_PATH;

export const CAREER_REHEARSAL_HELP_SIBLING_TOPIC_LABEL = "Record and Practice (door walkthrough)" as const;

export const CAREER_REHEARSAL_HELP_ADR_REFERENCES = [
  { id: "0086", path: ARCHITECTURE_SPINE_ADR_0086_RELATIVE_PATH },
  { id: "0091", path: CAREER_GRAVITY_ADR_0091_RELATIVE_PATH },
  { id: "0097", path: RECORD_PRACTICE_ADR_0097_RELATIVE_PATH },
] as const;

export const CAREER_REHEARSAL_HELP_PRIMARY_ACTION = {
  label: "Architecture desk help",
  href: inAppHelpHref("architecture-desk"),
  testId: "help-career-vs-rehearsal-open-desk-help",
} as const;

export const CAREER_REHEARSAL_HELP_SECURITY_TRUST_ACTION = {
  label: "Security & Trust help",
  href: inAppHelpHref("security-trust"),
  testId: "help-career-vs-rehearsal-open-security-trust",
} as const;

export type CareerRehearsalHelpRelatedLink = {
  readonly label: string;
  readonly href: string;
};

export const CAREER_REHEARSAL_HELP_RELATED_TOPICS_HEADING_ID = "help-career-vs-rehearsal-related-topics" as const;

export const CAREER_REHEARSAL_HELP_RELATED_TOPICS_HEADING = "Related topics" as const;

export const CAREER_REHEARSAL_HELP_RELATED_TOPICS: readonly CareerRehearsalHelpRelatedLink[] = [
  { label: CAREER_REHEARSAL_HELP_SIBLING_TOPIC_LABEL, href: CAREER_REHEARSAL_HELP_SIBLING_TOPIC_HREF },
  { label: "Which mode am I in?", href: inAppHelpHref("which-mode-am-i-in") },
  { label: "Work continues in the background", href: inAppHelpHref("background-wait") },
  { label: "Architecture desk — system, not job", href: inAppHelpHref("architecture-desk") },
] as const;

export const CAREER_REHEARSAL_HELP_HELP_RETURN = {
  label: HELP_TOPIC_BREADCRUMB_HUB_LABEL,
  href: HELP_HUB_CANONICAL_PATH,
} as const;

export const CAREER_REHEARSAL_HELP_GUIDE_HEADINGS: readonly HelpMarkdownHeading[] = [
  { level: 2, id: "help-career-vs-rehearsal-applicability", title: "Who sees the chooser" },
  { level: 2, id: "help-career-vs-rehearsal-comparison", title: "Record vs Practice" },
  { level: 2, id: "help-career-vs-rehearsal-technical-mapping", title: "Technical mapping and ADRs" },
  { level: 2, id: CAREER_REHEARSAL_HELP_CLAIM_HEADING_ID, title: CAREER_REHEARSAL_HELP_SIMULATOR_HONESTY_TITLE },
  { level: 2, id: "help-career-vs-rehearsal-keyboard-shortcut", title: "Keyboard shortcut" },
  { level: 2, id: "help-career-vs-rehearsal-mid-analysis", title: "Mid-analysis review-type change" },
  { level: 2, id: "help-career-vs-rehearsal-sibling-topic", title: CAREER_REHEARSAL_HELP_SIBLING_TOPIC_TITLE },
  { level: 2, id: "help-career-vs-rehearsal-where-to-go-next", title: "Where to go next" },
  {
    level: 2,
    id: CAREER_REHEARSAL_HELP_RELATED_TOPICS_HEADING_ID,
    title: CAREER_REHEARSAL_HELP_RELATED_TOPICS_HEADING,
  },
] as const;

/** Drift guard — in-app help must not deep-link GitHub blob URLs. */
export const CAREER_REHEARSAL_HELP_FORBIDDEN_LINK_MARKERS = ["github.com", "/blob/"] as const;
