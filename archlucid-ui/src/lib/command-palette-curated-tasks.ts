/**
 * High-value jumps merged into the command palette beside nav links. Each `href` must match
 * a configured nav target so visibility can be gated with {@link visibleOperatorShellHrefSet}.
 */
import { GOVERNANCE_APPROVAL_QUEUE_PATH } from "@/lib/governance-route-paths";
import { DIGESTS_HUB_PATH } from "@/lib/digests-route-paths";
import { OPERATOR_NAV_LINK_LABELS } from "@/lib/i18n";

export type CuratedPaletteTask = {
  label: string;
  href: string;
  /** Extra tokens so “compare” / “graph” match intent-based search. */
  searchValue: string;
};

export const COMMAND_PALETTE_CURATED_TASKS: CuratedPaletteTask[] = [
  { label: OPERATOR_NAV_LINK_LABELS.home, href: "/", searchValue: "task I want overview home start workspace" },
  { label: "Onboarding checklist", href: "/architecture/first-review-guide", searchValue: "task I want onboarding first run checklist" },
  { label: "New architecture review", href: "/architecture/reviews/new", searchValue: "task I want new review wizard" },
  { label: "Reviews list", href: "/architecture/reviews", searchValue: "task I want reviews list projects" },
  { label: "Compare two reviews", href: "/insights/compare-two-reviews", searchValue: "task I want compare diff N N+1 delta" },
  { label: OPERATOR_NAV_LINK_LABELS.evidenceGraph, href: "/insights/evidence-graph", searchValue: "task I want graph visualization trail" },
  { label: "Ask ArchLucid", href: "/insights/ask-review-questions", searchValue: "task I want ask question chat" },
  { label: "Semantic search", href: "/insights/search-review-evidence", searchValue: "task I want search find architecture" },
  { label: "Alerts inbox", href: "/governance/alerts", searchValue: "task I want alerts triage inbox" },
  { label: "Alert rules (configure)", href: "/governance/alert-rules", searchValue: "task I want alert rules configure" },
  { label: "Audit Trail", href: "/governance/audit", searchValue: "task I want audit compliance csv export evidence" },
  { label: "Digests & subscriptions", href: DIGESTS_HUB_PATH, searchValue: "task I want digest email subscriptions" },
  { label: "Policy packs", href: "/governance/policy-packs", searchValue: "task I want policy governance rules" },
  { label: "Approval queue", href: GOVERNANCE_APPROVAL_QUEUE_PATH, searchValue: "task I want governance approval promotion" },
];
