import { FIRST_ARCHITECTURE_REVIEW_HELP_PATH } from "@/lib/first-architecture-review-help-route";

/**
 * Traffic workbook row ID for legacy `/help/evidence-only-review` alias.
 * Owner backlog shorthand: HEV (twin folded into COR / first-architecture-review).
 */
export const EVIDENCE_ONLY_REVIEW_HELP_ALIAS_TRAFFIC_ROW_ID = "HEV";

/** Canonical path tracked on the HEV workbook row. */
export const EVIDENCE_ONLY_REVIEW_HELP_ALIAS_TRAFFIC_PATH = "/help/evidence-only-review";

/** Canonical first-review help path that HEV resolves to (workbook row COR). */
export const EVIDENCE_ONLY_REVIEW_HELP_ALIAS_CANONICAL_PATH = FIRST_ARCHITECTURE_REVIEW_HELP_PATH;

/** Workbook Section column value - retired slug alias under Help. */
export const EVIDENCE_ONLY_REVIEW_HELP_ALIAS_TRAFFIC_SECTION = "Help alias";

/**
 * Owner workbook Notes for HEV - documents Evidence chrome inherited via HelpCorePilotGuideView.
 * ASCII-only for Windows console note scripts.
 */
export const EVIDENCE_ONLY_REVIEW_HELP_ALIAS_TRAFFIC_NOTE =
 "Deprecated evidence-only-review help alias (Help alias) - slug alias evidence-only-review -> first-architecture-review (prefer #fast-path-evidence-only); renders HelpCorePilotGuideView Evidence chrome (Sources strip + claim-discipline + PageContextualHelp + Category-1 on alias path). Canon COR = /help/first-architecture-review. Body lives in CORE_PILOT.md (TB-1683). Sibling ECO/FIR/HFE = other COR aliases. Does not imply CPA SOC 2 or third-party pen-test publication. Score 52/100 (2026-08-07) - help-topic orientation hard-caps higher Evidence (alias inherits COR). Owner pass: Evidence chrome shipped; cannot improve further toward 80 without turning this into a signed-record diligence Sources trail.";
