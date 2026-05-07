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
  { label: "Operator home", href: "/", searchValue: "task home start" },
  { label: "Onboarding checklist", href: "/onboarding", searchValue: "task onboarding first run checklist" },
  { label: "New architecture review", href: "/reviews/new", searchValue: "task new review wizard" },
  { label: "Reviews list", href: "/reviews?projectId=default", searchValue: "task reviews list projects" },
  { label: "Compare reviews", href: "/compare", searchValue: "task compare diff two runs" },
  { label: "Provenance graph", href: "/graph", searchValue: "task graph visualization" },
  { label: "Ask ArchLucid", href: "/ask", searchValue: "task ask question chat" },
  { label: "Alerts inbox", href: "/alerts", searchValue: "task alerts triage" },
  { label: "Policy packs", href: "/policy-packs", searchValue: "task policy governance rules" },
  { label: "Governance workflow", href: "/governance", searchValue: "task governance approval promotion" },
];
