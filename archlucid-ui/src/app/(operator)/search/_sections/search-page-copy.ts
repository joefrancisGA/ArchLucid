/** Search page subtitle — tenant-scoped retrieval over signed review records and evidence. */
export const SEARCH_PAGE_SUBTITLE =
  "Find evidence, findings, decisions, and signed review records across this workspace.";

export const SEARCH_QUERY_PLACEHOLDER =
  "Search for a finding, decision, policy, component, or evidence phrase…";

export const SEARCH_REVIEW_FILTER_LABEL = "Limit to review (optional)";

export const SEARCH_REVIEW_FILTER_PLACEHOLDER = "All reviews";

export const SEARCH_EXAMPLE_QUERIES = [
  "PHI boundary",
  "SSO risk",
  "data residency",
  "approval conditions",
  "audit export",
] as const;

export const SEARCH_EXAMPLE_QUERIES_LINE = `Try: ${SEARCH_EXAMPLE_QUERIES.map((q) => `"${q}"`).join(", ")}`;
