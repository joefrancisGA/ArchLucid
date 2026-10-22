import type { HelpMarkdownHeading } from "@/lib/help/help-markdown-headings";
import { ARCHITECTURES_LIST_PATH } from "@/lib/architecture/architecture-routes";
import { HELP_HUB_CANONICAL_PATH, HELP_TOPIC_BREADCRUMB_HUB_LABEL } from "@/lib/help/help-hub-evidence-copy";
import { inAppHelpHref } from "@/lib/product-documentation-registry";
import {
  findShortcutByKey,
  registryKeyToAriaKeyShortcuts,
  SHELL_COMMAND_SHORTCUTS,
  resolveShortcutDescription,
} from "@/lib/shortcut-registry";
import {
  SYSTEM_NOT_JOB_WHAT_IF_COST_CAP_HEADING,
  SYSTEM_NOT_JOB_WHAT_IF_COST_CAP_NOT_BUDGET_PILL,
} from "@/lib/system-not-job-what-if-cost-cap-chrome";
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
    term: "Desk lock",
    definition:
      "The first time you open a named architecture on a Working seat, the shell pins that architecture identity as your resume target — Alt+R and desk verbs return here until you switch architectures.",
  },
  {
    term: "Architecture desk",
    definition:
      "The durable architecture identity you reopen with Alt+R — your Working Home after desk lock. Sketch a change and Record what-if are desk verbs on this identity.",
  },
  {
    term: "Nested review",
    definition:
      "A child architecture package review under the open architecture identity — findings, finalize, and background-wait surfaces live here without becoming your Working Home.",
  },
  {
    term: "Inspector",
    definition:
      "Review-detail surfaces for package context on a nested review — not a separate Home away from the architecture desk.",
  },
] as const;

export const SYSTEM_GRAVITY_HELP_APPLICABILITY_WORKING =
  "Working seats keep architecture desk gravity after desk lock. Alt+R and desk verbs resume the system; nested review tabs are child architecture package reviews." as const;

export const SYSTEM_GRAVITY_HELP_APPLICABILITY_GUIDED =
  "Guided, demo, and trial seats may keep evaluator steppers and peer review URLs that do not match Working desk gravity." as const;

export const SYSTEM_GRAVITY_HELP_RECORD_PRACTICE_HEADING = "Record vs Practice desk verbs" as const;

export const SYSTEM_GRAVITY_HELP_RECORD_PRACTICE_INTRO =
  "Sketch a change and Record what-if are desk verbs on the architecture identity with explicit review-type honesty." as const;

export const SYSTEM_GRAVITY_HELP_RECORD_PRACTICE_RECORD_EFFECTS =
  "What-if and finalize paths can create irreversible sealed review record artifacts and append audit trail events when execute and citation coverage stay honest." as const;

export const SYSTEM_GRAVITY_HELP_RECORD_PRACTICE_PRACTICE_EFFECTS =
  "Sketches stay rehearsal-labeled — they do not produce sealed review record exports or procurement proof by themselves." as const;

export const SYSTEM_GRAVITY_HELP_RECORD_WHAT_IF_CAP_BODY =
  `${SYSTEM_NOT_JOB_WHAT_IF_COST_CAP_NOT_BUDGET_PILL} ${SYSTEM_NOT_JOB_WHAT_IF_COST_CAP_HEADING} limits how many full-pipeline Record what-if branches you can open from one parent architecture draft.` as const;

export const SYSTEM_GRAVITY_HELP_RECORD_WHAT_IF_CAP_LINK = {
  label: "Sketch a change help",
  href: inAppHelpHref("sketch-a-change"),
} as const;

export const SYSTEM_GRAVITY_HELP_ERROR_RECOVERY_HEADING = "When desk navigation fails" as const;

export const SYSTEM_GRAVITY_HELP_ERROR_RECOVERY = {
  ifItFails: "The architecture desk or nested review route could not load in the current workspace.",
  whatStaysIntact:
    "Sealed review records and audit trail entries remain on the server; desk lock state is unchanged until a successful navigation.",
  recover:
    "Press Alt+R — Open architecture desk — last architecture or portfolio (not the reviews inbox). Verify workspace scope, then reopen the nested architecture package review from the desk child list when the parent architecture identity is known.",
} as const;

export const SYSTEM_GRAVITY_HELP_ERROR_RECOVERY_ARCHITECTURE_LIST_LINK = {
  label: "Open architecture list",
  href: ARCHITECTURES_LIST_PATH,
} as const;

export const SYSTEM_GRAVITY_HELP_ERROR_RECOVERY_LAST_ARCHITECTURE_LINK_LABEL =
  "Open last architecture desk" as const;

export type SystemGravityHelpRecoveryTrustLink = {
  readonly label: string;
  readonly href: string;
};

export const SYSTEM_GRAVITY_HELP_ERROR_RECOVERY_TRUST_LINKS: readonly SystemGravityHelpRecoveryTrustLink[] = [
  {
    label: "Sealed review record vs decision register",
    href: inAppHelpHref("sealed-record-vs-decision-register"),
  },
  { label: "Audit trail help", href: inAppHelpHref("audit-trail") },
] as const;

export type SystemGravityHelpKeyboardRow = {
  readonly keys: string;
  readonly action: string;
};

export const SYSTEM_GRAVITY_HELP_ALT_R_ACTION =
  "Open architecture desk — last architecture or portfolio (not the reviews inbox)." as const;

const shiftHelpShortcut = findShortcutByKey("shift+?");
const commandPaletteShortcut = SHELL_COMMAND_SHORTCUTS[0];
const altRShortcut = findShortcutByKey("alt+r");

export const SYSTEM_GRAVITY_HELP_KEYBOARD_INTRO =
  "Working shortcuts below match the in-app keyboard shortcuts overlay (Shift+?)." as const;

export const SYSTEM_GRAVITY_HELP_KEYBOARD_ROWS: readonly SystemGravityHelpKeyboardRow[] = [
  {
    keys: registryKeyToAriaKeyShortcuts("alt+r"),
    action:
      altRShortcut === undefined
        ? SYSTEM_GRAVITY_HELP_ALT_R_ACTION
        : `${resolveShortcutDescription(altRShortcut, true)}.`,
  },
  {
    keys: registryKeyToAriaKeyShortcuts("shift+?"),
    action:
      shiftHelpShortcut === undefined
        ? "Open or close the keyboard shortcuts overlay (Escape closes)."
        : `${shiftHelpShortcut.description}.`,
  },
  {
    keys: registryKeyToAriaKeyShortcuts(commandPaletteShortcut?.key ?? "ctrl+k"),
    action: commandPaletteShortcut?.description ?? "Open the command palette to jump to any page, review, or task.",
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
] as const;

export const SYSTEM_GRAVITY_HELP_HELP_RETURN = {
  label: HELP_TOPIC_BREADCRUMB_HUB_LABEL,
  href: HELP_HUB_CANONICAL_PATH,
} as const;

export const SYSTEM_GRAVITY_HELP_GUIDE_HEADINGS: readonly HelpMarkdownHeading[] = [
  { level: 2, id: "help-system-gravity-key-terms", title: "Key terms" },
  { level: 2, id: "help-system-gravity-error-recovery", title: SYSTEM_GRAVITY_HELP_ERROR_RECOVERY_HEADING },
  { level: 2, id: "help-system-gravity-applicability", title: "Scope and seat applicability" },
  { level: 2, id: "help-system-gravity-record-practice", title: SYSTEM_GRAVITY_HELP_RECORD_PRACTICE_HEADING },
  { level: 2, id: "help-system-gravity-keyboard", title: "Keyboard shortcuts" },
  { level: 2, id: SYSTEM_GRAVITY_HELP_TECHNICAL_HEADING_ID, title: SYSTEM_GRAVITY_HELP_TECHNICAL_HEADING },
  { level: 2, id: SYSTEM_GRAVITY_HELP_RELATED_TOPICS_HEADING_ID, title: SYSTEM_GRAVITY_HELP_RELATED_TOPICS_HEADING },
] as const;

export const SYSTEM_GRAVITY_HELP_CANONICAL_PATH = SYSTEM_GRAVITY_HELP_PATH;
