/**
 * Route-scored inline hints shown as a dismissible strip below the operator header.
 */

export type PageContextualHint = {
  id: string;
  message: string;
  learnMoreHref?: string;
};

import { GOVERNANCE_AUDIT_PATH } from "@/lib/governance/governance-route-paths";

const HINTS: readonly { prefix: string; hint: PageContextualHint }[] = [
  {
    prefix: GOVERNANCE_AUDIT_PATH,
    hint: {
      id: "audit-trail",
      message: "Save named filter views for repeat investigations. Export CSV when you need an offline audit packet.",
      learnMoreHref: "/help/audit-trail",
    },
  },
  {
    prefix: "/architecture/reviews/",
    hint: {
      id: "review-detail",
      message: "Watch the pipeline timeline while agents run; after commit, use sponsor handoff and exports.",
      learnMoreHref: "/help/review-packages",
    },
  },
  {
    prefix: "/internal/validate-route",
    hint: {
      id: "replay-review",
      message: "Validate stored review output for a single review — not a visual diff.",
      learnMoreHref: "/help/comparison-replay",
    },
  },
  {
    prefix: "/insights/compare-two-reviews",
    hint: {
      id: "compare-reviews",
      message: "Pick two finalized reviews from the lists — no need to paste IDs. Structured review comparison loads first.",
      learnMoreHref: "/help/comparison-replay",
    },
  },
  {
    prefix: "/insights/evidence-graph",
    hint: {
      id: "evidence-graph",
      message: "Choose a review, then load the graph. Use neighborhood view to focus on one decision.",
      learnMoreHref: "/help/evidence-graph",
    },
  },
  {
    prefix: "/governance/policy-packs",
    hint: {
      id: "policy-packs",
      message: "Start from a catalog pack or author rules, then assign packs before your next review.",
      learnMoreHref: "/help/policy-packs",
    },
  },
  {
    prefix: "/governance/findings",
    hint: {
      id: "governance-findings",
      message: "Triage with keyboard: Alt+J/K to move, Alt+1–3 to accept, remediate, or reject when Execute+ is enabled.",
      learnMoreHref: "/help/governance-findings",
    },
  },
  {
    prefix: "/architecture/reviews/new",
    hint: {
      id: "reviews-new",
      message: "Pick a template to pre-fill the wizard, or start blank — you can edit every field before running.",
      learnMoreHref: "/help/first-architecture-review",
    },
  },
  {
    prefix: "/insights/ask-review-questions",
    hint: {
      id: "ask-review",
      message: "Ask plain-language questions scoped to the active review.",
      learnMoreHref: "/help/review-packages",
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
