/**
 * Route-scored inline hints shown as a dismissible strip below the operator header.
 */

export type PageContextualHint = {
  id: string;
  message: string;
  learnMoreHref?: string;
};

const HINTS: readonly { prefix: string; hint: PageContextualHint }[] = [
  {
    prefix: "/reviews/new",
    hint: {
      id: "reviews-new-path",
      message: "Choose Quick review for a pasted brief, Guided intake for admission questions, or Full wizard when you need templates and evidence upload.",
      learnMoreHref: "/help/path-chooser",
    },
  },
  {
    prefix: "/governance/findings",
    hint: {
      id: "governance-findings-queue",
      message: "Filter by severity or stale status, then open a finding to jump to its evidence trail.",
      learnMoreHref: "/help/governance-approval",
    },
  },
  {
    prefix: "/audit",
    hint: {
      id: "audit-trail",
      message: "Save named filter views for repeat investigations. Export CSV when you need an offline audit packet.",
      learnMoreHref: "/help/audit-trail",
    },
  },
  {
    prefix: "/compare",
    hint: {
      id: "compare-reviews",
      message: "Pick two finalized review packages to see manifest diff and finding deltas.",
      learnMoreHref: "/help/review-packages",
    },
  },
  {
    prefix: "/graph",
    hint: {
      id: "evidence-graph",
      message: "Start in review-trail mode for finding-centric provenance; expand to the full knowledge graph when needed.",
      learnMoreHref: "/help/evidence-trail",
    },
  },
  {
    prefix: "/policy-packs",
    hint: {
      id: "policy-packs",
      message: "Start from a named template, then dry-run against a past review before publishing.",
      learnMoreHref: "/help/governance-approval",
    },
  },
];

export function pageContextualHintForPathname(pathname: string): PageContextualHint | null {
  const path = (pathname ?? "").split("?")[0] ?? "";

  for (const row of HINTS)
  {
    if (path === row.prefix || path.startsWith(`${row.prefix}/`)) {
      return row.hint;
    }
  }

  return null;
}

export function pageHintDismissStorageKey(hintId: string): string {
  return `archlucid.pageHint.dismissed.${hintId}`;
}
