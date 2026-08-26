/**
 * TB-1650 — Operator inventory surfaces that must use `EnterpriseTable` (not card stacks or raw HTML tables).
 *
 * Contract: `docs/library/UI_DESIGN_SYSTEM.md` § *Operator populated lists* (**TB-1646**).
 * Exemplar migrations: **TB-1647** (Advisory/Alert), **TB-1648** (Slack/Webhooks), **TB-1649** (Recurrence/Digests/Reviews).
 */

import type { OperatorPopulatedListKind } from "@/lib/operator/operator-populated-list-migrate-inventory";

export type OperatorEnterpriseTableAllowlistEntry = {
  readonly id: string;
  readonly modulePath: string;
  readonly kind: OperatorPopulatedListKind;
  readonly notes: string;
};

/** Inventory / master-detail surfaces that must stay on `EnterpriseTable` + `StatusTag`. */
export const OPERATOR_ENTERPRISE_TABLE_ALLOWLIST: readonly OperatorEnterpriseTableAllowlistEntry[] = [
  {
    id: "digests-browse-inventory",
    modulePath: "components/digests/DigestsBrowseContent.tsx",
    kind: "master-detail",
    notes: "Digests browse history grid — TB-1503/TB-1504 honesty columns.",
  },
  {
    id: "digest-subscriptions-inventory",
    modulePath: "components/digests/DigestSubscriptionList.tsx",
    kind: "inventory",
    notes: "Digests Schedule subscriptions tab — TB-1649 action budget.",
  },
  {
    id: "recurrence-schedules-inventory",
    modulePath: "components/governance/RecurrenceSchedulesTable.tsx",
    kind: "inventory",
    notes: "Governance recurrence schedules — TB-1649 buyer scope + cadence disclosure.",
  },
  {
    id: "reviews-hub-inventory",
    modulePath: "app/(operator)/architecture/reviews/_sections/ReviewsHubReviewInventory.tsx",
    kind: "inventory",
    notes: "Reviews hub primary package inventory — TB-1649 StatusTag vocabulary.",
  },
  {
    id: "reviews-hub-recent-packages",
    modulePath: "app/(operator)/architecture/reviews/_sections/ReviewsHubRecentPackages.tsx",
    kind: "inventory",
    notes: "Reviews hub recent-packages strip — EnterpriseTable parity with main inventory.",
  },
  {
    id: "reviews-list-work-queue",
    modulePath: "app/(operator)/architecture/reviews/RunsListClient.tsx",
    kind: "inventory",
    notes: "Reviews work-queue sections — grouped EnterpriseTable inventories.",
  },
  {
    id: "advisory-schedules-inventory",
    modulePath: "components/advisory/AdvisorySchedulesContent.tsx",
    kind: "inventory",
    notes: "Advisory schedules inventory — TB-1647.",
  },
  {
    id: "alert-rules-inventory",
    modulePath: "components/alerts/AlertRulesContent.tsx",
    kind: "inventory",
    notes: "Alert rules Conditions tab inventory — TB-1647.",
  },
  {
    id: "slack-destinations-inventory",
    modulePath: "app/(operator)/integrations/slack/_sections/SlackDestinationsPanel.tsx",
    kind: "inventory",
    notes: "Slack notification destinations — TB-1648.",
  },
  {
    id: "webhooks-subscriptions-inventory",
    modulePath: "app/(operator)/integrations/webhooks/WebhooksSubscriptionsTable.tsx",
    kind: "inventory",
    notes: "Webhook subscriptions inventory — TB-1648.",
  },
] as const;
