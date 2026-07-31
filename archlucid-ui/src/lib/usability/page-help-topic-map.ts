/**
 * Maps operator routes to in-app `/help/{slug}` topics for contextual help buttons.
 */

import { ARCHITECTURES_LIST_PATH } from "@/lib/architecture-routes";
import { ALERTS_HOW_ALERTS_WORK_LABEL } from "@/lib/alerts-page-copy";
import { START_REVIEW_LABEL } from "@/lib/architecture-workflow-labels";
import { BUYER_ONBOARDING_PAGE_TITLE } from "@/lib/buyer-polish-copy";
import { OPERATOR_NAV_LINK_LABELS } from "@/lib/i18n";

export type PageHelpTopic = {
  readonly slug: string;
  readonly label: string;
};

const PAGE_HELP_TOPICS: readonly { prefix: string; topic: PageHelpTopic }[] = [
  { prefix: "/", topic: { slug: "getting-started", label: "Getting started" } },
  { prefix: "/onboarding", topic: { slug: "getting-started", label: BUYER_ONBOARDING_PAGE_TITLE } },
  { prefix: ARCHITECTURES_LIST_PATH, topic: { slug: "getting-started", label: "Getting started" } },
  { prefix: "/reviews/new", topic: { slug: "evidence-intake", label: START_REVIEW_LABEL } },
  { prefix: "/reviews", topic: { slug: "review-packages", label: "Reviews" } },
  { prefix: "/dashboard", topic: { slug: "executive-summary", label: "Executive dashboard" } },
  { prefix: "/graph", topic: { slug: "evidence-trail", label: OPERATOR_NAV_LINK_LABELS.evidenceTrail } },
  { prefix: "/compare", topic: { slug: "comparison-replay", label: "Compare and replay" } },
  { prefix: "/replay", topic: { slug: "comparison-replay", label: "Validate review" } },
  { prefix: "/governance/findings", topic: { slug: "governance-approval", label: OPERATOR_NAV_LINK_LABELS.findings } },
  { prefix: "/governance/audit", topic: { slug: "audit-trail", label: "Audit trail" } },
  {
    prefix: "/governance/alert-rules",
    topic: { slug: "alerts", label: ALERTS_HOW_ALERTS_WORK_LABEL },
  },
  { prefix: "/governance", topic: { slug: "governance-approval", label: "Governance approval" } },
  { prefix: "/audit", topic: { slug: "audit-trail", label: "Audit trail" } },
  { prefix: "/alerts", topic: { slug: "alerts", label: "Alerts" } },
  { prefix: "/alert-rules", topic: { slug: "alerts", label: "How alerts work" } },
  { prefix: "/policy-packs", topic: { slug: "governance-approval", label: "Governance approval" } },
  { prefix: "/sponsor-report", topic: { slug: "executive-summary", label: "Executive summary" } },
  { prefix: "/value-report", topic: { slug: "executive-summary", label: "Executive summary" } },
  { prefix: "/digests", topic: { slug: "how-it-works", label: "Architecture digests" } },
  { prefix: "/planning", topic: { slug: "pilot-feedback", label: "Improvement planning" } },
  { prefix: "/internal-operations/recommendation-learning", topic: { slug: "how-it-works", label: "How recommendation learning works" } },
  { prefix: "/governance/advisory-scans", topic: { slug: "how-it-works", label: "Advisory scans" } },
  { prefix: "/integrations/cloud-connections/azure", topic: { slug: "azure-permissions", label: "Azure permissions" } },
  { prefix: "/settings/cloud-connections/azure", topic: { slug: "azure-permissions", label: "Azure permissions" } },
  { prefix: "/integrations/cloud-connections/aws", topic: { slug: "cloud-connections-aws", label: "AWS cloud connection" } },
  { prefix: "/integrations/cloud-connections/gcp", topic: { slug: "cloud-connections-gcp", label: "GCP cloud connection" } },
  { prefix: "/integrations/cloud-connections", topic: { slug: "cloud-connections", label: "Cloud connections" } },
  { prefix: "/integrations/readiness", topic: { slug: "integration-readiness", label: "How integration readiness works" } },
  { prefix: "/integrations/operations", topic: { slug: "integration-readiness", label: "How integration readiness works" } },
  { prefix: "/admin/integrations/itsm", topic: { slug: "integration-readiness", label: "How integration readiness works" } },
  { prefix: "/settings/cloud-connections/aws", topic: { slug: "cloud-connections-aws", label: "AWS cloud connection" } },
  { prefix: "/settings/cloud-connections/gcp", topic: { slug: "cloud-connections-gcp", label: "GCP cloud connection" } },
  { prefix: "/settings/cloud-connections", topic: { slug: "cloud-connections", label: "Cloud connections" } },
  { prefix: "/settings/tenant", topic: { slug: "getting-started", label: OPERATOR_NAV_LINK_LABELS.settings } },
  { prefix: "/settings/baseline", topic: { slug: "pilot-roi-model", label: "View ROI methodology" } },
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
