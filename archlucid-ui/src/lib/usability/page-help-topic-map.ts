/**
 * Maps operator routes to in-app `/help/{slug}` topics for contextual help buttons.
 */

import { CREATE_ARCHITECTURE_LABEL } from "@/lib/architecture-workflow-labels";
import { BUYER_ONBOARDING_PAGE_TITLE } from "@/lib/buyer-polish-copy";

export type PageHelpTopic = {
  readonly slug: string;
  readonly label: string;
};

const PAGE_HELP_TOPICS: readonly { prefix: string; topic: PageHelpTopic }[] = [
  { prefix: "/", topic: { slug: "getting-started", label: "Getting started" } },
  { prefix: "/onboarding", topic: { slug: "getting-started", label: BUYER_ONBOARDING_PAGE_TITLE } },
  { prefix: "/reviews/new", topic: { slug: "evidence-intake", label: CREATE_ARCHITECTURE_LABEL } },
  { prefix: "/reviews", topic: { slug: "review-packages", label: "Review packages" } },
  { prefix: "/dashboard", topic: { slug: "executive-summary", label: "Executive dashboard" } },
  { prefix: "/graph", topic: { slug: "evidence-trail", label: "Evidence trail" } },
  { prefix: "/compare", topic: { slug: "comparison-replay", label: "Compare and replay" } },
  { prefix: "/replay", topic: { slug: "comparison-replay", label: "Validate review package" } },
  { prefix: "/governance", topic: { slug: "governance-approval", label: "Governance approval" } },
  { prefix: "/audit", topic: { slug: "audit-trail", label: "Audit trail" } },
  { prefix: "/alerts", topic: { slug: "alerts", label: "Alerts" } },
  { prefix: "/policy-packs", topic: { slug: "governance-approval", label: "Governance approval" } },
  { prefix: "/value-report", topic: { slug: "executive-summary", label: "Executive summary" } },
  { prefix: "/integrations/cloud-connections/azure", topic: { slug: "cloud-connections-azure", label: "Azure cloud connection" } },
  { prefix: "/settings/cloud-connections/azure", topic: { slug: "cloud-connections-azure", label: "Azure cloud connection" } },
  { prefix: "/integrations/cloud-connections/aws", topic: { slug: "cloud-connections", label: "Cloud connections" } },
  { prefix: "/integrations/cloud-connections/gcp", topic: { slug: "cloud-connections", label: "Cloud connections" } },
  { prefix: "/integrations/cloud-connections", topic: { slug: "cloud-connections", label: "Cloud connections" } },
  { prefix: "/settings/cloud-connections/aws", topic: { slug: "cloud-connections", label: "Cloud connections" } },
  { prefix: "/settings/cloud-connections/gcp", topic: { slug: "cloud-connections", label: "Cloud connections" } },
  { prefix: "/settings/cloud-connections", topic: { slug: "cloud-connections", label: "Cloud connections" } },
  { prefix: "/help", topic: { slug: "getting-started", label: "Help" } },
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
