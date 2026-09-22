import type { HelpMarkdownHeading } from "@/lib/help/help-markdown-headings";
import { CAREER_REHEARSAL_HELP_COMPARISON_ROWS } from "@/lib/career-rehearsal-help-guide-content";
import {
  WORKING_CAREER_DOOR_DETAIL,
  WORKING_CAREER_DOOR_LABEL,
  WORKING_REHEARSAL_DOOR_DETAIL,
  WORKING_REHEARSAL_DOOR_LABEL,
  PUBLIC_DEMO_RECORD_MODE_CHROME_REMINDER,
} from "@/lib/governance/working-career-rehearsal-door-copy";
import { resolveWorkingCareerRehearsalDoorChangeConfirmCopy } from "@/lib/governance/working-career-rehearsal-door-mid-review-confirm";
import {
  WORKING_CAREER_REHEARSAL_DOOR_SHORTCUT_KEY,
  WORKING_CAREER_REHEARSAL_DOOR_SHORTCUTS,
} from "@/lib/governance/working-career-rehearsal-door-shortcuts";
import { HELP_HUB_CANONICAL_PATH, HELP_TOPIC_BREADCRUMB_HUB_LABEL } from "@/lib/help/help-hub-evidence-copy";
import { INHABIT_ADR_0100_RELATIVE_PATH } from "@/lib/inhabit/inhabit-help-adr-inventory";
import {
  INHABIT_SKETCH_IS_PRACTICE_NOT_RECORD_BODY,
  INHABIT_SKETCH_IS_PRACTICE_NOT_RECORD_TITLE,
} from "@/lib/inhabit/inhabit-exploration-copy";
import { INHABIT_THE_ARCHITECTURE_HELP_CLAIM_HEADING_ID } from "@/lib/inhabit/inhabit-help-evidence-copy";
import { RECORD_PRACTICE_ADR_0097_RELATIVE_PATH } from "@/lib/record-practice-adr-inventory";
import { inAppHelpHref } from "@/lib/product-documentation-registry";
import { registryKeyToAriaKeyShortcuts } from "@/lib/shortcut-registry";
import { SYSTEM_GRAVITY_ADR_0098_RELATIVE_PATH } from "@/lib/system-gravity-adr-inventory";
import { SIMULATOR_REHEARSAL_GUIDED_WARNING } from "@/lib/governance/simulator-career-honesty";

export const INHABIT_THE_ARCHITECTURE_HELP_SLUG = "inhabit-the-architecture" as const;

export const INHABIT_THE_ARCHITECTURE_HELP_PATH = `/help/${INHABIT_THE_ARCHITECTURE_HELP_SLUG}` as const;

export const INHABIT_THE_ARCHITECTURE_HELP_PAGE_TITLE = "Inhabit the architecture" as const;

export const INHABIT_THE_ARCHITECTURE_HELP_PAGE_SUBTITLE =
  "Working orientation — the system is what you inhabit; the review is a child job; findings are the afternoon’s document." as const;

export const INHABIT_THE_ARCHITECTURE_HELP_OVERVIEW =
  "On Working, when an architecture is open, you inhabit that system for the afternoon. Nested findings are the document you disposition — not a pipeline step and not Monday’s reviews inbox. Nested review-detail stays a job inspector when you need manifest, timeline, or package context." as const;

export const INHABIT_THE_ARCHITECTURE_HELP_APPLICABILITY_WORKING =
  "Working seats show workspace density (Guided vs Working) and the Record / Practice review-type chooser while you inhabit an architecture. Host AgentExecution Mode (Simulator vs Real) appears as start and in-flight honesty — not as a third peer control." as const;

export const INHABIT_THE_ARCHITECTURE_HELP_APPLICABILITY_GUIDED =
  "Guided, demo, and trial seats keep teaching chrome and do not expose the full Working inhabit desk. Switch to Working when you need architecture-nested findings as the afternoon document." as const;

export const INHABIT_THE_ARCHITECTURE_HELP_APPLICABILITY_DEMO =
  PUBLIC_DEMO_RECORD_MODE_CHROME_REMINDER;

export const INHABIT_THE_ARCHITECTURE_HELP_SIMULATOR_HONESTY_TITLE = "Simulator is not sponsor proof" as const;

export const INHABIT_THE_ARCHITECTURE_HELP_SIMULATOR_HONESTY =
  `${SIMULATOR_REHEARSAL_GUIDED_WARNING} On the inhabited desk, Simulator output still dispositions on findings — but sealed-record-complete proof stays incomplete until Real execution is provisioned.`;

export const INHABIT_THE_ARCHITECTURE_HELP_SIMULATOR_STATUS_TAG = "Practice labeling required" as const;

/** IH-028 — workspace density + Record/Practice; host Mode is honesty only. */
export const INHABIT_THE_ARCHITECTURE_HELP_TWO_CONTROLS_BODY =
  "Working production chrome exposes two customer controls: workspace density (Guided vs Working) and execute gravity as Record or Practice. Host AgentExecution Mode (Simulator vs Real) appears only as start and in-flight honesty — not as a third peer chooser. Operator-experience modes are not the same as host Mode." as const;

/** IH-029 — why Record can start but finalize/export stays incomplete on Simulator. */
export const INHABIT_THE_ARCHITECTURE_HELP_RECORD_SIMULATOR_BODY =
  `${WORKING_CAREER_DOOR_LABEL} is the production proof door. When the host runs in Simulator, you can start and disposition on the architecture findings document, but sealed-record-complete proof and production exports stay incomplete until Real execution is provisioned for the workspace. That is host honesty — not “Record blocked,” and not a self-serve flip of host Mode in production docs. Next step is workspace Real when your operator provisions it.` as const;

/** IH-052 — Sketch a change is Practice on the inhabited desk. */
export const INHABIT_THE_ARCHITECTURE_HELP_SKETCH_PRACTICE_BODY = INHABIT_SKETCH_IS_PRACTICE_NOT_RECORD_BODY;

export const INHABIT_THE_ARCHITECTURE_HELP_SKETCH_PRACTICE_TITLE = INHABIT_SKETCH_IS_PRACTICE_NOT_RECORD_TITLE;

export const INHABIT_THE_ARCHITECTURE_HELP_PRACTICE_CANNOT_PROMOTE_TITLE =
  "Practice does not promote to Record" as const;

export const INHABIT_THE_ARCHITECTURE_HELP_PRACTICE_CANNOT_PROMOTE_BODY =
  `${WORKING_REHEARSAL_DOOR_LABEL} sketches and in-flight Practice runs stay practice-labeled on artifacts and exports. Finalize, sealing, and sponsor proof require an explicit ${WORKING_CAREER_DOOR_LABEL} review path with honest host Mode — switching the top-bar chooser mid-analysis does not rewrite an in-flight job into sealed-record proof.` as const;

export const INHABIT_THE_ARCHITECTURE_HELP_SEALING_PATH_HREF = inAppHelpHref("sealed-record-vs-decision-register");

export const INHABIT_THE_ARCHITECTURE_HELP_SEALING_PATH_BODY =
  `Sealed-record proof and the decision register are separate surfaces. When livelihood intent matters, disposition on the inhabited findings document must align with ${WORKING_CAREER_DOOR_LABEL} honesty, citation coverage, and the sealed-record path documented in Sealed record vs decision register.` as const;

export const INHABIT_THE_ARCHITECTURE_HELP_RECORD_PRACTICE_TOPIC_LABEL =
  "Record vs Practice on the Working desk" as const;

export const INHABIT_THE_ARCHITECTURE_HELP_RECORD_PRACTICE_TOPIC_HREF = inAppHelpHref("career-vs-rehearsal");

export type InhabitHelpConceptTile = {
  readonly id: string;
  readonly title: string;
  readonly body: string;
  readonly helpHref?: string;
  readonly sectionId?: string;
};

export const INHABIT_THE_ARCHITECTURE_HELP_CONCEPT_TILES: readonly InhabitHelpConceptTile[] = [
  {
    id: "architecture",
    title: "Architecture is home",
    body: "The H1 is the architecture display name. Child reviews are subtitles — not a second product and not exile from the desk.",
    helpHref: inAppHelpHref("architecture-desk"),
  },
  {
    id: "findings-document",
    title: "Findings are the afternoon document",
    body: "Disposition, transparency trail, quiet-engine honesty, and finalize verbs live on architecture-nested findings.",
    sectionId: "what-is-this-desk",
  },
  {
    id: "inspector",
    title: "Review-detail is an inspector",
    body: "Open the nested review when you need package or timeline context. Back returns to the architecture desk or nested findings.",
    helpHref: inAppHelpHref("system-gravity"),
  },
  {
    id: "doors",
    title: `${WORKING_CAREER_DOOR_LABEL} vs ${WORKING_REHEARSAL_DOOR_LABEL}`,
    body: `${WORKING_CAREER_DOOR_LABEL} is the production proof path. ${WORKING_REHEARSAL_DOOR_LABEL} stays practice-labeled — start chrome names that before spawn.`,
    helpHref: INHABIT_THE_ARCHITECTURE_HELP_RECORD_PRACTICE_TOPIC_HREF,
    sectionId: "record-vs-practice",
  },
] as const;

export const INHABIT_THE_ARCHITECTURE_HELP_COMPARISON_ROWS = CAREER_REHEARSAL_HELP_COMPARISON_ROWS;

const doorShortcut = WORKING_CAREER_REHEARSAL_DOOR_SHORTCUTS[0];

export const INHABIT_THE_ARCHITECTURE_HELP_KEYBOARD_SHORTCUT_BODY =
  doorShortcut === undefined
    ? "Open the keyboard shortcuts dialog (Shift+?) for review-type controls on Working."
    : `${registryKeyToAriaKeyShortcuts(WORKING_CAREER_REHEARSAL_DOOR_SHORTCUT_KEY)} cycles review type (${doorShortcut.label}) — ${doorShortcut.description.toLowerCase()}.`;

export const INHABIT_THE_ARCHITECTURE_HELP_MID_ANALYSIS_BODY = resolveWorkingCareerRehearsalDoorChangeConfirmCopy({
  currentDoor: "career",
  nextDoor: "rehearsal",
}).description;

export const INHABIT_THE_ARCHITECTURE_HELP_ADR_REFERENCES = [
  { id: "0100", path: INHABIT_ADR_0100_RELATIVE_PATH },
  { id: "0098", path: SYSTEM_GRAVITY_ADR_0098_RELATIVE_PATH },
  { id: "0097", path: RECORD_PRACTICE_ADR_0097_RELATIVE_PATH },
] as const;

export const INHABIT_THE_ARCHITECTURE_HELP_PRIMARY_ACTION = {
  label: "Open architecture desk help",
  href: inAppHelpHref("architecture-desk"),
  testId: "help-inhabit-the-architecture-open-desk-help",
} as const;

export const INHABIT_THE_ARCHITECTURE_HELP_SECURITY_TRUST_ACTION = {
  label: "Security & Trust help",
  href: inAppHelpHref("security-trust"),
  testId: "help-inhabit-the-architecture-open-security-trust",
} as const;

export type InhabitHelpRelatedLink = {
  readonly label: string;
  readonly href: string;
};

export const INHABIT_THE_ARCHITECTURE_HELP_RELATED_TOPICS_HEADING_ID =
  "help-inhabit-the-architecture-related-topics" as const;

export const INHABIT_THE_ARCHITECTURE_HELP_RELATED_TOPICS_HEADING = "Related topics" as const;

export const INHABIT_THE_ARCHITECTURE_HELP_RELATED_TOPICS: readonly InhabitHelpRelatedLink[] = [
  {
    label: INHABIT_THE_ARCHITECTURE_HELP_RECORD_PRACTICE_TOPIC_LABEL,
    href: INHABIT_THE_ARCHITECTURE_HELP_RECORD_PRACTICE_TOPIC_HREF,
  },
  { label: "Sketch a change (Practice)", href: inAppHelpHref("sketch-a-change") },
  { label: "System gravity (instrument vs inhabit)", href: inAppHelpHref("system-gravity") },
  { label: "Which mode am I in?", href: inAppHelpHref("which-mode-am-i-in") },
] as const;

export const INHABIT_THE_ARCHITECTURE_HELP_SOURCES_ACTIONS = [
  INHABIT_THE_ARCHITECTURE_HELP_PRIMARY_ACTION,
  {
    label: "Sealed record vs decision register",
    href: inAppHelpHref("sealed-record-vs-decision-register"),
  },
  {
    label: "Sketch a change (Practice)",
    href: inAppHelpHref("sketch-a-change"),
  },
  {
    label: "System gravity (instrument vs inhabit)",
    href: inAppHelpHref("system-gravity"),
  },
] as const;

export const INHABIT_THE_ARCHITECTURE_HELP_HELP_RETURN = {
  label: HELP_TOPIC_BREADCRUMB_HUB_LABEL,
  href: HELP_HUB_CANONICAL_PATH,
} as const;

export const INHABIT_THE_ARCHITECTURE_HELP_GUIDE_HEADINGS: readonly HelpMarkdownHeading[] = [
  { level: 2, id: "what-is-this-desk", title: "What is this desk?" },
  { level: 2, id: "help-inhabit-the-architecture-current-desk", title: "Your current desk context" },
  { level: 2, id: "help-inhabit-the-architecture-applicability", title: "Who sees the inhabit desk" },
  { level: 2, id: "two-controls-only", title: "Two controls only" },
  { level: 2, id: "record-vs-practice", title: "Record vs Practice" },
  { level: 2, id: INHABIT_THE_ARCHITECTURE_HELP_CLAIM_HEADING_ID, title: INHABIT_THE_ARCHITECTURE_HELP_SIMULATOR_HONESTY_TITLE },
  { level: 2, id: "record-simulator-incomplete", title: "Record on Simulator host" },
  { level: 2, id: "sketch-is-practice", title: INHABIT_THE_ARCHITECTURE_HELP_SKETCH_PRACTICE_TITLE },
  { level: 2, id: "practice-cannot-promote", title: INHABIT_THE_ARCHITECTURE_HELP_PRACTICE_CANNOT_PROMOTE_TITLE },
  { level: 2, id: "sealing-path", title: "Sealing path honesty" },
  { level: 2, id: "help-inhabit-the-architecture-technical-mapping", title: "Technical mapping and ADRs" },
  { level: 2, id: "help-inhabit-the-architecture-keyboard-shortcut", title: "Keyboard shortcut" },
  { level: 2, id: "help-inhabit-the-architecture-mid-analysis", title: "Mid-analysis review-type change" },
  { level: 2, id: "where-to-go-next", title: "Where to go next" },
  {
    level: 2,
    id: INHABIT_THE_ARCHITECTURE_HELP_RELATED_TOPICS_HEADING_ID,
    title: INHABIT_THE_ARCHITECTURE_HELP_RELATED_TOPICS_HEADING,
  },
] as const;

/** Drift guard — in-app help must not deep-link GitHub blob URLs. */
export const INHABIT_THE_ARCHITECTURE_HELP_FORBIDDEN_LINK_MARKERS = ["github.com", "/blob/"] as const;

/** User-facing copy must not resurrect deprecated Career/Rehearsal product labels (technical ids in mapping section only). */
export const INHABIT_THE_ARCHITECTURE_HELP_FORBIDDEN_USER_LABELS = [
  "Career blocked",
  "Career record",
  "rehearsal-stamped",
  "career exports",
] as const;

export const INHABIT_THE_ARCHITECTURE_HELP_TECHNICAL_MAPPING_INTRO =
  `Preference and API fields keep career and rehearsal identifiers while the UI shows ${WORKING_CAREER_DOOR_LABEL} and ${WORKING_REHEARSAL_DOOR_LABEL}. ${WORKING_CAREER_DOOR_DETAIL} ${WORKING_REHEARSAL_DOOR_DETAIL}` as const;
