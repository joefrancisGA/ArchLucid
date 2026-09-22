/** CE-019 / HEK — help: how to sketch a labeled change on the architecture desk. */
import type { HelpMarkdownHeading } from "@/lib/help/help-markdown-headings";
import {
  CHEAP_EXPLORATION_ADR_0092_RELATIVE_PATH,
  CHEAP_EXPLORATION_SKETCH_A_CHANGE_DESK_CTA_LABEL,
} from "@/lib/cheap-exploration-adr-inventory";
import { CHEAP_EXPLORATION_HELP_SKETCH_A_CHANGE_CLAIM_HEADING_ID } from "@/lib/cheap-exploration-help-sketch-a-change-evidence-copy";
import { CHEAP_EXPLORATION_HELP_IMPACT_PREVIEW_VS_ENVELOPE_PATH } from "@/lib/cheap-exploration-help-impact-preview-vs-envelope-route";
import {
  CHEAP_EXPLORATION_PALETTE_SKETCH_A_CHANGE_HANDLER,
  CHEAP_EXPLORATION_PALETTE_SKETCH_A_CHANGE_SEARCH_VALUE,
} from "@/lib/cheap-exploration-palette-sketch-a-change";
import {
  WORKING_CAREER_DOOR_LABEL,
  WORKING_REHEARSAL_DOOR_LABEL,
} from "@/lib/governance/working-career-rehearsal-door-copy";
import { HELP_HUB_CANONICAL_PATH, HELP_TOPIC_BREADCRUMB_HUB_LABEL } from "@/lib/help/help-hub-evidence-copy";
import { INHABIT_FINDINGS_COMPARE_HELPER } from "@/lib/inhabit/inhabit-exploration-copy";
import { MODE_GRAVITY_HELP_WHICH_MODE_PATH } from "@/lib/mode-gravity-help-route";
import { inAppHelpHref } from "@/lib/product-documentation-registry";
import { ARCHITECTURE_DESK_COMPARE_DISABLED_REASON } from "@/lib/system-not-job-compare-entry-from-desk";
import {
  SYSTEM_NOT_JOB_CLONE_FROM_SNAPSHOT_DESK_CTA_LABEL,
  SYSTEM_NOT_JOB_CLONE_FROM_SNAPSHOT_SPAWN_LOCK_DOM_TEST_ID,
  resolveSystemNotJobCloneFromSnapshotFullRunCostSentence,
} from "@/lib/system-not-job-clone-from-snapshot-entry";
import {
  SYSTEM_NOT_JOB_WHAT_IF_COST_CAP_HEADING,
  SYSTEM_NOT_JOB_WHAT_IF_COST_CAP_NOT_BUDGET_PILL,
  SYSTEM_NOT_JOB_WHAT_IF_COST_CAP_OVER_CAP_BLOCKED,
} from "@/lib/system-not-job-what-if-cost-cap-chrome";

export const CHEAP_EXPLORATION_HELP_SKETCH_A_CHANGE_SLUG = "sketch-a-change" as const;

export const CHEAP_EXPLORATION_HELP_SKETCH_A_CHANGE_TITLE = "Sketch a change" as const;

export const CHEAP_EXPLORATION_HELP_SKETCH_A_CHANGE_PAGE_SUBTITLE =
  "Working help — architecture desk cheap envelope after spawn lock (CE-019 / ADR 0092)." as const;

export const CHEAP_EXPLORATION_HELP_SKETCH_A_CHANGE_OVERVIEW_LEAD =
  "After spawn lock, use Sketch a change on the architecture desk to clone from the sealed snapshot into the next editable architecture draft. The sketch opens the legal successor under the same architecture — a labeled Practice envelope until you explicitly execute a Record review." as const;

/** @deprecated Use {@link CHEAP_EXPLORATION_HELP_SKETCH_A_CHANGE_OVERVIEW_LEAD} — kept for drift guards. */
export const CHEAP_EXPLORATION_HELP_SKETCH_A_CHANGE_OVERVIEW =
  CHEAP_EXPLORATION_HELP_SKETCH_A_CHANGE_OVERVIEW_LEAD;

export const CHEAP_EXPLORATION_HELP_SKETCH_A_CHANGE_PRACTICE_ENVELOPE_TITLE =
  `${CHEAP_EXPLORATION_SKETCH_A_CHANGE_DESK_CTA_LABEL} is ${WORKING_REHEARSAL_DOOR_LABEL}` as const;

export const CHEAP_EXPLORATION_HELP_SKETCH_A_CHANGE_PRACTICE_ENVELOPE_BODY =
  `${WORKING_REHEARSAL_DOOR_LABEL} sketches stay practice-labeled (stored token rehearsal) until you explicitly execute a ${WORKING_CAREER_DOOR_LABEL} review and finalize. A sketch is not sealed-record proof and cannot Compare as committed-manifest evidence until both sides are finalized signed packages.` as const;

export const CHEAP_EXPLORATION_HELP_SKETCH_A_CHANGE_PRACTICE_STATUS_TAG =
  "Practice labeling required" as const;

export const CHEAP_EXPLORATION_HELP_SKETCH_A_CHANGE_APPLICABILITY_WORKING =
  "Working Architecture seats show Sketch a change on the architecture desk after spawn lock — nested under the architecture object, not as a peer product from the reviews hub home. Command palette (Ctrl+K) exposes the same action when the spawn-lock clone CTA is live." as const;

export const CHEAP_EXPLORATION_HELP_SKETCH_A_CHANGE_APPLICABILITY_GUIDED =
  "Guided, demo, and trial seats may teach two-path onboarding with sample scope. Switch to Working when you need the spawn-lock clone CTA and honest branch-cap confirm on the paying desk." as const;

export const CHEAP_EXPLORATION_HELP_SKETCH_A_CHANGE_APPLICABILITY_SECURENOW =
  "The SecureNow (Security) product shell does not host Architecture Working cheap envelopes — this topic applies to Architecture review workflows and in-app Architecture help routes only." as const;

export const CHEAP_EXPLORATION_HELP_SKETCH_A_CHANGE_RECORD_PRACTICE_HEADING =
  "Record vs Practice on sketches" as const;

export const CHEAP_EXPLORATION_HELP_SKETCH_A_CHANGE_RECORD_PRACTICE_BODY =
  `Sketches default to ${WORKING_REHEARSAL_DOOR_LABEL} on spawn. Stored review-type tokens remain career and rehearsal while the UI shows ${WORKING_CAREER_DOOR_LABEL} and ${WORKING_REHEARSAL_DOOR_LABEL}. Finalize, sealing, and sponsor proof require an explicit ${WORKING_CAREER_DOOR_LABEL} path with honest host Mode — switching the top-bar chooser mid-analysis does not rewrite an in-flight sketch into sealed-record proof.` as const;

export type CheapExplorationHelpSketchAChangeDeskEntryRow = {
  readonly surface: string;
  readonly when: string;
  readonly detail: string;
};

export const CHEAP_EXPLORATION_HELP_SKETCH_A_CHANGE_DESK_ENTRY_ROWS: readonly CheapExplorationHelpSketchAChangeDeskEntryRow[] =
  [
    {
      surface: "Architecture desk CTA",
      when: "After spawn lock on the current architecture draft",
      detail: `${SYSTEM_NOT_JOB_CLONE_FROM_SNAPSHOT_DESK_CTA_LABEL} clones from the sealed snapshot (${SYSTEM_NOT_JOB_CLONE_FROM_SNAPSHOT_SPAWN_LOCK_DOM_TEST_ID}).`,
    },
    {
      surface: "Command palette",
      when: "Working desk with spawn-lock clone visible",
      detail: `${CHEAP_EXPLORATION_PALETTE_SKETCH_A_CHANGE_HANDLER.label} — search ${CHEAP_EXPLORATION_PALETTE_SKETCH_A_CHANGE_SEARCH_VALUE}. Guided eval without spawn lock never shows a dead palette row.`,
    },
    {
      surface: "Not this path",
      when: "Policy what-if on a finalized baseline",
      detail: `Use nested Impact preview — not ${CHEAP_EXPLORATION_SKETCH_A_CHANGE_DESK_CTA_LABEL}. See Impact preview vs architecture envelope.`,
    },
  ] as const;

export const CHEAP_EXPLORATION_HELP_SKETCH_A_CHANGE_DESK_ENTRY_HEADING =
  "Desk and command-palette entry" as const;

export const CHEAP_EXPLORATION_HELP_SKETCH_A_CHANGE_SEAL_COMPARE_HEADING =
  "Irreversible seal, branch cap, Compare, and no unseal" as const;

export const CHEAP_EXPLORATION_HELP_SKETCH_A_CHANGE_SEAL_COMPARE_INTRO =
  "Cheap envelope honesty reuses Working desk constants — parent seals stay immutable, branch quota gates full-pipeline what-if, and Compare stays committed-manifest only." as const;

export const CHEAP_EXPLORATION_HELP_SKETCH_A_CHANGE_SEAL_COMPARE_BULLETS: readonly string[] = [
  "Creates a new editable architecture draft under this architecture — the legal new version after spawn lock. The parent snapshot and linked review stay sealed.",
  "There is no unseal-to-sketch path — clone-from-snapshot is the sketch entry (ADR 0039 / CE-030).",
  SYSTEM_NOT_JOB_WHAT_IF_COST_CAP_HEADING,
  SYSTEM_NOT_JOB_WHAT_IF_COST_CAP_NOT_BUDGET_PILL,
  SYSTEM_NOT_JOB_WHAT_IF_COST_CAP_OVER_CAP_BLOCKED,
  resolveSystemNotJobCloneFromSnapshotFullRunCostSentence(),
  "Record proof for Compare still needs two finalized signed packages (R12). Neither path is draft-to-draft Compare.",
  ARCHITECTURE_DESK_COMPARE_DISABLED_REASON,
  INHABIT_FINDINGS_COMPARE_HELPER,
] as const;

export const CHEAP_EXPLORATION_HELP_SKETCH_A_CHANGE_TECHNICAL_MAPPING_INTRO =
  "Stored review-type tokens stay career and rehearsal while the UI shows Record and Practice on the Working desk. ADR 0092 defines the cheap architecture sketch envelope; ADR 0039 keeps sealed parents immutable." as const;

export const CHEAP_EXPLORATION_HELP_SKETCH_A_CHANGE_ADR_REFERENCES = [
  { id: "0039", path: "docs/architecture/adrs/0039-commit-sealed-evidence-immutability.md" },
  { id: "0092", path: CHEAP_EXPLORATION_ADR_0092_RELATIVE_PATH },
] as const;

export type CheapExplorationHelpSketchAChangeRelatedLink = {
  readonly label: string;
  readonly href: string;
};

export const CHEAP_EXPLORATION_HELP_SKETCH_A_CHANGE_RELATED_TOPICS_HEADING_ID =
  "help-sketch-a-change-related-topics" as const;

export const CHEAP_EXPLORATION_HELP_SKETCH_A_CHANGE_RELATED_TOPICS_HEADING = "Related topics" as const;

export const CHEAP_EXPLORATION_HELP_SKETCH_A_CHANGE_RELATED_TOPICS: readonly CheapExplorationHelpSketchAChangeRelatedLink[] =
  [
    { label: "Impact preview vs architecture envelope", href: CHEAP_EXPLORATION_HELP_IMPACT_PREVIEW_VS_ENVELOPE_PATH },
    { label: "Architecture desk — system, not job", href: inAppHelpHref("architecture-desk") },
    { label: "Record vs Practice on the Working desk", href: inAppHelpHref("career-vs-rehearsal") },
    { label: "Compare two reviews", href: inAppHelpHref("comparison-replay") },
    { label: "Sealed review record vs decision register", href: inAppHelpHref("sealed-record-vs-decision-register") },
    { label: "Which mode am I in?", href: MODE_GRAVITY_HELP_WHICH_MODE_PATH },
  ] as const;

export const CHEAP_EXPLORATION_HELP_SKETCH_A_CHANGE_HELP_RETURN = {
  label: HELP_TOPIC_BREADCRUMB_HUB_LABEL,
  href: HELP_HUB_CANONICAL_PATH,
} as const;

export const CHEAP_EXPLORATION_HELP_SKETCH_A_CHANGE_SPONSOR_PANEL_SCOPE_LEAD_IN =
  "When you move from a desk sketch to sponsor packages, Record finalize and disposition honesty still apply — a Practice clone is not sealed-record proof by itself." as const;

export const CHEAP_EXPLORATION_HELP_SKETCH_A_CHANGE_GUIDE_HEADINGS: readonly HelpMarkdownHeading[] = [
  {
    level: 2,
    id: CHEAP_EXPLORATION_HELP_SKETCH_A_CHANGE_CLAIM_HEADING_ID,
    title: CHEAP_EXPLORATION_HELP_SKETCH_A_CHANGE_PRACTICE_ENVELOPE_TITLE,
  },
  { level: 2, id: "help-sketch-a-change-applicability", title: "Scope and seat applicability" },
  {
    level: 2,
    id: "help-sketch-a-change-record-practice",
    title: CHEAP_EXPLORATION_HELP_SKETCH_A_CHANGE_RECORD_PRACTICE_HEADING,
  },
  { level: 2, id: "help-sketch-a-change-desk-entry", title: CHEAP_EXPLORATION_HELP_SKETCH_A_CHANGE_DESK_ENTRY_HEADING },
  {
    level: 2,
    id: "help-sketch-a-change-seal-compare",
    title: CHEAP_EXPLORATION_HELP_SKETCH_A_CHANGE_SEAL_COMPARE_HEADING,
  },
  { level: 2, id: "help-sketch-a-change-adr-mapping", title: "Technical mapping and ADRs" },
  { level: 2, id: "help-sketch-a-change-where-to-go-next", title: "Where to go next" },
  {
    level: 2,
    id: CHEAP_EXPLORATION_HELP_SKETCH_A_CHANGE_RELATED_TOPICS_HEADING_ID,
    title: CHEAP_EXPLORATION_HELP_SKETCH_A_CHANGE_RELATED_TOPICS_HEADING,
  },
] as const;

/** Drift guard — overview stays positive-only; header claim owns production negation once. */
export const CHEAP_EXPLORATION_HELP_SKETCH_A_CHANGE_NEGATION_DRIFT_MARKERS = {
  overviewMustNotContain: ["not Career proof", "cannot Compare", "does not observe", "not procurement"],
  claimMustContain: "not procurement proof",
} as const;

/** Drift guard — in-app help must not deep-link GitHub blob URLs. */
export const CHEAP_EXPLORATION_HELP_SKETCH_A_CHANGE_FORBIDDEN_LINK_MARKERS = [
  "github.com",
  "/blob/",
] as const;

export const CHEAP_EXPLORATION_HELP_SKETCH_A_CHANGE_ALIASES = [
  "sketch a change",
  "architecture sketch envelope",
  "clone from snapshot",
  "spawn lock clone",
  "cheap envelope sketch",
  "practice sketch",
  "ce-019",
  "adr 0092",
  "r12 branch cap",
  "no unseal",
] as const;
