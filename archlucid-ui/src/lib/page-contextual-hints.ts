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
    prefix: "/policy-packs",
    hint: {
      id: "policy-packs",
      message: "Start from a named template, then dry-run against a past review before publishing.",
      learnMoreHref: "/help/governance-approval",
    },
  },
  {
    prefix: "/reviews/",
    hint: {
      id: "review-detail",
      message: "Watch the pipeline timeline while agents run; after commit, use sponsor handoff and exports.",
      learnMoreHref: "/help/review-packages",
    },
  },
  {
    prefix: "/replay",
    hint: {
      id: "replay-review",
      message: "Validate stored review output for a single review package — not a visual diff.",
      learnMoreHref: "/help/comparison-replay",
    },
  },
  {
    prefix: "/ask",
    hint: {
      id: "ask-review",
      message: "Ask plain-language questions scoped to the active review package.",
      learnMoreHref: "/help/review-packages",
    },
  },
  {
    prefix: "/dashboard",
    hint: {
      id: "executive-dashboard",
      message: "Sponsor-safe ROI and risk posture for the active workspace.",
      learnMoreHref: "/help/executive-summary",
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
