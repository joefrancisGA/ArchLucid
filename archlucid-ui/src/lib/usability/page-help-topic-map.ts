/**
 * Maps operator routes to in-app `/help/{slug}` topics for contextual help buttons.
 */

export type PageHelpTopic = {
  readonly slug: string;
  readonly label: string;
};

const PAGE_HELP_TOPICS: readonly { prefix: string; topic: PageHelpTopic }[] = [
  { prefix: "/", topic: { slug: "getting-started", label: "Getting started" } },
  { prefix: "/onboarding", topic: { slug: "getting-started", label: "Getting started" } },
  { prefix: "/reviews/new", topic: { slug: "evidence-intake", label: "Evidence intake" } },
  { prefix: "/reviews", topic: { slug: "review-packages", label: "Review packages" } },
  { prefix: "/dashboard", topic: { slug: "executive-summary", label: "Executive summary" } },
  { prefix: "/graph", topic: { slug: "evidence-trail", label: "Evidence trail" } },
  { prefix: "/compare", topic: { slug: "comparison-replay", label: "Compare and replay" } },
  { prefix: "/replay", topic: { slug: "comparison-replay", label: "Compare and replay" } },
  { prefix: "/governance", topic: { slug: "governance-approval", label: "Governance approval" } },
  { prefix: "/audit", topic: { slug: "audit-trail", label: "Audit trail" } },
  { prefix: "/alerts", topic: { slug: "alerts", label: "Alerts" } },
  { prefix: "/policy-packs", topic: { slug: "governance-approval", label: "Governance approval" } },
  { prefix: "/value-report", topic: { slug: "executive-summary", label: "Executive summary" } },
  { prefix: "/help", topic: { slug: "operator-shell", label: "Operator shell" } },
];

export function pageHelpTopicForPathname(pathname: string): PageHelpTopic | null {
  const path = (pathname ?? "").split("?")[0] ?? "";

  if (path === "/") {
    return PAGE_HELP_TOPICS.find((row) => row.prefix === "/")?.topic ?? null;
  }

  const sorted = [...PAGE_HELP_TOPICS].sort((left, right) => right.prefix.length - left.prefix.length);

  for (const row of sorted) {
    if (row.prefix === "/") {
      continue;
    }

    if (path === row.prefix || path.startsWith(`${row.prefix}/`)) {
      return row.topic;
    }
  }

  return null;
}
