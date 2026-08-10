/**
 * TB-2196 — Disambiguate header global search (find pages/routes) from
 * `/insights/search-review-evidence` (search the evidence trail).
 *
 * Same verb "Search" meant two jobs; keep labels distinct so operators pick the right surface.
 */

/** Header GlobalSearchBar / command-palette-style find-a-page surface. */
export const GLOBAL_FIND_PAGE_SEARCH = {
  /** Placeholder — keeps "Go to…" command-palette habit. */
  placeholder: "Go to…",
  /** Accessible name for the header combobox (not evidence-trail search). */
  ariaLabel: "Find a page",
  /** Helper clarifying this is navigation/lookup, not evidence retrieval. */
  helper:
    "Find a page, review, finding, policy pack, or help topic. To search the evidence trail, use Search review evidence.",
} as const;

/** `/insights/search-review-evidence` — retrieve across the evidence trail. */
export const EVIDENCE_TRAIL_SEARCH = {
  /** Page H1 and primary nav label. */
  title: "Search review evidence",
  /** Shorter chip/registry label when the full title is too long. */
  shortNavLabel: "Search evidence",
  /** Scoped H1 when a review id is selected. */
  scopedTitle: "Search this review's evidence",
  /** Operator page lead — evidence trail language, distinct from header find-a-page. */
  pageSubtitle:
    "Search the evidence trail for findings, decisions, and signed review records across this workspace.",
  /** Query field placeholder — must not read like header global search. */
  queryPlaceholder:
    "Search the evidence trail for a finding, decision, policy, component, or phrase…",
  /** Visible label above the evidence query input. */
  queryFieldLabel: "Evidence query",
} as const;