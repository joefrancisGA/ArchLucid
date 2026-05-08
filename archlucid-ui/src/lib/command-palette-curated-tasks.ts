/**
 * High-value jumps merged into the command palette beside nav links. Each `href` must match
 * a configured nav target so visibility can be gated with {@link visibleOperatorShellHrefSet}.
 */
export type CuratedPaletteTask = {
  label: string;
  href: string;
  /** Extra tokens so “compare” / “graph” match intent-based search. */
  searchValue: string;
};

export const COMMAND_PALETTE_CURATED_TASKS: CuratedPaletteTask[] = [
  { label: "Operator home", href: "/", searchValue: "task I want home start" },
  { label: "Onboarding checklist", href: "/onboarding", searchValue: "task I want onboarding first run checklist" },
  { label: "New architecture review", href: "/reviews/new", searchValue: "task I want new review wizard" },
  { label: "Reviews list", href: "/reviews?projectId=default", searchValue: "task I want reviews list projects" },
  { label: "Compare two reviews", href: "/compare", searchValue: "task I want compare diff N N+1 delta" },
  { label: "Provenance graph", href: "/graph", searchValue: "task I want graph visualization trail" },
  { label: "Ask ArchLucid", href: "/ask", searchValue: "task I want ask question chat" },
  { label: "Semantic search", href: "/search", searchValue: "task I want search find architecture" },
  { label: "Alerts inbox", href: "/alerts", searchValue: "task I want alerts triage inbox" },
  { label: "Alert rules (configure)", href: "/alerts?tab=rules", searchValue: "task I want alert rules configure" },
  { label: "Audit log", href: "/audit", searchValue: "task I want audit compliance csv export evidence" },
  { label: "Digests & subscriptions", href: "/digests", searchValue: "task I want digest email subscriptions" },
  { label: "Policy packs", href: "/policy-packs", searchValue: "task I want policy governance rules" },
  { label: "Governance workflow", href: "/governance", searchValue: "task I want governance approval promotion" },
];
