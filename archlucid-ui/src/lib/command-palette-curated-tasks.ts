/**
 * High-value jumps merged into the command palette beside nav links. Most `href` values must match
 * a configured nav target so visibility can be gated with {@link visibleOperatorShellHrefSet}.
 * Contextual-only routes (TB-2241) are merged into palette visibility separately in {@link CommandPalette}.
 *
 * Labels are **derived** from {@link getRouteTitle} rather than typed here, so a quick task and the nav
 * row for the same destination can never drift into two names (the palette previously said "Reviews list",
 * "Audit Trail", "Semantic search", and "Alerts inbox" for rows the sidebar called "Reviews", "Audit trail",
 * "Search review evidence", and "Alerts"). Retired wording survives in `searchValue` so old muscle memory
 * still matches. The sidebar is held to the same registry by `nav-route-title-parity.test.ts`.
 */
import { ARCHITECTURE_INTELLIGENCE_PATH } from "@/lib/architecture/architecture-intelligence-route";
import { GOVERNANCE_APPROVAL_QUEUE_PATH } from "@/lib/governance/governance-route-paths";
import { DIGESTS_HUB_PATH } from "@/lib/digests-route-paths";
import {
  FIRST_REVIEW_GUIDE_PATH,
  FIRST_REVIEW_GUIDE_PROGRESS_HEADING_ID,
} from "@/lib/first-review-guide-route";
import { getRouteTitle } from "@/lib/route-titles";

export type CuratedPaletteTask = {
  label: string;
  href: string;
  /** Extra tokens so “compare” / “graph” match intent-based search. */
  searchValue: string;
};

/** Declared shape of a curated row before its label is resolved from the route-title registry. */
type CuratedPaletteTaskSource = {
  href: string;
  searchValue: string;
  /**
   * Only for anchor rows that scroll to a **section** rather than naming the page
   * (same exemption the nav parity guard makes for `#` hrefs).
   */
  sectionLabel?: string;
};

/** Pathname used to gate curated palette tasks against {@link visibleOperatorShellHrefSet}. */
export function commandPaletteNavVisibilityHref(href: string): string {
  const withoutQuery = href.includes("?") ? href.slice(0, href.indexOf("?")) : href;

  if (!withoutQuery.includes("#")) {
    return withoutQuery;
  }

  return withoutQuery.slice(0, withoutQuery.indexOf("#"));
}

const CURATED_PALETTE_TASK_SOURCES: readonly CuratedPaletteTaskSource[] = [
  { href: "/", searchValue: "task I want overview home start workspace" },
  {
    href: `${FIRST_REVIEW_GUIDE_PATH}#${FIRST_REVIEW_GUIDE_PROGRESS_HEADING_ID}`,
    searchValue: "task I want onboarding first run checklist",
    sectionLabel: "Onboarding checklist",
  },
  { href: "/architecture/reviews/new", searchValue: "task I want new architecture review wizard intake" },
  { href: "/architecture/reviews", searchValue: "task I want reviews list projects packages" },
  { href: "/insights/compare-two-reviews", searchValue: "task I want compare diff N N+1 delta" },
  { href: "/insights/evidence-graph", searchValue: "task I want graph visualization trail" },
  { href: "/insights/ask-review-questions", searchValue: "task I want ask archlucid question chat" },
  { href: "/insights/search-review-evidence", searchValue: "task I want semantic search find architecture" },
  { href: "/governance/alerts", searchValue: "task I want alerts triage inbox" },
  { href: "/governance/alert-rules", searchValue: "task I want alert rules configure" },
  { href: "/governance/audit", searchValue: "task I want audit trail compliance csv export evidence" },
  { href: DIGESTS_HUB_PATH, searchValue: "task I want digest email subscriptions" },
  {
    href: ARCHITECTURE_INTELLIGENCE_PATH,
    searchValue: "task I want architecture intelligence closed-loop reasoning refine AI golden harness",
  },
  { href: "/governance/policy-packs", searchValue: "task I want policy rules" },
  { href: GOVERNANCE_APPROVAL_QUEUE_PATH, searchValue: "task I want resolve outcomes promotion" },
];

function toCuratedPaletteTask(source: CuratedPaletteTaskSource): CuratedPaletteTask {
  return {
    label: source.sectionLabel ?? getRouteTitle(source.href),
    href: source.href,
    searchValue: source.searchValue,
  };
}

export const COMMAND_PALETTE_CURATED_TASKS: CuratedPaletteTask[] =
  CURATED_PALETTE_TASK_SOURCES.map(toCuratedPaletteTask);
