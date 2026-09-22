import type { HelpMarkdownHeading } from "@/lib/help/help-markdown-headings";
import { HELP_HUB_CANONICAL_PATH, HELP_TOPIC_BREADCRUMB_HUB_LABEL } from "@/lib/help/help-hub-evidence-copy";
import { inAppHelpHref } from "@/lib/product-documentation-registry";
import { SYSTEM_GRAVITY_ADR_0098_RELATIVE_PATH } from "@/lib/system-gravity-adr-inventory";
import { SYSTEM_GRAVITY_HELP_PATH, SYSTEM_GRAVITY_HELP_SLUG } from "@/lib/system-gravity-help-route";

/** SG-107 — help: system vs job vs inspector on Working (Record/Practice per ADR 0097). */
export { SYSTEM_GRAVITY_HELP_SLUG };

export const SYSTEM_GRAVITY_HELP_TITLE = "System gravity" as const;

export const SYSTEM_GRAVITY_HELP_TOPIC_LABEL = "System gravity" as const;

export const SYSTEM_GRAVITY_HELP_PAGE_SUBTITLE =
  "Working instrument after spawn — architecture desk vs nested review job (ADR 0098)." as const;

export const SYSTEM_GRAVITY_HELP_CLAIM_DISCIPLINE =
  "Nested review routes are job inspectors — not a second Home that replaces the architecture desk on Working." as const;

export const SYSTEM_GRAVITY_HELP_CLAIM_HEADING_ID = "help-system-gravity-claim-discipline" as const;

export const SYSTEM_GRAVITY_HELP_OVERVIEW =
  "On Working, the named architecture is the instrument after spawn — not the nested review inspector. The architecture desk is where you resume Monday morning. A nested review is a child job: findings, finalize, and wait chrome are verbs on that job, not a second Home. Sketch a change is Practice; Record what-if is the capped Career run. Guided and demo sessions keep peer review URLs and the evaluator stepper." as const;

export const SYSTEM_GRAVITY_HELP_CONCEPT_TILES = [
  {
    id: "system",
    title: "System (architecture desk)",
    body: "The durable object you open with Alt+R. Sketch a change and Record what-if are desk verbs on the architecture identity.",
  },
  {
    id: "job",
    title: "Job (nested review)",
    body: "A run nested under /architecture/architectures/{id}/reviews/{runId}. Inspect findings and finalize here without making this route your Working Home.",
  },
  {
    id: "inspector",
    title: "Inspector, not exile",
    body: "Spawn does not hide the desk. When ArchitectureId is known, chrome and deep links prefer nested locators; unlinked runs stay on honest peer URLs.",
  },
] as const;

export const SYSTEM_GRAVITY_HELP_APPLICABILITY_WORKING =
  "Working seats keep architecture desk gravity after spawn lock. Alt+R and desk verbs resume the system; nested review tabs are child jobs." as const;

export const SYSTEM_GRAVITY_HELP_APPLICABILITY_GUIDED =
  "Guided, demo, and trial seats may keep evaluator steppers and peer review URLs that do not match Working desk gravity." as const;

export const SYSTEM_GRAVITY_HELP_APPLICABILITY_SECURENOW =
  "SecureNow (Security) uses infrastructure and compliance workspaces — Architecture desk spawn gravity applies to Architecture product workflows only." as const;

export const SYSTEM_GRAVITY_HELP_RECORD_PRACTICE_BODY =
  "Sketch a change and Record what-if are desk verbs with Record/Practice honesty. Practice sketches stay rehearsal-labeled; Record what-if is capped career execute on the architecture identity." as const;

export const SYSTEM_GRAVITY_HELP_ERROR_RECOVERY_HEADING = "When spawn or desk navigation fails" as const;

export const SYSTEM_GRAVITY_HELP_ERROR_RECOVERY = {
  whatFailed: "The architecture desk or nested review route could not load in the current workspace.",
  whatIsIntact: "Committed reviews and sealed snapshots remain on the server; spawn lock state is unchanged until a successful navigation.",
  nextStep: "Use Alt+R to return to the architecture list or desk, verify workspace scope, then reopen the nested review from the desk child list.",
} as const;

export const SYSTEM_GRAVITY_HELP_KEYBOARD_BODY =
  "Alt+R focuses the architecture desk Home for the open architecture. Shift+? opens Review shortcuts for nested review and in-flight strip controls." as const;

export const SYSTEM_GRAVITY_HELP_TECHNICAL_BODY = `Technical reference: ${SYSTEM_GRAVITY_ADR_0098_RELATIVE_PATH}.` as const;

export type SystemGravityHelpRelatedLink = {
  readonly label: string;
  readonly href: string;
};

export const SYSTEM_GRAVITY_HELP_RELATED_TOPICS_HEADING_ID = "help-system-gravity-related-topics" as const;

export const SYSTEM_GRAVITY_HELP_RELATED_TOPICS_HEADING = "Related" as const;

export const SYSTEM_GRAVITY_HELP_RELATED_LINKS: readonly SystemGravityHelpRelatedLink[] = [
  { label: "Inhabit the architecture", href: inAppHelpHref("inhabit-the-architecture") },
  { label: "Sketch a change", href: inAppHelpHref("sketch-a-change") },
  { label: "Which mode am I in?", href: inAppHelpHref("which-mode-am-i-in") },
  { label: "Architecture desk", href: inAppHelpHref("architecture-desk") },
] as const;

export const SYSTEM_GRAVITY_HELP_HELP_RETURN = {
  label: HELP_TOPIC_BREADCRUMB_HUB_LABEL,
  href: HELP_HUB_CANONICAL_PATH,
} as const;

export const SYSTEM_GRAVITY_HELP_GUIDE_HEADINGS: readonly HelpMarkdownHeading[] = [
  { level: 2, id: SYSTEM_GRAVITY_HELP_CLAIM_HEADING_ID, title: "Desk gravity on Working" },
  { level: 2, id: "what-system-gravity-shows", title: "System, job, and inspector" },
  { level: 2, id: "help-system-gravity-applicability", title: "Scope and seat applicability" },
  { level: 2, id: "help-system-gravity-record-practice", title: "Record vs Practice desk verbs" },
  { level: 2, id: "help-system-gravity-error-recovery", title: SYSTEM_GRAVITY_HELP_ERROR_RECOVERY_HEADING },
  { level: 2, id: "help-system-gravity-keyboard", title: "Keyboard shortcuts" },
  { level: 2, id: "help-system-gravity-technical", title: "Technical reference" },
  { level: 2, id: SYSTEM_GRAVITY_HELP_RELATED_TOPICS_HEADING_ID, title: SYSTEM_GRAVITY_HELP_RELATED_TOPICS_HEADING },
] as const;

export const SYSTEM_GRAVITY_HELP_CANONICAL_PATH = SYSTEM_GRAVITY_HELP_PATH;
