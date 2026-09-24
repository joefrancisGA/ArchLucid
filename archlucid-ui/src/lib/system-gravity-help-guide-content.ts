import type { HelpMarkdownHeading } from "@/lib/help/help-markdown-headings";
import { ARCHITECTURES_LIST_PATH } from "@/lib/architecture/architecture-routes";
import { HELP_HUB_CANONICAL_PATH, HELP_TOPIC_BREADCRUMB_HUB_LABEL } from "@/lib/help/help-hub-evidence-copy";
import {
  WORKING_CAREER_DOOR_LABEL,
  WORKING_REHEARSAL_DOOR_LABEL,
} from "@/lib/governance/working-career-rehearsal-door-copy";
import { inAppHelpHref } from "@/lib/product-documentation-registry";
import { SYSTEM_GRAVITY_HELP_PATH, SYSTEM_GRAVITY_HELP_SLUG } from "@/lib/system-gravity-help-route";

/** SG-107 — help: architecture desk vs nested review inspector on Working (Record/Practice per ADR 0097). */
export { SYSTEM_GRAVITY_HELP_SLUG };

export const SYSTEM_GRAVITY_HELP_TITLE = "System gravity" as const;

export const SYSTEM_GRAVITY_HELP_TOPIC_LABEL = "System gravity" as const;

export const SYSTEM_GRAVITY_HELP_PAGE_SUBTITLE =
  "Working instrument after desk lock — architecture desk vs nested review workspace." as const;

export const SYSTEM_GRAVITY_HELP_CLAIM_DISCIPLINE =
  "On Working, the architecture desk is Home — nested review routes are inspectors, not a second Home." as const;

export const SYSTEM_GRAVITY_HELP_CLAIM_HEADING_ID = "help-system-gravity-claim-discipline" as const;

export const SYSTEM_GRAVITY_HELP_OVERVIEW =
  "On Working, the named architecture is the instrument after desk lock — not the nested review inspector. Sketch a change is Practice; Record what-if is the capped Record path. Guided and demo sessions keep peer review URLs and the evaluator stepper." as const;

export type SystemGravityHelpDeskHomeDefinition = {
  readonly term: string;
  readonly definition: string;
};

export const SYSTEM_GRAVITY_HELP_DESK_HOME_DEFINITIONS: readonly SystemGravityHelpDeskHomeDefinition[] = [
  {
    term: "Architecture desk",
    definition: "The durable object you reopen with Alt+R — Monday-morning Home on Working.",
  },
  {
    term: "Nested review",
    definition:
      "A child architecture package review under the open architecture identity — findings, finalize, and wait chrome live here.",
  },
  {
    term: "Inspector",
    definition: "Review-detail chrome for package context — not exile from the architecture desk.",
  },
] as const;

export const SYSTEM_GRAVITY_HELP_CONCEPT_TILES = [
  {
    id: "architecture-desk",
    title: "Architecture desk",
    body: "The durable object you open with Alt+R. Sketch a change and Record what-if are desk verbs on the architecture identity.",
  },
  {
    id: "nested-review",
    title: "Nested review",
    body: "Inspect findings and finalize on the nested review workspace without making that route your Working Home.",
  },
  {
    id: "inspector",
    title: "Inspector, not exile",
    body: "Desk lock does not hide the architecture desk. When the parent architecture identity is known, chrome and deep links prefer nested locators; unlinked reviews stay on honest peer URLs.",
  },
] as const;

export const SYSTEM_GRAVITY_HELP_APPLICABILITY_WORKING =
  "Working seats keep architecture desk gravity after desk lock. Alt+R and desk verbs resume the system; nested review tabs are child reviews." as const;

export const SYSTEM_GRAVITY_HELP_APPLICABILITY_GUIDED =
  "Guided, demo, and trial seats may keep evaluator steppers and peer review URLs that do not match Working desk gravity." as const;

export const SYSTEM_GRAVITY_HELP_RECORD_PRACTICE_BODY =
  `Sketch a change and Record what-if are desk verbs with ${WORKING_CAREER_DOOR_LABEL}/${WORKING_REHEARSAL_DOOR_LABEL} honesty. Practice sketches stay rehearsal-labeled; Record what-if is capped ${WORKING_CAREER_DOOR_LABEL} execute on the architecture identity.` as const;

export const SYSTEM_GRAVITY_HELP_ERROR_RECOVERY_HEADING = "When desk navigation fails" as const;

export const SYSTEM_GRAVITY_HELP_ERROR_RECOVERY = {
  ifItFails: "The architecture desk or nested review route could not load in the current workspace.",
  whatStaysIntact:
    "Sealed review records and audit trail entries remain on the server; desk lock state is unchanged until a successful navigation.",
  recover: `Use Alt+R to return to the architecture list, verify workspace scope, then reopen the nested review from the desk child list.`,
} as const;

export const SYSTEM_GRAVITY_HELP_ERROR_RECOVERY_ARCHITECTURE_LIST_LINK = {
  label: "Open architecture list",
  href: ARCHITECTURES_LIST_PATH,
} as const;

export type SystemGravityHelpKeyboardRow = {
  readonly keys: string;
  readonly action: string;
};

export const SYSTEM_GRAVITY_HELP_KEYBOARD_INTRO =
  "Working shortcuts below match docs/KEYBOARD_SHORTCUTS.md — Alt+R opens the architecture desk or portfolio, not the reviews inbox." as const;

export const SYSTEM_GRAVITY_HELP_KEYBOARD_ROWS: readonly SystemGravityHelpKeyboardRow[] = [
  {
    keys: "Alt+R",
    action: "Open architecture desk — last architecture or portfolio (not the reviews inbox).",
  },
  {
    keys: "Shift+?",
    action: "Open or close the keyboard shortcuts overlay (Escape closes).",
  },
] as const;

export const SYSTEM_GRAVITY_HELP_TECHNICAL_HEADING = "Technical reference" as const;

export const SYSTEM_GRAVITY_HELP_TECHNICAL_HEADING_ID = "help-system-gravity-technical" as const;

export const SYSTEM_GRAVITY_HELP_TECHNICAL_INTRO =
  "Route templates and identifiers for engineers reviewing Working desk gravity." as const;

export const SYSTEM_GRAVITY_HELP_TECHNICAL_IDENTIFIERS: readonly string[] = [
  "/architecture/architectures/{architectureId}",
  "/architecture/architectures/{architectureId}/reviews/{reviewId}",
  "ArchitectureId",
] as const;

export type SystemGravityHelpRelatedLink = {
  readonly label: string;
  readonly href: string;
  readonly architectureProductLineOnly?: boolean;
};

export const SYSTEM_GRAVITY_HELP_RELATED_TOPICS_HEADING_ID = "help-system-gravity-related-topics" as const;

export const SYSTEM_GRAVITY_HELP_RELATED_TOPICS_HEADING = "Related" as const;

export const SYSTEM_GRAVITY_HELP_RELATED_LINKS: readonly SystemGravityHelpRelatedLink[] = [
  { label: "Inhabit the architecture", href: inAppHelpHref("inhabit-the-architecture") },
  { label: "Sketch a change", href: inAppHelpHref("sketch-a-change") },
  { label: "Which mode am I in?", href: inAppHelpHref("which-mode-am-i-in") },
  { label: "Architecture desk help", href: inAppHelpHref("architecture-desk") },
  {
    label: "Open architecture list",
    href: ARCHITECTURES_LIST_PATH,
    architectureProductLineOnly: true,
  },
] as const;

export const SYSTEM_GRAVITY_HELP_HELP_RETURN = {
  label: HELP_TOPIC_BREADCRUMB_HUB_LABEL,
  href: HELP_HUB_CANONICAL_PATH,
} as const;

export const SYSTEM_GRAVITY_HELP_GUIDE_HEADINGS: readonly HelpMarkdownHeading[] = [
  { level: 2, id: "what-system-gravity-shows", title: "Architecture desk, nested review, and inspector" },
  { level: 2, id: "help-system-gravity-applicability", title: "Scope and seat applicability" },
  { level: 2, id: "help-system-gravity-record-practice", title: "Record vs Practice desk verbs" },
  { level: 2, id: "help-system-gravity-error-recovery", title: SYSTEM_GRAVITY_HELP_ERROR_RECOVERY_HEADING },
  { level: 2, id: "help-system-gravity-keyboard", title: "Keyboard shortcuts" },
  { level: 2, id: SYSTEM_GRAVITY_HELP_TECHNICAL_HEADING_ID, title: SYSTEM_GRAVITY_HELP_TECHNICAL_HEADING },
  { level: 2, id: SYSTEM_GRAVITY_HELP_RELATED_TOPICS_HEADING_ID, title: SYSTEM_GRAVITY_HELP_RELATED_TOPICS_HEADING },
] as const;

export const SYSTEM_GRAVITY_HELP_CANONICAL_PATH = SYSTEM_GRAVITY_HELP_PATH;
